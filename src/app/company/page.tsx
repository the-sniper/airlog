"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users2,
  FileText,
  Play,
  LayoutDashboard,
  Bug,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardStats } from "@/lib/admin-analytics";
import {
  StatCard,
  SessionStatusChart,
  NotesCategoryChart,
  SessionsOverTimeChart,
  RecentActivity,
  TesterLeaderboard,
  ActiveSessionsBanner,
} from "@/components/admin/dashboard";
import { WeatherEffects } from "@/components/ui/weather-effects";
import { useWeather } from "@/hooks/use-weather";
import { getWeatherGradient, getWeatherTextColor } from "@/lib/weather-utils";
import { cn } from "@/lib/utils";

export default function CompanyDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "all">("30d");
  const [refreshing, setRefreshing] = useState(false);
  const weather = useWeather();

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/company/dashboard?timeFilter=${timeFilter}`
      );
      if (res.ok) {
        setDashboardStats(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setDashboardLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  async function handleRefresh() {
    setRefreshing(true);
    setDashboardLoading(true);
    await fetchDashboard();
    setRefreshing(false);
  }

  // Get weather-based gradient
  const gradientClass = weather.loading
    ? "from-secondary/50 via-secondary/30 to-secondary/50"
    : getWeatherGradient(weather.condition, weather.isDay);

  // Get weather-based text colors
  const textColors = weather.loading
    ? {
        primary: "text-foreground",
        secondary: "text-muted-foreground",
        muted: "text-muted-foreground",
      }
    : getWeatherTextColor(weather.condition, weather.isDay);

  // Check if we have a light background
  const isLightBg =
    !weather.loading &&
    ((weather.condition === "snow" && weather.isDay) ||
      (weather.condition === "cloudy" && weather.isDay) ||
      (weather.condition === "fog" && weather.isDay) ||
      (weather.condition === "mist" && weather.isDay));

  // Get weather icon based on condition
  const getWeatherIcon = () => {
    switch (weather.condition) {
      case "rain":
      case "drizzle":
      case "heavy_rain":
      case "thunderstorm":
        return CloudRain;
      case "snow":
        return CloudSnow;
      case "cloudy":
        return Cloud;
      case "fog":
      case "mist":
        return CloudFog;
      default:
        return weather.isDay ? Sun : Moon;
    }
  };
  const WeatherIcon = getWeatherIcon();

  // Format the date
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Dashboard skeleton
  const DashboardSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-secondary/30" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-72 rounded-xl bg-secondary/30" />
        <div className="h-72 rounded-xl bg-secondary/30" />
        <div className="h-72 rounded-xl bg-secondary/30" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-80 rounded-xl bg-secondary/30" />
        <div className="h-80 rounded-xl bg-secondary/30" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Banner with Weather Effects */}
      <div
        className={cn(
          "relative rounded-xl overflow-hidden border border-border/50 bg-gradient-to-br transition-all duration-1000",
          gradientClass
        )}
      >
        {/* Weather Effects Background */}
        {!weather.loading && (
          <div className="absolute inset-0 pointer-events-none">
            <WeatherEffects
              type={weather.condition}
              isDay={weather.isDay}
              windSpeed={weather.windSpeed}
              cloudCover={weather.cloudCover}
            />
          </div>
        )}

        {/* Header Content */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-sm border",
                isLightBg
                  ? "bg-slate-800/10 border-slate-400/30"
                  : "bg-white/20 border-white/30"
              )}
            >
              <LayoutDashboard className={cn("h-5 w-5", textColors.primary)} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <WeatherIcon
                  className={cn("w-3.5 h-3.5", textColors.secondary)}
                />
                <span
                  className={cn("text-xs font-medium", textColors.secondary)}
                >
                  {!weather.loading && weather.condition && (
                    <span className="capitalize mr-1">
                      {weather.condition.replace("_", " ") + " |"}
                    </span>
                  )}
                  {formattedDate}
                </span>
              </div>
              <h1
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  textColors.primary
                )}
              >
                Dashboard
              </h1>
              <p className={cn("text-sm", textColors.secondary)}>
                Overview of your testing activity
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
              <TabsList
                className={cn(
                  "h-9 backdrop-blur-sm border",
                  isLightBg
                    ? "bg-slate-800/10 border-slate-400/30"
                    : "bg-white/10 border-white/20"
                )}
              >
                <TabsTrigger
                  value="7d"
                  className={cn(
                    "text-xs px-3",
                    isLightBg
                      ? "text-slate-600 data-[state=active]:text-slate-800 data-[state=active]:bg-slate-800/10"
                      : "text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/20"
                  )}
                >
                  7 days
                </TabsTrigger>
                <TabsTrigger
                  value="30d"
                  className={cn(
                    "text-xs px-3",
                    isLightBg
                      ? "text-slate-600 data-[state=active]:text-slate-800 data-[state=active]:bg-slate-800/10"
                      : "text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/20"
                  )}
                >
                  30 days
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className={cn(
                    "text-xs px-3",
                    isLightBg
                      ? "text-slate-600 data-[state=active]:text-slate-800 data-[state=active]:bg-slate-800/10"
                      : "text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/20"
                  )}
                >
                  All time
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn(
                "shrink-0 h-9 w-9 backdrop-blur-sm",
                isLightBg
                  ? "bg-slate-800/10 border-slate-400/30 text-slate-700 hover:bg-slate-800/20 hover:text-slate-900"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              )}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      {dashboardLoading ? (
        <DashboardSkeleton />
      ) : dashboardStats ? (
        <div className="space-y-6">
          {/* Active Sessions Banner */}
          {dashboardStats.activeSessionsList.length > 0 && (
            <ActiveSessionsBanner
              sessions={dashboardStats.activeSessionsList}
              basePath="/company"
            />
          )}

          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Total Sessions"
              value={dashboardStats.totalSessions}
              icon={<FileText className="h-5 w-5" />}
              variant="primary"
            />
            <StatCard
              title="Active Sessions"
              value={dashboardStats.activeSessions}
              icon={<Play className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              title="Completed"
              value={dashboardStats.completedSessions}
              icon={<Sparkles className="h-5 w-5" />}
              variant="default"
            />
            <StatCard
              title="Total Testers"
              value={dashboardStats.totalTesters}
              icon={<Users2 className="h-5 w-5" />}
              variant="default"
            />
            <StatCard
              title="Total Notes"
              value={dashboardStats.totalNotes}
              icon={<MessageSquare className="h-5 w-5" />}
              variant="default"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SessionStatusChart data={dashboardStats.sessionsByStatus} />
            <NotesCategoryChart data={dashboardStats.notesByCategory} />
            <TesterLeaderboard data={dashboardStats.testerLeaderboard} />
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-4 lg:grid-cols-3">
            <SessionsOverTimeChart data={dashboardStats.sessionsOverTime} />
            <RecentActivity notes={dashboardStats.recentNotes} />
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No data to display yet</p>
            <p className="text-sm text-muted-foreground/70">
              Create your first session to see dashboard statistics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
