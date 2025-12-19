"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, MessageSquare, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Trends & Themes
        </CardTitle>
        <CardDescription>Common topics and overall sentiment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sentiment Indicator */}
        <div className={`p-3 rounded-lg ${sentiment.bg} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <SentimentIcon className={`w-4 h-4 ${sentiment.color}`} />
            <span className="text-sm font-medium">Overall Sentiment</span>
          </div>
          <Badge variant="secondary" className={sentiment.color}>
            {sentiment.label}
          </Badge>
        </div>

        {/* Extracted Themes */}
        {trends.themes.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Key Themes (from AI Summary)
            </div>
            <div className="space-y-1">
              {trends.themes.map((theme, i) => (
                <div key={i} className="p-2 rounded bg-secondary/30 text-sm">
                  {theme}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Keywords */}
        {trends.topKeywords.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Frequently Mentioned
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trends.topKeywords.slice(0, 15).map((kw, i) => {
                // Size based on frequency
                const maxCount = trends.topKeywords[0].count;
                const relativeSize = kw.count / maxCount;
                const fontSize = relativeSize > 0.7 ? "text-sm" : relativeSize > 0.4 ? "text-xs" : "text-[10px]";
                const opacity = relativeSize > 0.5 ? "opacity-100" : relativeSize > 0.3 ? "opacity-80" : "opacity-60";

                return (
                  <span
                    key={kw.word}
                    className={`px-2 py-0.5 rounded bg-secondary ${fontSize} ${opacity}`}
                    title={`${kw.count} mentions`}
                  >
                    {kw.word}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {trends.topKeywords.length === 0 && trends.themes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Not enough content to extract trends.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
