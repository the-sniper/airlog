"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Download, Loader2, FileText, BarChart3, AlertCircle, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getCategoryLabel } from "@/lib/utils";
import type { SessionWithDetails, NoteWithDetails, NoteCategory, Tester } from "@/types";

export default function PublicReportPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchReport = useCallback(async function () {
    try {
      const response = await fetch(`/api/public/report/${token}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        setError("This report is not available or the link has expired.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function generatePDF() {
    if (!session) return;
    setGenerating(true);
    try {
      const response = await fetch(`/api/public/report/${token}`, { method: "POST" });
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
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setGenerating(false);
    }
  }

  function getStats() {
    if (!session?.notes) return null;
    const categoryBreakdown: Record<NoteCategory, number> = {
      bug: 0,
      feature: 0,
      ux: 0,
      performance: 0,
      other: 0,
    };
    session.notes.forEach((note: NoteWithDetails) => {
      categoryBreakdown[note.category]++;
    });
    return { total: session.notes.length, categoryBreakdown };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Report Not Available</h2>
            <p className="text-muted-foreground">
              {error || "This report link is invalid or has expired."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getStats();
  const notesByScene: Record<string, NoteWithDetails[]> = {};
  session.notes?.forEach((note: NoteWithDetails) => {
    const sceneName = note.scene?.name || "Unknown";
    if (!notesByScene[sceneName]) notesByScene[sceneName] = [];
    notesByScene[sceneName].push(note);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="AirLog"
              width={32}
              height={32}
              className="dark:hidden"
            />
            <Image
              src="/logo-dark.svg"
              alt="AirLog"
              width={32}
              height={32}
              className="hidden dark:block"
            />
            <span className="font-semibold text-lg">Session Report</span>
          </div>
          <Button onClick={generatePDF} disabled={generating} size="sm">
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export PDF
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Session Info */}
        <div>
          <h1 className="text-2xl font-bold mb-1">{session.name}</h1>
          {session.description && (
            <p className="text-muted-foreground">{session.description}</p>
          )}
          {session.build_version && (
            <p className="text-sm text-muted-foreground font-mono mt-1">
              Build: {session.build_version}
            </p>
          )}
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Summary
            </CardTitle>
            <CardDescription>
              Completed on {session.ended_at ? formatDate(session.ended_at) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="text-3xl font-bold">{stats?.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total Notes</div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="text-3xl font-bold">{session.testers?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Testers</div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="text-3xl font-bold">{session.scenes?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Scenes</div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="text-3xl font-bold text-red-500">
                  {stats?.categoryBreakdown.bug || 0}
                </div>
                <div className="text-sm text-muted-foreground">Bugs Found</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.categoryBreakdown || {}).map(([category, count]) => (
                <div key={category} className="flex items-center gap-3">
                  <Badge
                    variant={category as "bug" | "feature" | "ux" | "performance" | "secondary"}
                    className="w-32 justify-center"
                  >
                    {getCategoryLabel(category)}
                  </Badge>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: `${stats?.total ? (count / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stability Issues */}
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

        {/* AI Summary */}
        {session.ai_summary && (
          <Card>
            <CardHeader>
              <CardTitle>AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {session.ai_summary}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes by Scene */}
        {Object.entries(notesByScene).map(([sceneName, notes]) => (
          <Card key={sceneName}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{sceneName}</CardTitle>
                <Badge variant="secondary">{notes.length} notes</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="p-4 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          note.category as "bug" | "feature" | "ux" | "performance" | "secondary"
                        }
                      >
                        {getCategoryLabel(note.category)}
                      </Badge>
                      {note.auto_classified && (
                        <span className="text-xs text-muted-foreground">(auto)</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {note.tester?.first_name} {note.tester?.last_name} •{" "}
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">
                    {note.edited_transcript || note.raw_transcript || "No transcript"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* No Notes State */}
        {(!session.notes || session.notes.length === 0) && (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">No Notes Recorded</h3>
              <p className="text-sm text-muted-foreground">
                This session was completed without any notes.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p>Generated by AirLog • Voice-first testing feedback platform</p>
        </div>
      </main>
    </div>
  );
}
