"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp, TrendingDown, Minus, Bug, FileText, Users } from "lucide-react";
import type { SessionWithDetails } from "@/types";
import type { HistoricalSession } from "@/lib/analytics";
import { calculateHistoricalComparison } from "@/lib/analytics";

interface HistoricalComparisonCardProps {
  session: SessionWithDetails;
  pastSessions: HistoricalSession[];
}

export function HistoricalComparisonCard({ session, pastSessions }: HistoricalComparisonCardProps) {
  const comparison = useMemo(
    () => calculateHistoricalComparison(session, pastSessions),
    [session, pastSessions]
  );

  const trendConfig = {
    improving: { icon: TrendingDown, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Improving" },
    worsening: { icon: TrendingUp, color: "text-[#fb7088]", bg: "bg-[#fb7088]/10", label: "More Issues" },
    stable: { icon: Minus, color: "text-sky-500", bg: "bg-sky-500/10", label: "Stable" },
  };

  const trend = trendConfig[comparison.bugTrend];
  const TrendIcon = trend.icon;

  const maxBugs = Math.max(...comparison.sessions.map((s) => s.bugCount), 1);
  const maxNotes = Math.max(...comparison.sessions.map((s) => s.totalNotes), 1);
  const maxTesters = Math.max(...comparison.sessions.map((s) => s.testerCount), 1);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      timeZone: "America/New_York" 
    });
  };

  if (comparison.sessions.length <= 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historical Comparison
          </CardTitle>
          <CardDescription>Compare with previous sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No previous sessions to compare with.</p>
            <p className="text-xs mt-1">Historical trends will appear after completing more sessions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Historical Comparison
        </CardTitle>
        <CardDescription>Bug trends across {comparison.sessions.length} sessions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend Summary */}
        <div className={`p-4 rounded-lg ${trend.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendIcon className={`w-5 h-5 ${trend.color}`} />
              <span className="font-medium">{trend.label}</span>
            </div>
            {comparison.bugChangePercent !== null && (
              <Badge variant="secondary" className={trend.color}>
                {comparison.bugChangePercent > 0 ? "+" : ""}
                {Math.round(comparison.bugChangePercent)}% vs last session
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Average: {Math.round(comparison.averageBugs)} bugs per session
          </p>
        </div>

        {/* Trend Charts - Side by Side */}
        <div className="grid grid-cols-3 gap-3">
          {/* Bug Trend Chart */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bug className="w-4 h-4 text-[#fb7088]" />
              Bugs
            </div>
            <div className="flex items-end justify-center gap-2">
              {comparison.sessions.map((s) => {
                const isCurrentSession = s.id === session.id;
                const height = Math.max((s.bugCount / maxBugs) * 100, 8);
                return (
                  <div
                    key={s.id}
                    className="flex flex-col items-center w-8"
                    title={`${s.name}: ${s.bugCount} bugs`}
                  >
                    <div className="w-4 h-14 flex items-end">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isCurrentSession ? "bg-[#fb7088]" : "bg-[#fb7088]/60"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1 truncate text-center">
                      {formatDate(s.started_at || s.ended_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Volume Trend */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-500" />
              Notes
            </div>
            <div className="flex items-end justify-center gap-2">
              {comparison.sessions.map((s) => {
                const isCurrentSession = s.id === session.id;
                const height = Math.max((s.totalNotes / maxNotes) * 100, 8);
                return (
                  <div
                    key={s.id}
                    className="flex flex-col items-center w-8"
                    title={`${s.name}: ${s.totalNotes} notes`}
                  >
                    <div className="w-4 h-14 flex items-end">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isCurrentSession ? "bg-sky-500" : "bg-sky-500/60"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1 truncate text-center">
                      {formatDate(s.started_at || s.ended_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testers Trend */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Testers
            </div>
            <div className="flex items-end justify-center gap-2">
              {comparison.sessions.map((s) => {
                const isCurrentSession = s.id === session.id;
                const height = Math.max((s.testerCount / maxTesters) * 100, 8);
                return (
                  <div
                    key={s.id}
                    className="flex flex-col items-center w-8"
                    title={`${s.name}: ${s.testerCount} testers`}
                  >
                    <div className="w-4 h-14 flex items-end">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isCurrentSession ? "bg-emerald-500" : "bg-emerald-500/60"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1 truncate text-center">
                      {formatDate(s.started_at || s.ended_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Session List */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Recent Sessions</div>
          <div className="space-y-1.5">
            {comparison.sessions.slice(-5).reverse().map((s) => {
              const isCurrentSession = s.id === session.id;
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    isCurrentSession ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`truncate ${isCurrentSession ? "font-medium" : ""}`}>
                      {s.name}
                    </span>
                    {isCurrentSession && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <Bug className="w-3 h-3 text-[#fb7088]" />
                      {s.bugCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {s.totalNotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {s.testerCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
