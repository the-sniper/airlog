"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Clock, TrendingUp, TrendingDown, Activity } from "lucide-react";
import type { SessionWithDetails } from "@/types";
import {
  calculateTemporalAnalytics,
  calculateParticipationRate,
} from "@/lib/analytics";

interface TemporalAnalyticsCardProps {
  session: SessionWithDetails;
}

export function TemporalAnalyticsCard({ session }: TemporalAnalyticsCardProps) {
  const temporal = useMemo(
    () => calculateTemporalAnalytics(session),
    [session],
  );
  const participationRate = useMemo(
    () => calculateParticipationRate(session),
    [session],
  );

  const maxSegmentCount = Math.max(
    ...temporal.notesByTimeSegment.map((s) => s.count),
    1,
  );
  const earlyVsLate =
    temporal.earlyNotes > 0 || temporal.lateNotes > 0
      ? ((temporal.earlyNotes - temporal.lateNotes) /
          (temporal.earlyNotes + temporal.lateNotes)) *
        100
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Session Metrics
        </CardTitle>
        <CardDescription>Duration, timing, and participation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold">
              {temporal.sessionDurationFormatted}
            </div>
            <div className="text-xs text-muted-foreground">
              Session Duration
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold">
              {Math.round(participationRate)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Participation Rate
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        {temporal.notesByTimeSegment.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity Timeline
            </div>
            <div className="flex gap-1.5 h-20 items-end">
              {temporal.notesByTimeSegment.map((segment, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="flex-1 w-full flex flex-col justify-end">
                    {(() => {
                      const nonBug = Math.max(segment.count - segment.bugs, 0);
                      const totalHeight =
                        (segment.count / maxSegmentCount) * 100;
                      const bugHeight = (segment.bugs / maxSegmentCount) * 100;
                      const nonBugHeight = Math.max(totalHeight - bugHeight, 0);
                      return (
                        <>
                          <div
                            className="w-full bg-primary/60 rounded-t transition-all duration-300"
                            style={{
                              height: `${nonBugHeight}%`,
                              minHeight: nonBug > 0 ? "10px" : "0",
                            }}
                          />
                          {segment.bugs > 0 && (
                            <div
                              className="w-full bg-[#fb7088] rounded-b-none transition-all duration-300"
                              style={{
                                height: `${bugHeight}%`,
                                minHeight: "8px",
                              }}
                            />
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center leading-tight">
                    {segment.segment.split(" ")[0]}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
                <span>Total notes</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#fb7088]" />
                <span>Bugs</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>Start</span>
              <span>End</span>
            </div>
          </div>
        )}

        {/* Early vs Late Discovery */}
        <div className="p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Discovery Pattern</span>
            <div className="flex items-center gap-1">
              {earlyVsLate > 10 ? (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              ) : earlyVsLate < -10 ? (
                <TrendingUp className="w-4 h-4 text-amber-500" />
              ) : (
                <Activity className="w-4 h-4 text-sky-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {earlyVsLate > 10
                  ? "Front-loaded"
                  : earlyVsLate < -10
                    ? "Back-loaded"
                    : "Even distribution"}
              </span>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <div className="flex-1 p-2 rounded bg-background">
              <div className="font-medium">{temporal.earlyNotes}</div>
              <div className="text-muted-foreground">First Half</div>
            </div>
            <div className="flex-1 p-2 rounded bg-background">
              <div className="font-medium">{temporal.lateNotes}</div>
              <div className="text-muted-foreground">Second Half</div>
            </div>
          </div>
        </div>

        {/* Peak Activity */}
        {temporal.peakSegment && (
          <div className="text-xs text-muted-foreground">
            Peak activity:{" "}
            <span className="font-medium text-foreground">
              {temporal.peakSegment}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
