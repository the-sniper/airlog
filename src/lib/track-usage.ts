import { createAdminClient } from "@/lib/supabase/server";

export type ServiceName = "openai" | "whisper" | "supabase" | "smtp";

interface TrackUsageParams {
  service: ServiceName;
  endpoint: string;
  tokensUsed?: number;
  promptTokens?: number;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Tracks API usage to external services for monitoring and cost estimation.
 * This function is fire-and-forget - errors are logged but don't throw.
 */
export async function trackUsage(params: TrackUsageParams): Promise<void> {
  const {
    service,
    endpoint,
    tokensUsed,
    promptTokens,
    durationMs,
    success = true,
    errorMessage,
    metadata,
  } = params;

  try {
    const supabase = createAdminClient();
    await supabase.from("service_usage").insert({
      service_name: service,
      endpoint,
      tokens_used: tokensUsed,
      prompt_tokens: promptTokens,
      duration_ms: durationMs,
      success,
      error_message: errorMessage,
      metadata,
    });
  } catch (error) {
    // Log but don't throw - tracking shouldn't break the main flow
    console.error("[trackUsage] Failed to log usage:", error);
  }
}

// OpenAI pricing per 1M tokens (as of Dec 2024)
const OPENAI_PRICING = {
  "gpt-4o-mini": {
    input: 0.15, // $ per 1M tokens
    output: 0.60, // $ per 1M tokens
  },
  "gpt-4o": {
    input: 2.50,
    output: 10.0,
  },
};

/**
 * Calculate estimated cost for OpenAI usage
 */
export function calculateOpenAICost(
  promptTokens: number,
  completionTokens: number,
  model: keyof typeof OPENAI_PRICING = "gpt-4o-mini"
): number {
  const pricing = OPENAI_PRICING[model] || OPENAI_PRICING["gpt-4o-mini"];
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Helper to track OpenAI API calls with usage information
 */
export async function trackOpenAIUsage(
  endpoint: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined,
  durationMs: number,
  success: boolean = true,
  errorMessage?: string,
  model: string = "gpt-4o-mini"
): Promise<void> {
  return trackUsage({
    service: "openai",
    endpoint,
    tokensUsed: usage?.completion_tokens,
    promptTokens: usage?.prompt_tokens,
    durationMs,
    success,
    errorMessage,
    metadata: { model, totalTokens: usage?.total_tokens },
  });
}

/**
 * Helper to track Whisper API calls
 */
export async function trackWhisperUsage(
  durationMs: number,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  return trackUsage({
    service: "whisper",
    endpoint: "/asr",
    durationMs,
    success,
    errorMessage,
  });
}

/**
 * Helper to track SMTP email sends
 */
export async function trackSMTPUsage(
  endpoint: string,
  durationMs: number,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  return trackUsage({
    service: "smtp",
    endpoint,
    durationMs,
    success,
    errorMessage,
  });
}
