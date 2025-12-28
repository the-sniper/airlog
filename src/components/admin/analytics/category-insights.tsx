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
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { SessionWithDetails, NoteCategory } from "@/types";
import { calculateCategoryInsights } from "@/lib/analytics";
import { getCategoryLabel } from "@/lib/utils";

interface CategoryInsightsCardProps {
  session: SessionWithDetails;
}

const CATEGORY_COLORS: Record<NoteCategory, string> = {
  bug: "#fb7088", // coral pink
  feature: "#6e71f1", // purple
  ux: "#a4e8ff", // light blue
  performance: "#f59e0b", // amber
  other: "#94a3b8", // slate
};

const categoryColorClasses: Record<NoteCategory, { bg: string; text: string }> =
  {
    bug: { bg: "bg-[#fb7088]", text: "text-[#fb7088]" },
    feature: { bg: "bg-[#6e71f1]", text: "text-[#6e71f1]" },
    ux: { bg: "bg-[#a4e8ff]", text: "text-[#a4e8ff]" },
    performance: { bg: "bg-amber-500", text: "text-amber-500" },
    other: { bg: "bg-slate-400", text: "text-slate-400" },
  };

export function CategoryInsightsCard({ session }: CategoryInsightsCardProps) {
  const insights = useMemo(() => calculateCategoryInsights(session), [session]);

  const totalNotes = Object.values(insights.totalByCategory).reduce(
    (a, b) => a + b,
    0,
  );
  const scenesWithNotes = insights.categoryByScene.filter(
    (s) => Object.values(s.categories).reduce((a, b) => a + b, 0) > 0,
  );

  // Data for overall distribution pie chart
  const distributionData = useMemo(() => {
    return (
      Object.entries(insights.totalByCategory) as [NoteCategory, number][]
    )
      .filter(([, count]) => count > 0)
      .map(([category, count]) => ({
        name: getCategoryLabel(category),
        value: count,
        color: CATEGORY_COLORS[category],
        category,
      }));
  }, [insights]);

  const concentrationLabel = useMemo(() => {
    if (totalNotes === 0) return "No data yet";
    if (insights.concentrationScore < 25) return "Balanced mix";
    if (insights.concentrationScore < 45) return "Moderately concentrated";
    return "Highly concentrated";
  }, [insights.concentrationScore, totalNotes]);

  const topCategoryDisplay =
    totalNotes === 0
      ? "No data yet"
      : `Top: ${getCategoryLabel(insights.dominantCategory)} (${Math.round(insights.topCategoryShare)}%)`;

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-xs text-muted-foreground">
            {payload[0].value} notes
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5" />
          Category Insights
        </CardTitle>
        <CardDescription>
          Distribution and patterns across feedback types
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Row: Concentration & Overall Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Category Concentration */}
          <div className="space-y-3 lg:col-span-5">
            <div className="text-sm font-medium text-muted-foreground text-center">
              Category Concentration
            </div>
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Concentration Score
                </span>
                <span className="font-semibold">
                  {Math.round(insights.concentrationScore)}
                </span>
              </div>
              <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min(insights.concentrationScore, 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{concentrationLabel}</span>
                <span>{topCategoryDisplay}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Higher score means feedback is clustered in fewer categories;
              lower score means a balanced mix.
            </p>
          </div>

          {/* Overall Distribution */}
          <div className="space-y-3 lg:col-span-7">
            <div className="text-sm font-medium text-muted-foreground text-center">
              All Categories
            </div>
            <div className="h-48">
              {distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No data
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
              {(
                Object.entries(insights.totalByCategory) as [
                  NoteCategory,
                  number,
                ][]
              ).map(([category, count]) => (
                <div key={category} className="flex items-center gap-1.5">
                  <div
                    className={`w-3 h-3 rounded-full ${categoryColorClasses[category].bg}`}
                  />
                  <span className="text-muted-foreground">
                    {getCategoryLabel(category)}: {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category by Scene (Stacked bars - keep as is) */}
        {scenesWithNotes.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              By Scene
            </div>
            {scenesWithNotes.map((scene) => {
              const sceneTotal = Object.values(scene.categories).reduce(
                (a, b) => a + b,
                0,
              );
              const segments = (
                Object.entries(scene.categories) as [NoteCategory, number][]
              ).filter(([, count]) => count > 0);
              return (
                <div key={scene.sceneId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{scene.sceneName}</span>
                    <span className="text-muted-foreground">{sceneTotal}</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                    {segments.map(([category, count], index) => {
                      const isFirst = index === 0;
                      const isLast = index === segments.length - 1;
                      return (
                        <div
                          key={category}
                          className={categoryColorClasses[category].bg}
                          style={{
                            width: `${(count / sceneTotal) * 100}%`,
                            borderLeft: isFirst ? undefined : "1px solid #fff",
                            borderRight: isLast ? undefined : "1px solid #fff",
                          }}
                          title={`${getCategoryLabel(category)}: ${count}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 pt-2 border-t border-border">
          {(
            Object.entries(categoryColorClasses) as [
              NoteCategory,
              { bg: string },
            ][]
          ).map(([category, { bg }]) => (
            <div key={category} className="flex items-center gap-1.5 text-xs">
              <div className={`w-2.5 h-2.5 rounded-sm ${bg}`} />
              <span className="text-muted-foreground">
                {getCategoryLabel(category)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
