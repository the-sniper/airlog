"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ChevronRight, Mic, Zap, ArrowRight } from "lucide-react";

interface Session {
  id: string;
  name: string;
  status: string;
  joinCode: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  shareToken: string | null;
  notesCount: number;
}

interface SessionCardsProps {
  sessions: Session[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SessionCards({ sessions }: SessionCardsProps) {
  // Filter to only show active sessions
  const activeSessions = sessions.filter((s) => s.status === "active");

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-green-500" />
            Active Sessions
          </CardTitle>
          <Link href="/sessions">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activeSessions.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Play className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">
              No active sessions
            </p>
            <p className="text-muted-foreground/60 text-xs">
              You&apos;ll see sessions here when they&apos;re ready to test
            </p>
            <Link href="/sessions" className="inline-block mt-4">
              <Button variant="outline" size="sm" className="gap-1.5">
                View All Sessions
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="group p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 border border-transparent hover:border-border/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="font-medium truncate text-base">
                        {session.name}
                      </h4>
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0.5 h-5 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        {formatDate(session.createdAt)}
                      </span>
                      {session.notesCount > 0 && (
                        <>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                            <Mic className="w-3 h-3 text-primary" />
                            {session.notesCount} note
                            {session.notesCount !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/join/${session.joinCode}`}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      size="sm"
                      className="gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 h-9 font-medium"
                    >
                      Join Session
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
