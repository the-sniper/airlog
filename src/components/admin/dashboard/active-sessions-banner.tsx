"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Users2, Clock, ExternalLink, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface ActiveSession {
  id: string;
  name: string;
  build_version?: string;
  started_at: string;
  testerCount: number;
  noteCount: number;
}

interface ActiveSessionsBannerProps {
  sessions: ActiveSession[];
  basePath?: string;
}

export function ActiveSessionsBanner({
  sessions,
  basePath = "/admin",
}: ActiveSessionsBannerProps) {
  if (!sessions || sessions.length === 0) {
    return null;
  }

  // Show at most 3 active sessions
  const displaySessions = sessions.slice(0, 3);

  return (
    <Card className="overflow-hidden border-emerald-500/20 dark:border-emerald-400/20 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-cyan-50/30 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/20">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-100/40 dark:bg-emerald-900/20">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm shadow-emerald-500/20">
            <Play className="h-3 w-3 text-white fill-current" />
          </div>
          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            {sessions.length} Active Session{sessions.length > 1 ? "s" : ""}
          </span>
          <div className="flex-1" />
          <Link href={`${basePath}/sessions`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/30"
            >
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {/* Session Cards Grid */}
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {displaySessions.map((session) => (
            <Link
              key={session.id}
              href={`${basePath}/sessions/${session.id}`}
              className="group flex flex-col gap-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-white/70 dark:bg-card/60 p-4 transition-all duration-200 hover:border-emerald-400/60 dark:hover:border-emerald-600/50 hover:bg-white dark:hover:bg-card/80 hover:shadow-md hover:shadow-emerald-500/10"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {session.name}
                  </h3>
                  {session.build_version && (
                    <p className="text-[10px] text-muted-foreground font-mono bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded inline-block">
                      {session.build_version}
                    </p>
                  )}
                </div>
                <Badge
                  variant="active"
                  className="shrink-0 ml-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm shadow-emerald-500/25"
                >
                  <span className="relative flex h-1.5 w-1.5 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                  </span>
                  <span className="text-white">Live</span>
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                  {session.testerCount} tester
                  {session.testerCount !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                  {formatDistanceToNow(session.started_at)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-100 dark:border-emerald-800/30">
                <span className="text-xs text-muted-foreground">
                  {session.noteCount} note{session.noteCount !== 1 ? "s" : ""}{" "}
                  recorded
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-emerald-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
