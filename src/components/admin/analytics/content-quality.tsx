"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Mic, Sparkles, PenLine, Bot } from "lucide-react";
import type { SessionWithDetails } from "@/types";
import { calculateContentQuality } from "@/lib/analytics";

interface ContentQualityCardProps {
  session: SessionWithDetails;
}

export function ContentQualityCard({ session }: ContentQualityCardProps) {
  const quality = useMemo(() => calculateContentQuality(session), [session]);

  const metrics = [
    {
      label: "Avg Note Length",
      value: `${quality.averageNoteLength}`,
      unit: "words",
      icon: FileText,
      color: "text-sky-500",
      barColor: "bg-sky-500",
      bar: Math.min((quality.averageNoteLength / 100) * 100, 100), // 100 words = 100%
    },
    {
      label: "Audio Coverage",
      value: `${Math.round(quality.audioCoverage)}%`,
      icon: Mic,
      color: "text-indigo-500",
      barColor: "bg-indigo-500",
      bar: quality.audioCoverage,
    },
    {
      label: "AI Summaries",
      value: `${Math.round(quality.aiSummaryCoverage)}%`,
      icon: Sparkles,
      color: "text-amber-500",
      barColor: "bg-amber-500",
      bar: quality.aiSummaryCoverage,
    },
    {
      label: "Auto-Classified",
      value: `${Math.round(quality.autoClassificationRate)}%`,
      icon: Bot,
      color: "text-emerald-500",
      barColor: "bg-emerald-500",
      bar: quality.autoClassificationRate,
    },
    {
      label: "Edit Rate",
      value: `${Math.round(quality.editRate)}%`,
      icon: PenLine,
      color: "text-cyan-500",
      barColor: "bg-cyan-500",
      bar: quality.editRate,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Content Quality
        </CardTitle>
        <CardDescription>Note characteristics and AI processing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-3">
            <metric.icon className={`w-4 h-4 ${metric.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                <span className="text-sm font-medium">
                  {metric.value}
                  {metric.unit && <span className="text-muted-foreground ml-1">{metric.unit}</span>}
                </span>
              </div>
              {metric.bar !== undefined && (
                <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${metric.barColor}`}
                    style={{ width: `${Math.min(metric.bar, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Based on {quality.totalNotes} total notes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
