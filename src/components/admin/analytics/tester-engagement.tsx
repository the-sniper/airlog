"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, TrendingUp, UserX, Award } from "lucide-react";
import type { SessionWithDetails } from "@/types";
import { calculateTesterEngagement } from "@/lib/analytics";

interface TesterEngagementCardProps {
  session: SessionWithDetails;
}

export function TesterEngagementCard({ session }: TesterEngagementCardProps) {
  const engagement = useMemo(
    () => calculateTesterEngagement(session),
    [session],
  );

  const getParticipationLevel = () => {
    if (engagement.participationRate >= 80)
      return { label: "Excellent", color: "text-emerald-500" };
    if (engagement.participationRate >= 50)
      return { label: "Good", color: "text-amber-500" };
    return { label: "Needs Attention", color: "text-[#fb7088]" };
  };

  const participationLevel = getParticipationLevel();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Tester Engagement
        </CardTitle>
        <CardDescription>Who contributed feedback and how much</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Participation */}
        <div className="p-4 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Participation</span>
            <span className={`text-sm font-medium ${participationLevel.color}`}>
              {participationLevel.label}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${Math.min(engagement.participationRate, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {Math.round(engagement.participationRate)}% (
              {engagement.testersWithNotes}/{engagement.totalTesters}) testers
              shared notes
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-sky-500" />
              <span className="text-xs text-muted-foreground">
                Avg Notes / Tester
              </span>
            </div>
            <div className="text-xl font-bold">
              {engagement.averageNotesPerTester.toFixed(1)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Total Notes</span>
            </div>
            <div className="text-xl font-bold">{engagement.totalNotes}</div>
          </div>
        </div>

        {/* Top Contributors */}
        {engagement.topContributors.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Top Contributors
            </div>
            <div className="flex flex-wrap gap-2">
              {engagement.topContributors.map((tester) => (
                <Badge
                  key={tester.id}
                  variant="secondary"
                  className="text-xs"
                  title={`${tester.noteCount} notes`}
                >
                  <Award className="w-3 h-3 mr-1 opacity-80" />
                  {tester.name}
                  <span className="ml-1 opacity-60">×{tester.noteCount}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Silent Testers */}
        {engagement.silentTesters.length > 0 ? (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <UserX className="w-3 h-3" />
              {engagement.silentTesters.length} tester
              {engagement.silentTesters.length > 1 ? "s" : ""} haven&apos;t
              added notes yet
            </div>
            <div className="flex flex-wrap gap-1">
              {engagement.silentTesters.slice(0, 5).map((tester) => (
                <Badge
                  key={tester.id}
                  variant="outline"
                  className="text-[11px]"
                >
                  {tester.name}
                </Badge>
              ))}
              {engagement.silentTesters.length > 5 && (
                <span className="text-[11px] text-muted-foreground">
                  +{engagement.silentTesters.length - 5} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-1">
            Everyone participated 🎉
          </div>
        )}
      </CardContent>
    </Card>
  );
}
