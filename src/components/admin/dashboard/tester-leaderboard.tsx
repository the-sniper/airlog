"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

interface TesterLeaderboardProps {
  data: {
    testerId: string;
    name: string;
    noteCount: number;
    bugCount: number;
  }[];
}

export function TesterLeaderboard({ data }: TesterLeaderboardProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No tester activity yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return (
          <span className="text-xs text-muted-foreground font-medium w-4 text-center">
            {index + 1}
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 5).map((tester, index) => (
            <div
              key={tester.testerId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center justify-center w-6">
                {getRankIcon(index)}
              </div>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium"
                style={{
                  backgroundColor:
                    index === 0
                      ? "rgba(234, 179, 8, 0.15)"
                      : index === 1
                        ? "rgba(156, 163, 175, 0.15)"
                        : index === 2
                          ? "rgba(217, 119, 6, 0.15)"
                          : "hsl(var(--secondary))",
                  color:
                    index === 0
                      ? "rgb(202, 138, 4)"
                      : index === 1
                        ? "rgb(107, 114, 128)"
                        : index === 2
                          ? "rgb(180, 83, 9)"
                          : "hsl(var(--muted-foreground))",
                }}
              >
                {getInitials(tester.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tester.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tester.bugCount > 0
                    ? `${tester.bugCount} bug${tester.bugCount > 1 ? "s" : ""} found`
                    : `${tester.noteCount} note${tester.noteCount > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">
                  {tester.noteCount}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  notes
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
