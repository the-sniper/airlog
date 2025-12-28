"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";
import { FileText, Clock } from "lucide-react";
import { CATEGORY_COLORS } from "@/lib/admin-analytics";
import type { NoteCategory } from "@/types";

interface RecentActivityProps {
  notes: {
    id: string;
    transcript: string;
    category: NoteCategory;
    testerName: string;
    sceneName: string;
    sessionName: string;
    createdAt: string;
  }[];
}

const CATEGORY_LABELS: Record<NoteCategory, string> = {
  bug: "Bug",
  feature: "Feature",
  ux: "UX",
  performance: "Perf",
  other: "Other",
};

export function RecentActivity({ notes }: RecentActivityProps) {
  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] flex-col items-center justify-center text-center">
            <FileText className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground">No recent notes</p>
            <p className="text-xs text-muted-foreground/70">
              Notes will appear here as testers record feedback
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group rounded-lg border border-border/50 bg-secondary/30 p-3 transition-colors hover:border-border"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] px-1.5 py-0"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[note.category]}15`,
                      borderColor: `${CATEGORY_COLORS[note.category]}40`,
                      color: CATEGORY_COLORS[note.category],
                    }}
                  >
                    {CATEGORY_LABELS[note.category]}
                  </Badge>
                  <span className="truncate text-xs text-muted-foreground">
                    {note.sceneName}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm">
                  {note.transcript || "No transcript available"}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-medium">{note.testerName}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(note.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
