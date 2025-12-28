"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatChartDate } from "@/lib/admin-analytics";

interface SessionsOverTimeChartProps {
  data: {
    date: string;
    sessions: number;
    notes: number;
    bugs: number;
  }[];
}

export function SessionsOverTimeChart({ data }: SessionsOverTimeChartProps) {
  if (data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Activity Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            No activity data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: formatChartDate(item.date),
  }));

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Activity Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="notesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6e71f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6e71f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bugsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7088" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fb7088" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelStyle={{
                  color: "hsl(var(--foreground))",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    notes: "Notes",
                    bugs: "Bugs",
                    sessions: "Sessions",
                  };
                  return [value ?? 0, labels[String(name)] || String(name)];
                }}
              />
              <Area
                type="monotone"
                dataKey="notes"
                stroke="#6e71f1"
                strokeWidth={2}
                fill="url(#notesGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="bugs"
                stroke="#fb7088"
                strokeWidth={2}
                fill="url(#bugsGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-3 flex justify-center gap-6">
          <div className="flex items-center gap-2 text-xs">
            <div className="h-2.5 w-2.5 rounded-full bg-[#6e71f1]" />
            <span className="text-muted-foreground">Notes</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-2.5 w-2.5 rounded-full bg-[#fb7088]" />
            <span className="text-muted-foreground">Bugs</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
