import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { calculateOpenAICost } from "@/lib/track-usage";

export const dynamic = "force-dynamic";

// Free tier limits
const FREE_TIER_LIMITS = {
  openai: {
    credits: 5.00, // $5 for new accounts (pay-as-you-go after)
  },
  supabase: {
    database: 500 * 1024 * 1024, // 500 MB in bytes
    storage: 1024 * 1024 * 1024, // 1 GB in bytes
    bandwidth: 5 * 1024 * 1024 * 1024, // 5 GB in bytes
    maus: 50000, // Monthly Active Users
  },
};

interface UsageStats {
  service: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  avgDurationMs: number;
  estimatedCost: number;
}

interface DailyUsage {
  date: string;
  openai: number;
  whisper: number;
  smtp: number;
}

interface OpenAICosts {
  totalCost: number;
  dailyCosts: { date: string; cost: number }[];
  error?: string;
}

interface SupabaseUsage {
  databaseSize: number; // bytes
  storageSize: number; // bytes
  egress: number; // bytes
  cachedEgress: number; // bytes
  maus: number; // Monthly Active Users
  error?: string;
}

// Fetch OpenAI costs from their Usage API
// Note: The Usage API requires an Admin API key (sk-admin-*)
// Regular project keys (sk-proj-*) will get 401 errors on this endpoint
async function fetchOpenAICosts(): Promise<OpenAICosts> {
  // Prefer admin key for usage API, fall back to regular key
  const adminKey = process.env.OPENAI_ADMIN_KEY || process.env.OPENAI_API_KEY;
  if (!adminKey) {
    return { totalCost: 0, dailyCosts: [], error: "No API key configured" };
  }

  try {
    // Get usage for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startTime = Math.floor(thirtyDaysAgo.getTime() / 1000);

    // Use the new Usage API endpoint for completions
    const response = await fetch(
      `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&bucket_width=1d&limit=30`,
      {
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Usage API error:", response.status, errorText);
      
      // Handle specific error cases
      if (response.status === 401 || response.status === 403) {
        return { totalCost: 0, dailyCosts: [], error: "Usage API requires admin key" };
      }
      return { totalCost: 0, dailyCosts: [], error: `API error: ${response.status}` };
    }

    const data = await response.json();
    
    // Parse the response - calculate cost from token usage
    let totalCost = 0;
    const dailyCosts: { date: string; cost: number }[] = [];

    // The usage API returns token counts, we need to estimate cost
    // GPT-4o-mini: $0.15/1M input, $0.60/1M output tokens
    if (data.data && Array.isArray(data.data)) {
      for (const bucket of data.data) {
        const inputTokens = bucket.input_tokens || 0;
        const outputTokens = bucket.output_tokens || 0;
        // Calculate cost (GPT-4o-mini pricing)
        const cost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006);
        totalCost += cost;
        
        if (bucket.start_time) {
          const date = new Date(bucket.start_time * 1000).toISOString().split("T")[0];
          dailyCosts.push({ date, cost: Math.round(cost * 10000) / 10000 });
        }
      }
    }

    return { totalCost: Math.round(totalCost * 10000) / 10000, dailyCosts };
  } catch (error) {
    console.error("Error fetching OpenAI usage:", error);
    return { totalCost: 0, dailyCosts: [], error: "Failed to fetch usage" };
  }
}

