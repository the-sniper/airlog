"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

interface TopScenesChartProps {
  data: {
    sceneId: string;
    sceneName: string;
    sessionName: string;
    noteCount: number;
    bugCount: number;
  }[];
}

export function TopScenesChart({ data }: TopScenesChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top Scenes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No scene data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // Truncate scene names for display
  const chartData = data.map((item) => ({
    ...item,
    displayName:
      item.sceneName.length > 20
        ? item.sceneName.slice(0, 20) + "..."
        : item.sceneName,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Top Scenes by Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="displayName"
                axisLine={false}
                tickLine={false}
                width={100}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted)/0.1)" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    noteCount: "Total Notes",
                    bugCount: "Bugs",
                  };
                  return [value ?? 0, labels[String(name)] || String(name)];
                }}
                labelFormatter={(label) => {
                  const item = chartData.find((d) => d.displayName === label);
                  return item
                    ? `${item.sceneName} (${item.sessionName})`
                    : label;
                }}
              />
              <Bar
                dataKey="noteCount"
                radius={[0, 4, 4, 0]}
                barSize={20}
                fill="#6e71f1"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.bugCount > entry.noteCount / 2
                        ? "#fb7088"
                        : "#6e71f1"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Info text */}
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Scenes sorted by total feedback received
        </p>
      </CardContent>
    </Card>
  );
}
