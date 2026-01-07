"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Users,
  UserPlus,
  TrendingUp,
  RefreshCw,
  Clock,
  Building2,
  ArrowUpRight,
  Eye,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import Link from "next/link";

interface UserAnalytics {
  stats: {
    totalUsers: number;
    activeUsers: number;
    newSignups: number;
    retentionRate: number;
    totalVisits: number;
    uniqueVisitors: number;
  };
  userGrowth: { date: string; count: number; cumulative: number }[];
  loginActivity: { date: string; logins: number }[];
  recentLogins: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    last_login_at: string | null;
    created_at: string;
    company?: { id: string; name: string } | null;
  }[];
  recentViews: {
    id: string;
    path: string;
    ip_address: string | null;
    domain: string | null;
    user?: { email: string } | null;
    created_at: string;
  }[];
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  variant = "default",
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
  variant?: "default" | "primary" | "success" | "warning";
}) {
  const variants = {
    default: "border-border/50",
    primary: "border-primary/30 bg-primary/5",
    success: "border-emerald-500/30 bg-emerald-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
  };

  const iconVariants = {
    default: "bg-secondary text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-500",
    warning: "bg-amber-500/10 text-amber-500",
  };

  return (
    <Card className={cn("border", variants[variant])}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconVariants[variant]
            )}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserGrowthChart({
  data,
}: {
  data: { date: string; count: number; cumulative: number }[];
}) {
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          User Growth Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No signup data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/50"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                }
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorUsers)"
                name="Total Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function LoginActivityChart({
  data,
}: {
  data: { date: string; logins: number }[];
}) {
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Daily Login Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No login data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/50"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                }
              />
              <Bar
                dataKey="logins"
                fill="hsl(142.1 76.2% 36.3%)"
                radius={[4, 4, 0, 0]}
                name="Logins"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RecentLoginsTable({
  logins,
}: {
  logins: UserAnalytics["recentLogins"];
}) {
  const [showAll, setShowAll] = useState(false);

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  const LoginItem = ({ user }: { user: UserAnalytics["recentLogins"][0] }) => (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
        {user.first_name[0]}
        {user.last_name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      {user.company && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Building2 className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{user.company.name}</span>
        </div>
      )}
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {user.last_login_at ? getRelativeTime(user.last_login_at) : "Never"}
      </div>
    </div>
  );

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Recent Logins
            </CardTitle>
            {logins.length > 10 ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                onClick={() => setShowAll(true)}
              >
                View All Logins
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            ) : (
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All Users
                  <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {logins.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No recent logins to display
            </div>
          ) : (
            <div className="space-y-3">
              {logins.slice(0, 10).map((user, index) => (
                <LoginItem key={`${user.id}-${index}`} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Logins Dialog */}
      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              All Recent Logins
            </DialogTitle>
            <DialogDescription>
              Complete history of user login events
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2 space-y-3">
            {logins.map((user, index) => (
              <LoginItem key={`dialog-${user.id}-${index}`} user={user} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PageViewItem({
  view,
  getRelativeTime,
}: {
  view: UserAnalytics["recentViews"][0];
  getRelativeTime: (date: string) => string;
}) {
  return (
    <div className="flex flex-col gap-1 pb-3 border-b border-border/50 last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium truncate max-w-[180px]"
          title={view.path}
        >
          {view.path}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {getRelativeTime(view.created_at)}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-mono">
            {view.ip_address || "Unknown IP"}
          </span>
          {view.domain && (
            <span className="text-[10px] text-muted-foreground/70 bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
              {view.domain}
            </span>
          )}
        </div>
        {view.user && (
          <span className="truncate max-w-[100px]" title={view.user.email}>
            {view.user.email}
          </span>
        )}
      </div>
    </div>
  );
}

function RecentPageViewsTable({
  views,
}: {
  views: UserAnalytics["recentViews"];
}) {
  const [showAll, setShowAll] = useState(false);

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return formatDate(date);
  };

  return (
    <>
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Recent Page Views
            </CardTitle>
            {views && views.length > 10 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                onClick={() => setShowAll(true)}
              >
                View All
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {views && views.length > 0 ? (
            <div className="space-y-4">
              {views.slice(0, 10).map((view) => (
                <PageViewItem
                  key={view.id}
                  view={view}
                  getRelativeTime={getRelativeTime}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No page views recorded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Page Views Dialog */}
      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              All Page Views
            </DialogTitle>
            <DialogDescription>
              Complete history of page views on your site
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2 space-y-4">
            {views?.map((view) => (
              <PageViewItem
                key={view.id}
                view={view}
                getRelativeTime={getRelativeTime}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "all">("30d");

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics?timeFilter=${timeFilter}`);
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }

  // Format date for header
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/5 via-secondary/10 to-secondary/30">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              {/* <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {formattedDate}
                </span>
              </div> */}
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                User Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Track user activity and engagement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Filter Tabs */}
            <Tabs
              value={timeFilter}
              onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}
              className="w-auto"
            >
              <TabsList className="h-9 bg-background/50 border border-border/50 backdrop-blur-sm">
                <TabsTrigger
                  value="7d"
                  className="text-xs px-3 data-[state=active]:bg-background"
                >
                  7 days
                </TabsTrigger>
                <TabsTrigger
                  value="30d"
                  className="text-xs px-3 data-[state=active]:bg-background"
                >
                  30 days
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="text-xs px-3 data-[state=active]:bg-background"
                >
                  All time
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="shrink-0 gap-2 h-9 bg-background/50 hover:bg-background backdrop-blur-sm px-3"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : analytics ? (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Users"
              value={analytics.stats.totalUsers}
              icon={<Users className="h-5 w-5" />}
              variant="primary"
              subtitle="All registered users"
            />
            <StatCard
              title="Active Users"
              value={analytics.stats.activeUsers}
              icon={<Activity className="h-5 w-5" />}
              variant="success"
              subtitle={`Logged in during period`}
            />
            <StatCard
              title="New Signups"
              value={analytics.stats.newSignups}
              icon={<UserPlus className="h-5 w-5" />}
              variant="warning"
              subtitle={`${
                timeFilter === "7d"
                  ? "Last 7 days"
                  : timeFilter === "30d"
                  ? "Last 30 days"
                  : "All time"
              }`}
            />
            <StatCard
              title="Retention Rate"
              value={`${analytics.stats.retentionRate}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="default"
              subtitle="Returning users"
            />
            <StatCard
              title="Total Page Views"
              value={analytics.stats.totalVisits}
              icon={<Eye className="h-5 w-5" />}
              variant="default"
              subtitle="All page loads"
            />
            <StatCard
              title="Unique Visitors"
              value={analytics.stats.uniqueVisitors}
              icon={<Globe className="h-5 w-5" />}
              variant="primary"
              subtitle="Distinct IP/Cookie"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <UserGrowthChart data={analytics.userGrowth} />
            <LoginActivityChart data={analytics.loginActivity} />
          </div>

          {/* Recent Logins & Views */}
          <div className="grid gap-4 lg:grid-cols-3">
            <RecentLoginsTable logins={analytics.recentLogins} />
            <RecentPageViewsTable views={analytics.recentViews} />
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No analytics data available</p>
            <p className="text-sm text-muted-foreground/70">
              User activity will appear here once users start logging in
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
