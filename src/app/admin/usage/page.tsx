"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Cpu,
  Database,
  Mail,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Cloud,
  MapPin,
  Server,
  MemoryStick,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ServiceStats {
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

interface BillingData {
  openai: {
    actualCost: number;
    dailyCosts: { date: string; cost: number }[];
    limit: number;
    percentUsed: number;
    error?: string;
  };
  supabase: {
    database: {
      used: number;
      limit: number;
      percentUsed: number;
    };
    storage: {
      used: number;
      limit: number;
      percentUsed: number;
    };
    egress: {
      used: number;
      cached: number;
      limit: number;
      percentUsed: number;
    };
    maus: {
      used: number;
      limit: number;
      percentUsed: number;
    };
    error?: string;
  };
}

interface FlyioData {
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
  estimatedMonthlyCost: number;
  error?: string;
}

interface UsageData {
  stats: ServiceStats[];
  dailyUsage: DailyUsage[];
  whisperStatus: "online" | "offline" | "unknown";
  billing?: BillingData;
  flyio?: FlyioData;
  period: {
    start: string;
    end: string;
  };
}

const SERVICE_CONFIG = {
  openai: {
    name: "OpenAI API",
    description: "GPT-4o-mini for classification & summaries",
    icon: Zap,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    dashboardUrl: "https://platform.openai.com/usage",
  },
  whisper: {
    name: "Whisper Service",
    description: "Self-hosted speech-to-text transcription",
    icon: Cpu,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    dashboardUrl:
      process.env.NEXT_PUBLIC_WHISPER_URL || "http://localhost:9000",
  },
  smtp: {
    name: "Email Service",
    description: "SMTP for notifications & reports",
    icon: Mail,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    dashboardUrl: null,
  },
  supabase: {
    name: "Supabase",
    description: "Database & storage",
    icon: Database,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    dashboardUrl: "https://supabase.com/dashboard",
  },
};

function ServiceCard({
  service,
  stats,
  whisperStatus,
}: {
  service: keyof typeof SERVICE_CONFIG;
  stats?: ServiceStats;
  whisperStatus?: "online" | "offline" | "unknown";
}) {
  const config = SERVICE_CONFIG[service];
  const Icon = config.icon;

  const getStatusBadge = () => {
    // Whisper has its own health check
    if (service === "whisper" && whisperStatus) {
      if (whisperStatus === "online") {
        return (
          <Tooltip content="Whisper service is responding to health checks">
            <Badge
              variant="outline"
              className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 cursor-help"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Online
            </Badge>
          </Tooltip>
        );
      }
      if (whisperStatus === "offline") {
        return (
          <Tooltip content="Whisper service is not responding. Check if the server is running.">
            <Badge
              variant="outline"
              className="text-red-500 border-red-500/30 bg-red-500/10 cursor-help"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          </Tooltip>
        );
      }
      return (
        <Tooltip content="Unable to determine Whisper service status">
          <Badge
            variant="outline"
            className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10 cursor-help"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        </Tooltip>
      );
    }

    // For other services, show status based on success rate
    if (stats && stats.totalCalls > 0) {
      const successRate = Math.round(
        (stats.successfulCalls / stats.totalCalls) * 100
      );
      if (successRate >= 95) {
        return (
          <Tooltip
            content={`${successRate}% success rate over last 30 days. Service is healthy.`}
          >
            <Badge
              variant="outline"
              className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 cursor-help"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Healthy
            </Badge>
          </Tooltip>
        );
      }
      if (successRate >= 80) {
        return (
          <Tooltip
            content={`${successRate}% success rate. Some requests are failing.`}
          >
            <Badge
              variant="outline"
              className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10 cursor-help"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Warning
            </Badge>
          </Tooltip>
        );
      }
      return (
        <Tooltip
          content={`${successRate}% success rate. Many requests are failing.`}
        >
          <Badge
            variant="outline"
            className="text-red-500 border-red-500/30 bg-red-500/10 cursor-help"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Issues
          </Badge>
        </Tooltip>
      );
    }

    // No usage data yet
    return (
      <Tooltip content="No API calls recorded in the last 30 days">
        <Badge
          variant="outline"
          className="text-muted-foreground border-muted-foreground/30 bg-muted-foreground/10 cursor-help whitespace-nowrap"
        >
          <Activity className="w-3 h-3 mr-1" />
          No Data
        </Badge>
      </Tooltip>
    );
  };

  const successRate =
    stats && stats.totalCalls > 0
      ? Math.round((stats.successfulCalls / stats.totalCalls) * 100)
      : 100;

  return (
    <Card
      className={`${config.borderColor} border-2 hover:shadow-lg transition-all flex flex-col`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                {config.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.description}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{stats?.totalCalls || 0}</p>
              <p className="text-xs text-muted-foreground">Total Calls</p>
            </div>
            <div className="text-right">
              <p
                className={`text-2xl font-bold ${
                  successRate >= 95
                    ? "text-emerald-500"
                    : successRate >= 80
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {successRate}%
              </p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
          </div>

          {service === "openai" && stats && (
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tokens Used</span>
                <span className="font-medium">
                  {stats.totalTokens.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Cost (30d)</span>
                <span className="font-medium text-emerald-500">
                  ${stats.estimatedCost.toFixed(4)}
                </span>
              </div>
            </div>
          )}

          {stats && stats.avgDurationMs > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t border-border/50">
              <span className="text-muted-foreground">Avg. Latency</span>
              <span className="font-medium">{stats.avgDurationMs}ms</span>
            </div>
          )}
        </div>

        {config.dashboardUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => window.open(config.dashboardUrl, "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-2" />
            Open Dashboard
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function UsageChart({ data }: { data: DailyUsage[] }) {
  // Format dates for display
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">API Usage Over Time</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No usage data yet</p>
              <p className="text-sm">
                Data will appear here as you use the services
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                allowDecimals={false}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="openai"
                name="OpenAI"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="whisper"
                name="Whisper"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="smtp"
                name="Email"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: "#a855f7", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-[220px]">
            <CardContent className="p-6">
              <Skeleton className="h-10 w-10 rounded-xl mb-4" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48 mb-6" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="h-[380px]">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/usage");
      if (!res.ok) throw new Error("Failed to fetch usage data");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getServiceStats = (service: string): ServiceStats | undefined => {
    return data?.stats.find((s) => s.service === service);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Service Usage</h1>
            <p className="text-muted-foreground">Monitor API usage and costs</p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Service Usage</h1>
          <p className="text-muted-foreground">
            Monitor API usage and costs • Last 30 days
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-500/20 bg-red-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          <ServiceCard service="openai" stats={getServiceStats("openai")} />
          <ServiceCard
            service="whisper"
            stats={getServiceStats("whisper")}
            whisperStatus={data?.whisperStatus}
          />
          <ServiceCard service="smtp" stats={getServiceStats("smtp")} />
        </div>

        {/* Billing & Limits */}
        {data?.billing && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {/* OpenAI Billing */}
            <Card className="border-emerald-500/20 border-2 flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10">
                      <Zap className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        OpenAI Spending
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Last 30 days
                      </p>
                    </div>
                  </div>
                  {data.billing.openai.percentUsed > 80 ? (
                    <Tooltip content="Spending is over 80% of the limit">
                      <Badge
                        variant="outline"
                        className="text-red-500 border-red-500/30 bg-red-500/10 cursor-help"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Critical
                      </Badge>
                    </Tooltip>
                  ) : data.billing.openai.percentUsed > 50 ? (
                    <Tooltip content="Spending is over 50% of the limit">
                      <Badge
                        variant="outline"
                        className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10 cursor-help"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Warning
                      </Badge>
                    </Tooltip>
                  ) : (
                    <Tooltip content="Spending is well within limits">
                      <Badge
                        variant="outline"
                        className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 cursor-help"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Good
                      </Badge>
                    </Tooltip>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-emerald-500">
                      ${data.billing.openai.actualCost.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of ${data.billing.openai.limit.toFixed(0)} free tier
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          data.billing.openai.percentUsed > 80
                            ? "bg-red-500"
                            : data.billing.openai.percentUsed > 50
                            ? "bg-yellow-500"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            data.billing.openai.percentUsed
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {data.billing.openai.percentUsed.toFixed(1)}% used
                    </p>
                  </div>
                  {data.billing.openai.error && (
                    <p className="text-xs text-yellow-500">
                      {data.billing.openai.error}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() =>
                    window.open("https://platform.openai.com/usage", "_blank")
                  }
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Fly.io Card */}
            <Card className="border-violet-500/20 border-2 flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-500/10">
                      <Cloud className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Fly.io
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {data.flyio?.appName || "Whisper hosting"}
                      </p>
                    </div>
                  </div>
                  {data.flyio?.error ? (
                    <Tooltip content={data.flyio.error}>
                      <Badge
                        variant="outline"
                        className="text-red-500 border-red-500/30 bg-red-500/10 cursor-help"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Error
                      </Badge>
                    </Tooltip>
                  ) : data.flyio?.runningMachines &&
                    data.flyio.runningMachines > 0 ? (
                    <Tooltip
                      content={`${data.flyio.runningMachines} machine(s) currently active`}
                    >
                      <Badge
                        variant="outline"
                        className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 cursor-help"
                      >
                        <Activity className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </Tooltip>
                  ) : (
                    <Tooltip content="All machines are auto-stopped (saving costs)">
                      <Badge
                        variant="outline"
                        className="text-blue-500 border-blue-500/30 bg-blue-500/10 cursor-help"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Standby
                      </Badge>
                    </Tooltip>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  {data.flyio?.machines && data.flyio.machines.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Machines
                          </span>
                          <span className="font-medium">
                            <span className="text-violet-500">
                              {data.flyio.runningMachines}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              / {data.flyio.totalMachines} running
                            </span>
                          </span>
                        </div>
                        {data.flyio.machines.map((machine) => (
                          <div
                            key={machine.id}
                            className="p-2 rounded-lg bg-secondary/30 space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">
                                {machine.name}
                              </span>
                              <Badge
                                variant={
                                  machine.state === "started"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  machine.state === "started"
                                    ? "bg-emerald-500/20 text-emerald-500"
                                    : ""
                                }
                              >
                                {machine.state}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {machine.region}
                              </span>
                              <span className="flex items-center gap-1">
                                <Server className="w-3 h-3" />
                                {machine.cpu}
                              </span>
                              <span className="flex items-center gap-1">
                                <MemoryStick className="w-3 h-3" />
                                {machine.memory}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Current Cost
                          </span>
                          <span
                            className={`font-medium ${
                              (data.flyio?.estimatedMonthlyCost || 0) > 5
                                ? "text-yellow-500"
                                : "text-emerald-500"
                            }`}
                          >
                            ~$
                            {data.flyio?.estimatedMonthlyCost?.toFixed(2) ||
                              "0.00"}
                            /mo
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Free allowance
                          </span>
                          <span className="font-medium text-violet-500">
                            $5/month
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 pt-1">
                          💡 You won&apos;t be charged as long as your bill
                          stays under $5. Stopped machines are free!
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium">Pay-as-you-go</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Free allowance
                        </span>
                        <span className="font-medium text-emerald-500">
                          $5/month
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/80">
                        💡 You won&apos;t be charged as long as your bill stays
                        under $5
                      </p>
                    </div>
                  )}
                  {data.flyio?.error && (
                    <p className="text-xs text-yellow-500">
                      {data.flyio.error}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() =>
                    window.open("https://fly.io/dashboard", "_blank")
                  }
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Supabase Limits */}
            <Card className="border-orange-500/20 border-2 flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-orange-500/10">
                      <Database className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Supabase Usage
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Free tier limits
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const maxUsage = Math.max(
                      data.billing.supabase.database.percentUsed,
                      data.billing.supabase.storage.percentUsed,
                      data.billing.supabase.egress.percentUsed,
                      data.billing.supabase.maus?.percentUsed || 0
                    );

                    if (data.billing.supabase.error) {
                      return (
                        <Tooltip content={data.billing.supabase.error}>
                          <Badge
                            variant="outline"
                            className="text-red-500 border-red-500/30 bg-red-500/10 cursor-help"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Error
                          </Badge>
                        </Tooltip>
                      );
                    }
                    if (maxUsage > 80) {
                      return (
                        <Tooltip content="Some limits are over 80% used">
                          <Badge
                            variant="outline"
                            className="text-red-500 border-red-500/30 bg-red-500/10 cursor-help"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Critical
                          </Badge>
                        </Tooltip>
                      );
                    }
                    if (maxUsage > 50) {
                      return (
                        <Tooltip content="Some limits are over 50% used">
                          <Badge
                            variant="outline"
                            className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10 cursor-help"
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Warning
                          </Badge>
                        </Tooltip>
                      );
                    }
                    return (
                      <Tooltip content="All usage is well within free tier limits">
                        <Badge
                          variant="outline"
                          className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 cursor-help"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Good
                        </Badge>
                      </Tooltip>
                    );
                  })()}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  {/* Database */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Database</span>
                      <span className="font-medium">
                        {(
                          data.billing.supabase.database.used /
                          1024 /
                          1024
                        ).toFixed(1)}{" "}
                        MB
                        <span className="text-muted-foreground"> / 500 MB</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                      PostgreSQL data, indexes & materialized views
                    </p>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          data.billing.supabase.database.percentUsed > 80
                            ? "bg-red-500"
                            : data.billing.supabase.database.percentUsed > 50
                            ? "bg-yellow-500"
                            : "bg-orange-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            data.billing.supabase.database.percentUsed
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  {/* Storage */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Storage</span>
                      <span className="font-medium">
                        {(
                          data.billing.supabase.storage.used /
                          1024 /
                          1024
                        ).toFixed(1)}{" "}
                        MB
                        <span className="text-muted-foreground"> / 1 GB</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                      Files uploaded to storage buckets
                    </p>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          data.billing.supabase.storage.percentUsed > 80
                            ? "bg-red-500"
                            : data.billing.supabase.storage.percentUsed > 50
                            ? "bg-yellow-500"
                            : "bg-orange-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            data.billing.supabase.storage.percentUsed
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  {/* Egress */}
                  {data.billing.supabase.egress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Egress</span>
                        <span className="font-medium">
                          {(
                            data.billing.supabase.egress.used /
                            1024 /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          GB
                          <span className="text-muted-foreground"> / 5 GB</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/70">
                        Data transferred out (API responses)
                      </p>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            data.billing.supabase.egress.percentUsed > 80
                              ? "bg-red-500"
                              : data.billing.supabase.egress.percentUsed > 50
                              ? "bg-yellow-500"
                              : "bg-orange-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              data.billing.supabase.egress.percentUsed
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* MAUs */}
                  {data.billing.supabase.maus && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">MAUs</span>
                        <span className="font-medium">
                          {data.billing.supabase.maus.used.toLocaleString()}
                          <span className="text-muted-foreground">
                            {" "}
                            / 50,000
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/70">
                        Monthly Active Users (unique logins)
                      </p>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            data.billing.supabase.maus.percentUsed > 80
                              ? "bg-red-500"
                              : data.billing.supabase.maus.percentUsed > 50
                              ? "bg-yellow-500"
                              : "bg-orange-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              data.billing.supabase.maus.percentUsed
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {data.billing.supabase.error && (
                    <p className="text-xs text-yellow-500">
                      {data.billing.supabase.error}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() =>
                    window.open("https://supabase.com/dashboard", "_blank")
                  }
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Usage Chart */}
        <UsageChart data={data?.dailyUsage || []} />
      </div>
    </div>
  );
}
