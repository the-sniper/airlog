"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  CalendarDays,
  Users2,
  FileText,
  Play,
  Square,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, getStatusLabel } from "@/lib/utils";
import type { Session } from "@/types";

interface SessionWithCounts extends Session {
  scenes: { count: number }[];
  testers: { count: number }[];
  notes: { count: number }[];
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    session: SessionWithCounts | null;
  }>({ open: false, session: null });

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) setSessions(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSession(id: string) {
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    fetchSessions();
  }

  async function handleEndSession(id: string) {
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    fetchSessions();
  }

  async function handleDeleteSession() {
    if (!deleteDialog.session) return;
    await fetch(`/api/sessions/${deleteDialog.session.id}`, {
      method: "DELETE",
    });
    setDeleteDialog({ open: false, session: null });
    fetchSessions();
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 rounded-lg bg-secondary/30 animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-secondary/20 animate-pulse" />
          </div>
          <div className="h-10 w-32 rounded-lg bg-secondary/30 animate-pulse" />
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 rounded-2xl bg-secondary/30 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
            <p className="text-sm text-muted-foreground">
              Manage your testing sessions
            </p>
          </div>
        </div>
        <Link href="/admin/sessions/new">
          <Button>
            <Plus className="w-4 h-4" strokeWidth={2} />
            New Session
          </Button>
        </Link>
      </div>

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-5">
              <FileText
                className="w-8 h-8 text-muted-foreground/50"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="font-semibold mb-2">No sessions yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first testing session to get started
            </p>
            <Link href="/admin/sessions/new">
              <Button>
                <Plus className="w-4 h-4" strokeWidth={2} />
                Create Session
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <Card
              key={s.id}
              className="group hover:border-primary/30 hover:shadow-glow transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                      {s.name}
                    </CardTitle>
                    {s.build_version && (
                      <p className="text-xs text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded-md inline-block">
                        {s.build_version}
                      </p>
                    )}
                  </div>
                  <Badge variant={s.status as "draft" | "active" | "completed"}>
                    {getStatusLabel(s.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" strokeWidth={1.75} />
                  {formatDate(s.created_at)}
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Users2
                      className="w-4 h-4 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                    <span className="text-foreground/80">
                      {s.testers?.[0]?.count || 0}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText
                      className="w-4 h-4 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                    <span className="text-foreground/80">
                      {s.notes?.[0]?.count || 0}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Link href={`/admin/sessions/${s.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full" size="sm">
                      Manage
                    </Button>
                  </Link>
                  {s.status === "draft" && (
                    <Button size="sm" onClick={() => handleStartSession(s.id)}>
                      <Play className="w-4 h-4" strokeWidth={2} />
                      Start
                    </Button>
                  )}
                  {s.status === "active" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleEndSession(s.id)}
                    >
                      <Square className="w-4 h-4" strokeWidth={2} />
                      End
                    </Button>
                  )}
                  {s.status === "completed" && (
                    <Link href={`/admin/sessions/${s.id}/report`}>
                      <Button variant="outline" size="sm">
                        View Report
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteDialog({ open: true, session: s })}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(o) => setDeleteDialog({ open: o, session: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.session?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialog({ open: false, session: null })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSession}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
