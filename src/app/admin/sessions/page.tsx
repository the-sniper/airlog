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
  Loader2,
  Send,
  AlertTriangle,
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
import { useToast } from "@/components/ui/use-toast";

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
  const [endSessionDialog, setEndSessionDialog] = useState<{
    open: boolean;
    session: SessionWithCounts | null;
  }>({ open: false, session: null });
  const [endingSession, setEndingSession] = useState(false);
  const [sendingReportEmails, setSendingReportEmails] = useState(false);
  const [dialogSessionData, setDialogSessionData] = useState<any>(null);
  const { toast } = useToast();

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

  async function openEndSessionDialog(session: SessionWithCounts) {
    // Fetch full session data with testers first
    const res = await fetch(`/api/sessions/${session.id}`);
    if (res.ok) {
      const data = await res.json();
      setDialogSessionData(data);
    }
    // Open dialog after data is fetched
    setEndSessionDialog({ open: true, session });
  }

  async function handleEndSession(sendReport: boolean = false) {
    if (!endSessionDialog.session) return;
    const id = endSessionDialog.session.id;

    if (sendReport) {
      setSendingReportEmails(true);
    } else {
      setEndingSession(true);
    }

    try {
      // End the session first
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });

      // If sendReport is true, send report emails to all testers
      if (sendReport) {
        const testersWithEmail = dialogSessionData?.testers?.filter((t: any) => t.email) || [];
        if (testersWithEmail.length > 0) {
          const res = await fetch(`/api/sessions/${id}/report/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (res.ok) {
            const result = await res.json();
            toast({
              title: "Session ended & report sent!",
              description: `Report sent to ${result.sent} tester${
                result.sent !== 1 ? "s" : ""
              }.`,
              variant: "success",
            });
          } else {
            toast({
              title: "Session ended",
              description:
                "Failed to send report emails. You can share the report manually.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Session ended",
            description: "No testers with email addresses to send report to.",
          });
        }
      } else {
        toast({
          title: "Session ended",
          description: "The testing session has been completed.",
          variant: "success",
        });
      }

      setEndSessionDialog({ open: false, session: null });
      setDialogSessionData(null);
      fetchSessions();
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEndingSession(false);
      setSendingReportEmails(false);
    }
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
        <Link href="/admin/sessions/new" className="w-full sm:w-auto">
          {/* Mobile Button (Outline, Green) */}
          <Button
            className="sm:hidden w-full text-primary border-primary hover:bg-primary/10 hover:text-primary"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
            New Session
          </Button>
          {/* Desktop Button (Filled, Default) */}
          <Button className="hidden sm:flex" variant="default">
            <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
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
                    {s.companies?.name && (
                      <p className="text-xs text-primary/80 font-medium tracking-wide uppercase">
                        {s.companies.name}
                      </p>
                    )}
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
                    {/* Mobile: Gray Filled */}
                    <Button
                      variant="secondary"
                      className="w-full sm:hidden"
                      size="sm"
                    >
                      Manage
                    </Button>
                    {/* Desktop: Green Outline */}
                    <Button
                      variant="outline"
                      className="w-full hidden sm:inline-flex text-primary border-primary hover:bg-primary/10 hover:text-primary bg-background"
                      size="sm"
                    >
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
                      onClick={() => openEndSessionDialog(s)}
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

      {/* End Session Dialog */}
      <Dialog
        open={endSessionDialog.open}
        onOpenChange={(o) => {
          setEndSessionDialog({ open: o, session: null });
          if (!o) setDialogSessionData(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>End Testing Session?</DialogTitle>
            <DialogDescription>
              Choose how you&apos;d like to end this session.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="rounded-lg bg-secondary/50 p-4 text-sm space-y-3">
              <div>
                <p className="font-medium mb-1">Session Summary</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• {endSessionDialog.session?.notes?.[0]?.count || 0} notes recorded</li>
                  <li>
                    • {endSessionDialog.session?.testers?.[0]?.count || 0} testers participated
                  </li>
                  <li>
                    • {dialogSessionData?.testers?.filter((t: any) => t.email).length || 0}{" "}
                    testers with email addresses
                  </li>
                </ul>
              </div>
            </div>
            {(dialogSessionData?.testers?.filter((t: any) => t.email).length || 0) === 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  No testers have email addresses. Reports can only be shared
                  manually.
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => handleEndSession(false)}
                disabled={endingSession || sendingReportEmails}
                className="flex-1 border-primary text-primary hover:bg-primary/10 hover:text-primary"
              >
                {endingSession && <Loader2 className="w-4 h-4 animate-spin" />}
                <Square className="w-4 h-4" />
                Just End Session
              </Button>
              <Button
                onClick={() => handleEndSession(true)}
                disabled={
                  endingSession ||
                  sendingReportEmails ||
                  (dialogSessionData?.testers?.filter((t: any) => t.email).length || 0) === 0
                }
                className="flex-1"
              >
                {sendingReportEmails && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <Send className="w-4 h-4" />
                End & Send Report
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => setEndSessionDialog({ open: false, session: null })}
              disabled={endingSession || sendingReportEmails}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