// Fetch Supabase usage via direct database queries
async function fetchSupabaseUsage(): Promise<SupabaseUsage> {
  const defaultUsage: SupabaseUsage = {
    databaseSize: 0,
    storageSize: 0,
    egress: 0,
    cachedEgress: 0,
    maus: 0,
  };

  try {
    const supabase = createAdminClient();

    // Query database size using pg_database_size
    let databaseSize = 0;
    try {
      const { data: dbData, error: dbError } = await supabase
        .rpc("get_database_size")
        .single();
      
      if (!dbError && dbData && typeof dbData === "number") {
        databaseSize = dbData;
      } else {
        // Fallback: estimate from table count (rough)
        // This won't be accurate but provides something
        console.log("get_database_size RPC not available, using fallback");
      }
    } catch (e) {
      console.log("Database size query failed, using fallback");
    }

    // Query storage size by listing all buckets and their objects
    let storageSize = 0;
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (!bucketsError && buckets) {
        for (const bucket of buckets) {
          const { data: files, error: filesError } = await supabase.storage
            .from(bucket.name)
            .list("", { limit: 1000 });
          
          if (!filesError && files) {
            for (const file of files) {
              // Files have metadata with size
              if (file.metadata?.size) {
                storageSize += file.metadata.size;
              }
            }
          }
        }
      }
    } catch (e) {
      console.log("Storage size query failed");
    }

    // Note: Egress and MAUs aren't available via direct queries
    // These would require the Management API with proper access
    // For now, we link to the Supabase dashboard for these metrics

    return {
      databaseSize,
      storageSize,
      egress: 0, // Not available via direct query
      cachedEgress: 0,
      maus: 0,
      // Only show error if we couldn't get any data
      error: databaseSize === 0 && storageSize === 0 ? "Create get_database_size RPC function for accurate data" : undefined,
    };
  } catch (error) {
    console.error("Error fetching Supabase usage:", error);
    return {
      ...defaultUsage,
      error: "Failed to fetch usage",
    };
  }
}

// Fly.io machine status interface
interface FlyMachine {
  id: string;
  name: string;
  state: string; // "started", "stopped", "created", etc.
  region: string;
  config: {
    guest?: {
      cpu_kind?: string;
      cpus?: number;
      memory_mb?: number;
    };
  };
  created_at: string;
}

interface FlyMachineStatus {
  machines: {
    id: string;
    name: string;
    state: string;
    region: string;
    cpu: string;
    memory: string;
  }[];
  totalMachines: number;
  runningMachines: number;
  appName: string | null;
  error?: string;
}

// Fetch Fly.io machine status
async function fetchFlyMachines(): Promise<FlyMachineStatus> {
  const apiToken = process.env.FLY_API_TOKEN;
  const appName = process.env.FLY_APP_NAME;

  if (!apiToken || !appName) {
    return {
      machines: [],
      totalMachines: 0,
      runningMachines: 0,
      appName: null,
      error: "Add FLY_API_TOKEN and FLY_APP_NAME to .env.local",
    };
  }

  try {
    const response = await fetch(
      `https://api.machines.dev/v1/apps/${appName}/machines`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fly.io API error:", response.status, errorText);
      return {
        machines: [],
        totalMachines: 0,
        runningMachines: 0,
        appName,
        error: `API error: ${response.status}`,
      };
    }

    const machines: FlyMachine[] = await response.json();
    
    const formattedMachines = machines.map((m) => ({
      id: m.id,
      name: m.name || m.id.slice(0, 8),
      state: m.state,
      region: m.region,
      cpu: m.config?.guest?.cpu_kind || "shared",
      memory: m.config?.guest?.memory_mb ? `${m.config.guest.memory_mb}MB` : "256MB",
    }));

    return {
      machines: formattedMachines,
      totalMachines: machines.length,
      runningMachines: machines.filter((m) => m.state === "started").length,
      appName,
    };
  } catch (error) {
    console.error("Error fetching Fly.io machines:", error);
    return {
      machines: [],
      totalMachines: 0,
      runningMachines: 0,
      appName,
      error: "Failed to fetch machine status",
    };
  }
}


