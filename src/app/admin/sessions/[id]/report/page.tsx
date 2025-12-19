"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, FileText, BarChart3, Share2, Copy, Check, Link as LinkIcon, Unlink, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { formatDate, getCategoryLabel } from "@/lib/utils";
import type { SessionWithDetails, NoteWithDetails, NoteCategory, Tester } from "@/types";

export default function ReportPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [generatingShareLink, setGeneratingShareLink] = useState(false);
  const [removingShareLink, setRemovingShareLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSession = useCallback(async function() {
    try {
      const response = await fetch(`/api/sessions/${id}`);
      if (response.ok) setSession(await response.json());
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  async function generatePDF() {
    if (!session) return;
    setGenerating(true);
    try {
      const response = await fetch(`/api/sessions/${id}/report`, { method: "POST" });
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
    } catch (error) { console.error("Error:", error); }
    finally { setGenerating(false); }
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
        toast({ title: "Share link created!", description: "Anyone with the link can view this report.", variant: "success" });
      }
    } catch (error) {
      console.error("Error:", error);
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
        toast({ title: "Share link removed", description: "The public link is no longer active." });
      }
    } catch (error) {
      console.error("Error:", error);
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
    toast({ title: "Link copied!", description: "Share link copied to clipboard." });
  }

  function getShareUrl() {
    if (!session?.share_token) return "";
    return `${window.location.origin}/report/${session.share_token}`;
  }

  function getStats() {
    if (!session?.notes) return null;
    const categoryBreakdown: Record<NoteCategory, number> = { bug: 0, feature: 0, ux: 0, performance: 0, other: 0 };
    session.notes.forEach((note: NoteWithDetails) => { categoryBreakdown[note.category]++; });
    return { total: session.notes.length, categoryBreakdown };
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-secondary rounded" /><div className="h-64 bg-secondary rounded-xl" /></div>;
  if (!session) return <div className="text-center py-16"><h2 className="text-xl font-semibold mb-2">Session not found</h2><Link href="/admin"><Button variant="ghost">Back</Button></Link></div>;
  if (session.status !== "completed") return <div className="text-center py-16"><FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" /><h2 className="text-xl font-semibold mb-2">Report Not Available</h2><p className="text-muted-foreground mb-4">Reports only available for completed sessions.</p><Link href={`/admin/sessions/${id}`}><Button variant="ghost">Back to Session</Button></Link></div>;

  const stats = getStats();
  const notesByScene: Record<string, NoteWithDetails[]> = {};
  session.notes?.forEach((note: NoteWithDetails) => { const sceneName = note.scene?.name || "Unknown"; if (!notesByScene[sceneName]) notesByScene[sceneName] = []; notesByScene[sceneName].push(note); });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/sessions/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div><h1 className="text-2xl font-bold">Session Report</h1><p className="text-muted-foreground">{session.name}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button onClick={generatePDF} disabled={generating}>{generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Export PDF</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Summary</CardTitle><CardDescription>Completed on {session.ended_at ? formatDate(session.ended_at) : "N/A"}</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30"><div className="text-3xl font-bold">{stats?.total || 0}</div><div className="text-sm text-muted-foreground">Total Notes</div></div>
            <div className="p-4 rounded-lg bg-secondary/30"><div className="text-3xl font-bold">{session.testers?.length || 0}</div><div className="text-sm text-muted-foreground">Testers</div></div>
            <div className="p-4 rounded-lg bg-secondary/30"><div className="text-3xl font-bold">{session.scenes?.length || 0}</div><div className="text-sm text-muted-foreground">Scenes</div></div>
            <div className="p-4 rounded-lg bg-secondary/30"><div className="text-3xl font-bold text-red-500">{stats?.categoryBreakdown.bug || 0}</div><div className="text-sm text-muted-foreground">Bugs Found</div></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats?.categoryBreakdown || {}).map(([category, count]) => (
              <div key={category} className="flex items-center gap-3">
                <Badge variant={category as "bug" | "feature" | "ux" | "performance" | "secondary"} className="w-32 justify-center">{getCategoryLabel(category)}</Badge>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${stats?.total ? (count / stats.total) * 100 : 0}%` }} /></div>
                <span className="text-sm font-mono w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {session.issue_options && session.issue_options.length > 0 && (() => {
        const issueStats: Record<string, { count: number; testers: string[] }> = {};
        session.issue_options.forEach((issue: string) => {
          issueStats[issue] = { count: 0, testers: [] };
        });
        session.testers?.forEach((tester: Tester) => {
          const testerIssues = tester.reported_issues || [];
          testerIssues.forEach((issue: string) => {
            if (issueStats[issue]) {
              issueStats[issue].count++;
              issueStats[issue].testers.push(`${tester.first_name} ${tester.last_name}`);
            }
          });
        });
        const totalTesters = session.testers?.length || 0;
        const reportedIssues = Object.entries(issueStats).filter(([, s]) => s.count > 0);

        if (reportedIssues.length === 0) return null;

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                Stability Issues
              </CardTitle>
              <CardDescription>General issues reported during testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportedIssues
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([issue, stats]) => (
                    <div key={issue} className="p-3 rounded-lg bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500/70" />
                          <span className="text-sm font-medium">{issue}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 dark:bg-amber-400/60 rounded-full"
                              style={{ width: `${totalTesters ? (stats.count / totalTesters) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{stats.count}/{totalTesters}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground/70 mt-1.5 ml-7">
                        {stats.testers.join(", ")}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {Object.entries(notesByScene).map(([sceneName, notes]) => (
        <Card key={sceneName}>
          <CardHeader><div className="flex items-center justify-between"><CardTitle>{sceneName}</CardTitle><Badge variant="secondary">{notes.length} notes</Badge></div></CardHeader>
          <CardContent className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2"><Badge variant={note.category as "bug" | "feature" | "ux" | "performance" | "secondary"}>{getCategoryLabel(note.category)}</Badge>{note.auto_classified && <span className="text-xs text-muted-foreground">(auto)</span>}</div>
                  <span className="text-xs text-muted-foreground">{note.tester?.first_name} {note.tester?.last_name} • {formatDate(note.created_at)}</span>
                </div>
                <p className="text-sm">{note.edited_transcript || note.raw_transcript || "No transcript"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {(!session.notes || session.notes.length === 0) && <Card><CardContent className="py-16 text-center"><FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" /><h3 className="font-semibold mb-2">No Notes Recorded</h3></CardContent></Card>}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Report
            </DialogTitle>
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyShareLink}
                  >
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

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {session.share_token ? (
              <>
                <Button
                  variant="outline"
                  onClick={removeShareLink}
                  disabled={removingShareLink}
                  className="text-destructive hover:text-destructive"
                >
                  {removingShareLink ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                  Disable Link
                </Button>
                <Button onClick={copyShareLink}>
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy Link
                </Button>
              </>
            ) : (
              <Button onClick={generateShareLink} disabled={generatingShareLink}>
                {generatingShareLink ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
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

