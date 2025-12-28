"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clipboard,
  Play,
  CheckCircle2,
  Clock,
  Mic,
  Bug,
  Lightbulb,
  Palette,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StatsCardsProps {
  sessions: {
    total: number;
    active: number;
    completed: number;
    pending: number;
  };
  notes: {
    total: number;
    byCategory: {
      bug: number;
      feature: number;
      ux: number;
      performance: number;
      other: number;
    };
  };
}

const CATEGORY_COLORS = {
  bug: "#ef4444",
  feature: "#22c55e",
  ux: "#a855f7",
  performance: "#f59e0b",
  other: "#6b7280",
};

const CATEGORY_LABELS = {
  bug: "Bugs",
  feature: "Features",
  ux: "UX",
  performance: "Performance",
  other: "Other",
};

export function StatsCards({ sessions, notes }: StatsCardsProps) {
  const categoryData = Object.entries(notes.byCategory)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      name: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS],
      value: count,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
    }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Sessions */}
      <Card className="glass border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Total Sessions
              </p>
              <p className="text-3xl font-bold">{sessions.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <Clipboard className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {sessions.active} active
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {sessions.completed} done
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="glass border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Active Now
              </p>
              <p className="text-3xl font-bold text-green-500">
                {sessions.active}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10">
              <Play className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {sessions.active > 0
              ? "Ready to record feedback"
              : "No active sessions"}
          </p>
        </CardContent>
      </Card>

      {/* Total Notes */}
      <Card className="glass border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Notes Recorded
              </p>
              <p className="text-3xl font-bold">{notes.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-accent/20">
              <Mic className="w-5 h-5 text-accent-foreground" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Voice feedback submitted
          </p>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="glass border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                By Category
              </p>
              {categoryData.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={15}
                          outerRadius={25}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number | undefined) =>
                            `${value ?? 0} Notes`
                          }
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1 w-full min-w-0">
                    {categoryData.map((cat) => (
                      <div
                        key={cat.name}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-muted-foreground truncate">
                          {cat.name}{" "}
                          <span className="opacity-70">({cat.value})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
