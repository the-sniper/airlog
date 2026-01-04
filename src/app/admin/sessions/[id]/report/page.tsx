"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  Share2,
  Copy,
  Check,
  Link as LinkIcon,
  Unlink,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import SessionReportView from "@/components/reports/session-report-view";
import type { SessionWithDetails, PollResponse } from "@/types";

export default function AdminReportPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { toast } = useToast();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [pollResponses, setPollResponses] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [generatingShareLink, setGeneratingShareLink] = useState(false);
  const [removingShareLink, setRemovingShareLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSession = useCallback(
    async function () {
      try {
        const response = await fetch(`/api/sessions/${id}`);
        if (response.ok) setSession(await response.json());
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  const fetchPollResponses = useCallback(
    async function () {
      try {
        const response = await fetch(`/api/sessions/${id}/poll-responses`);
        if (!response.ok) return;
        const data = await response.json();
        const normalized: PollResponse[] = (data || []).map((resp: any) => ({
          id: resp.id,
          poll_question_id: resp.poll_question_id,
          tester_id: resp.tester_id,
          selected_options: resp.selected_options || [],
          created_at: resp.created_at,
        }));
        setPollResponses(normalized);
      } catch (error) {
        console.error("Error fetching poll responses:", error);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchSession();
    fetchPollResponses();
  }, [fetchSession, fetchPollResponses]);

  async function generatePDF() {
    if (!session) return;
    setGenerating(true);
    try {
      const response = await fetch(`/api/sessions/${id}/report`, {
        method: "POST",
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${session.name.replace(/\s+/g, "-")}-report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function generateShareLink() {
    setGeneratingShareLink(true);
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_share_token" }),
      });
      if (response.ok) {
        const updatedSession = await response.json();
        setSession({ ...session!, share_token: updatedSession.share_token });
        toast({
          title: "Share link created",
          description: "Anyone with the link can view this report.",
        });
      }
    } catch (error) {
      console.error("Error creating share link:", error);
      toast({ title: "Failed to create share link", variant: "destructive" });
    } finally {
      setGeneratingShareLink(false);
    }
  }

  async function removeShareLink() {
    setRemovingShareLink(true);
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_share_token" }),
      });
      if (response.ok) {
        setSession({ ...session!, share_token: null });
        toast({
          title: "Share link removed",
          description: "Public access disabled.",
        });
      }
    } catch (error) {
      console.error("Error removing share link:", error);
      toast({ title: "Failed to remove share link", variant: "destructive" });
    } finally {
      setRemovingShareLink(false);
    }
  }

  function copyShareLink() {
    if (!session?.share_token) return;
    const url = `${window.location.origin}/report/${session.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied",
      description: "Public report link copied to clipboard.",
    });
  }

  function getShareUrl() {
    if (!session?.share_token) return "";
    return `${window.location.origin}/report/${session.share_token}`;
  }

  if (loading)
    return (
      <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
        <div className="h-14 rounded-lg bg-muted/30" />
        <div className="h-12 rounded-lg bg-muted/30" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-secondary/30" />
          ))}
        </div>
      </div>
    );

  if (!session)
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Session not found</h2>
        <Link href="/admin">
          <Button variant="ghost">Back</Button>
        </Link>
      </div>
    );

  if (session.status !== "completed")
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Report Not Available</h2>
        <p className="text-muted-foreground mb-4">
          Reports only available for completed sessions.
        </p>
        <Link href={`/admin/sessions/${id}`}>
          <Button variant="ghost">Back to Session</Button>
        </Link>
      </div>
    );

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/sessions/${id}`}>
            <Button variant="ghost" size="icon" aria-label="Back to session">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Session Report</h1>
            <p className="text-sm text-muted-foreground">
              {session.name} (Admin View)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button onClick={generatePDF} disabled={generating}>
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      <SessionReportView
        session={session}
        pollResponses={pollResponses}
        shareToken={session.share_token || undefined}
        analyticsEndpoint={`/api/sessions/${id}/historical`}
      />

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Report
              </DialogTitle>
            </div>
            <DialogDescription>
              Create a public link that anyone can use to view this report.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {session.share_token ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      readOnly
                      value={getShareUrl()}
                      className="pr-10 font-mono text-sm"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={copyShareLink}>
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <LinkIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Public sharing is enabled
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                <Unlink className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  No public link created yet
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end">
            {session.share_token ? (
              <Button
                variant="outline"
                onClick={removeShareLink}
                disabled={removingShareLink}
                className="text-destructive hover:text-destructive"
              >
                {removingShareLink ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlink className="w-4 h-4 mr-2" />
                )}
                Disable Link
              </Button>
            ) : (
              <Button
                onClick={generateShareLink}
                disabled={generatingShareLink}
              >
                {generatingShareLink ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4 mr-2" />
                )}
                Create Share Link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