export async function GET() {
  try {
    const supabase = createAdminClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all data in parallel
    const [usageResult, openaiCosts, supabaseUsage, whisperHealth, flyMachines] = await Promise.all([
      supabase
        .from("service_usage")
        .select("*")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false }),
      fetchOpenAICosts(),
      fetchSupabaseUsage(),
      fetchWhisperHealth(),
      fetchFlyMachines(),
    ]);

    const records = usageResult.data || [];

    // Aggregate stats by service
    const serviceStats: Record<string, UsageStats> = {
      openai: {
        service: "openai",
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        avgDurationMs: 0,
        estimatedCost: 0,
      },
      whisper: {
        service: "whisper",
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        avgDurationMs: 0,
        estimatedCost: 0,
      },
      smtp: {
        service: "smtp",
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        avgDurationMs: 0,
        estimatedCost: 0,
      },
    };

    // Track duration totals for averaging
    const durationTotals: Record<string, number> = { openai: 0, whisper: 0, smtp: 0 };

    // Daily usage for charts
    const dailyUsageMap: Record<string, { openai: number; whisper: number; smtp: number }> = {};

    for (const record of records) {
      const service = record.service_name as keyof typeof serviceStats;
      if (!serviceStats[service]) continue;

      const stats = serviceStats[service];
      stats.totalCalls++;
      
      if (record.success) {
        stats.successfulCalls++;
      } else {
        stats.failedCalls++;
      }

      if (record.tokens_used) {
        stats.completionTokens += record.tokens_used;
        stats.totalTokens += record.tokens_used;
      }
      if (record.prompt_tokens) {
        stats.promptTokens += record.prompt_tokens;
        stats.totalTokens += record.prompt_tokens;
      }
      if (record.duration_ms) {
        durationTotals[service] += record.duration_ms;
      }

      // Daily aggregation
      const date = new Date(record.created_at).toISOString().split("T")[0];
      if (!dailyUsageMap[date]) {
        dailyUsageMap[date] = { openai: 0, whisper: 0, smtp: 0 };
      }
      if (service === "openai" || service === "whisper" || service === "smtp") {
        dailyUsageMap[date][service]++;
      }
    }

    // Calculate averages and costs
    for (const service of Object.keys(serviceStats) as Array<keyof typeof serviceStats>) {
      const stats = serviceStats[service];
      if (stats.totalCalls > 0) {
        stats.avgDurationMs = Math.round(durationTotals[service] / stats.totalCalls);
      }
      if (service === "openai") {
        stats.estimatedCost = calculateOpenAICost(stats.promptTokens, stats.completionTokens);
      }
    }

    // Convert daily map to array sorted by date
    const dailyUsage: DailyUsage[] = Object.entries(dailyUsageMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build billing info
    const billing = {
      openai: {
        actualCost: openaiCosts.totalCost,
        dailyCosts: openaiCosts.dailyCosts,
        limit: FREE_TIER_LIMITS.openai.credits,
        percentUsed: Math.min(100, (openaiCosts.totalCost / FREE_TIER_LIMITS.openai.credits) * 100),
        error: openaiCosts.error,
      },
      supabase: {
        database: {
          used: supabaseUsage.databaseSize,
          limit: FREE_TIER_LIMITS.supabase.database,
          percentUsed: Math.min(100, (supabaseUsage.databaseSize / FREE_TIER_LIMITS.supabase.database) * 100),
        },
        storage: {
          used: supabaseUsage.storageSize,
          limit: FREE_TIER_LIMITS.supabase.storage,
          percentUsed: Math.min(100, (supabaseUsage.storageSize / FREE_TIER_LIMITS.supabase.storage) * 100),
        },
        egress: {
          used: supabaseUsage.egress,
          cached: supabaseUsage.cachedEgress,
          limit: FREE_TIER_LIMITS.supabase.bandwidth,
          percentUsed: Math.min(100, (supabaseUsage.egress / FREE_TIER_LIMITS.supabase.bandwidth) * 100),
        },
        maus: {
          used: supabaseUsage.maus,
          limit: FREE_TIER_LIMITS.supabase.maus,
          percentUsed: Math.min(100, (supabaseUsage.maus / FREE_TIER_LIMITS.supabase.maus) * 100),
        },
        error: supabaseUsage.error,
      },
    };

    return NextResponse.json({
      stats: Object.values(serviceStats),
      dailyUsage,
      whisperStatus: whisperHealth,
      billing,
      flyio: flyMachines,
      limits: FREE_TIER_LIMITS,
      period: {
        start: thirtyDaysAgo.toISOString(),
        end: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in usage API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function fetchWhisperHealth(): Promise<"online" | "offline" | "unknown"> {
  try {
    const whisperUrl = process.env.WHISPER_API_URL || "http://localhost:9000";
    const healthRes = await fetch(`${whisperUrl}/health`, { 
      method: "GET",
      signal: AbortSignal.timeout(5000) 
    });
    return healthRes.ok ? "online" : "offline";
  } catch {
    return "offline";
  }
}
