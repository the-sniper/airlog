"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown, Minus, Gauge } from "lucide-react";
import type { SessionWithDetails } from "@/types";
import { calculateTrendsAndThemes } from "@/lib/analytics";

interface TrendsThemesCardProps {
  session: SessionWithDetails;
}

export function TrendsThemesCard({ session }: TrendsThemesCardProps) {
  const trends = useMemo(() => calculateTrendsAndThemes(session), [session]);

  const sentimentConfig = {
    positive: { icon: ThumbsUp, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Positive" },
    negative: { icon: ThumbsDown, color: "text-[#fb7088]", bg: "bg-[#fb7088]/10", label: "Critical" },
    neutral: { icon: Minus, color: "text-slate-400", bg: "bg-slate-400/10", label: "Neutral" },
    mixed: { icon: MessageSquare, color: "text-amber-500", bg: "bg-amber-500/10", label: "Mixed" },
  };

  const sentiment = sentimentConfig[trends.sentimentIndicator];
  const SentimentIcon = sentiment.icon;

  const sentimentChipClass: Record<typeof trends.sentimentIndicator, string> = {
    positive: "bg-white text-emerald-600 border border-emerald-200 dark:bg-transparent dark:border-transparent",
    negative: "bg-white text-[#fb7088] border border-[#fb7088]/30 dark:bg-transparent dark:border-transparent",
    neutral: "bg-white text-slate-600 border border-slate-200 dark:bg-transparent dark:border-transparent",
    mixed: "bg-white/80 text-amber-500 border border-amber-200 dark:bg-transparent dark:border-transparent",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Trends & Themes
        </CardTitle>
        <CardDescription>Overall sentiment plus experience balance and issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sentiment Indicator */}
        <div className={`p-3 rounded-lg ${sentiment.bg} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <SentimentIcon className={`w-4 h-4 ${sentiment.color}`} />
            <span className="text-sm font-medium">Overall Sentiment</span>
          </div>
          <Badge
            variant="secondary"
            className={`${sentiment.color} ${sentimentChipClass[trends.sentimentIndicator]}`}
          >
            {sentiment.label}
          </Badge>
        </div>

        {/* Experience Balance */}
        {trends.totalNotes > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Experience Balance
              </div>
              <div className="text-[11px] text-muted-foreground">Share of notes by sentiment</div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Shows how feedback splits across positive vs critical notes.
            </div>
            <div className="space-y-2">
              <div className="flex h-2 bg-secondary/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500/80"
                  style={{ width: `${Math.min(trends.totalNotes ? (trends.positiveNotes / trends.totalNotes) * 100 : 0, 100)}%` }}
                  title={`Positive: ${trends.positiveNotes}`}
                />
                <div
                  className="h-full bg-[#fb7088]/80"
                  style={{ width: `${Math.min(trends.totalNotes ? (trends.negativeNotes / trends.totalNotes) * 100 : 0, 100)}%` }}
                  title={`Critical: ${trends.negativeNotes}`}
                />
                <div
                  className="h-full bg-slate-200"
                  style={{ width: `${Math.min(trends.totalNotes ? ((trends.neutralNotes + trends.mixedNotes) / trends.totalNotes) * 100 : 0, 100)}%` }}
                  title={`Neutral/Mixed: ${trends.neutralNotes + trends.mixedNotes}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded bg-secondary/30 flex items-center justify-between">
                  <span className="text-muted-foreground">Positive</span>
                  <span className="font-medium">{trends.positiveNotes}</span>
                </div>
                <div className="p-2 rounded bg-secondary/30 flex items-center justify-between">
                  <span className="text-muted-foreground">Critical</span>
                  <span className="font-medium">{trends.negativeNotes}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Mixed: {trends.mixedNotes}</span>
                <span>Neutral: {trends.neutralNotes}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Positive (green) and Critical (pink) are shown directly; the remaining gray portion represents Neutral and Mixed notes.
              </div>
            </div>
          </div>
        )}

        {/* Reported Issues */}
        {trends.topIssues.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Top Reported Issues
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trends.topIssues.map((issue) => (
                <Badge
                  key={issue.issue}
                  variant="secondary"
                  className="text-xs bg-[rgba(255,111,136,0.15)] text-[rgb(134,63,75)]"
                  title={`${issue.count} mentions`}
                >
                  {issue.issue}
                  <span className="ml-1 opacity-60">×{issue.count}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {trends.totalNotes === 0 && trends.topIssues.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Not enough data yet to highlight trends.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
