"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, FileText, BarChart3, TrendingUp, Activity, AlertTriangle, ClipboardList, Filter, X, CheckCircle, XCircle, Share2, Copy, Check, Link as LinkIcon, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, getCategoryLabel } from "@/lib/utils";
import { AnalyticsTab } from "@/components/analytics";
import type { SessionWithDetails, NoteWithDetails, NoteCategory, PollResponse, PollQuestion, Scene, Tester } from "@/types";

export default function ReportPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [pollResponses, setPollResponses] = useState<PollResponse[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sceneFilter, setSceneFilter] = useState<string>("all");
  const [testerFilter, setTesterFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<"scene" | "tester" | "category">("scene");
  const [noteFiltersOpen, setNoteFiltersOpen] = useState(false);
  const [pollSceneFilter, setPollSceneFilter] = useState<string>("all");
  const [pollTesterFilter, setPollTesterFilter] = useState<string>("all");
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

  const fetchPollResponses = useCallback(async function() {
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
  }, [id]);

  useEffect(() => { fetchSession(); fetchPollResponses(); }, [fetchSession, fetchPollResponses]);

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

  function getStats() {
    if (!session?.notes) return null;
    const categoryBreakdown: Record<NoteCategory, number> = { bug: 0, feature: 0, ux: 0, performance: 0, other: 0 };
    session.notes.forEach((note: NoteWithDetails) => { categoryBreakdown[note.category]++; });
    return { total: session.notes.length, categoryBreakdown };
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
        toast({ title: "Share link created", description: "Anyone with the link can view this report." });
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
        toast({ title: "Share link removed", description: "Public access disabled." });
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
    toast({ title: "Link copied", description: "Public report link copied to clipboard." });
  }

  function getShareUrl() {
    if (!session?.share_token) return "";
    return `${window.location.origin}/report/${session.share_token}`;
  }

  const filteredNotes = useMemo(() => {
    if (!session?.notes) return [];
    return session.notes.filter((note) => {
      if (categoryFilter !== "all" && note.category !== categoryFilter) return false;
      if (sceneFilter !== "all" && note.scene_id !== sceneFilter) return false;
      if (testerFilter !== "all" && note.tester_id !== testerFilter) return false;
      return true;
    });
  }, [session?.notes, categoryFilter, sceneFilter, testerFilter]);

  const hasActiveFilters = categoryFilter !== "all" || sceneFilter !== "all" || testerFilter !== "all";
  const canShowNoteFilters = !!session?.notes && session.notes.length > 0;

  function clearFilters() {
    setCategoryFilter("all");
    setSceneFilter("all");
    setTesterFilter("all");
  }

  const groupedNotes = useMemo(() => {
    const groups: Record<string, { label: string; notes: NoteWithDetails[] }> = {};
    
    filteredNotes.forEach((note) => {
      let key: string;
      let label: string;
      
      switch (groupBy) {
        case "tester":
          key = note.tester_id;
          label = note.tester ? `${note.tester.first_name} ${note.tester.last_name}` : "Unknown Tester";
          break;
        case "category":
          key = note.category;
          label = getCategoryLabel(note.category);
          break;
        case "scene":
        default:
          key = note.scene_id;
          label = note.scene?.name || "Unknown Scene";
          break;
      }
      
      if (!groups[key]) {
        groups[key] = { label, notes: [] };
      }
      groups[key].notes.push(note);
    });
    
    return groups;
  }, [filteredNotes, groupBy]);

  const stats = getStats();

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-secondary rounded" /><div className="h-64 bg-secondary rounded-xl" /></div>;
  if (!session) return <div className="text-center py-16"><h2 className="text-xl font-semibold mb-2">Session not found</h2><Link href="/admin"><Button variant="ghost">Back</Button></Link></div>;
  if (session.status !== "completed") return <div className="text-center py-16"><FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" /><h2 className="text-xl font-semibold mb-2">Report Not Available</h2><p className="text-muted-foreground mb-4">Reports only available for completed sessions.</p><Link href={`/admin/sessions/${id}`}><Button variant="ghost">Back to Session</Button></Link></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/sessions/${id}`}>
            <Button variant="ghost" size="icon" aria-label="Back to session">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Session Report</h1>
            <p className="text-muted-foreground">{session.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button onClick={generatePDF} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="report" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Report
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Summary</CardTitle><CardDescription>Completed on {session.ended_at ? formatDate(session.ended_at) : "N/A"}</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30"><div className="text-3xl font-bold">{stats?.total || 0}</div><div className="text-sm text-muted-foreground">Total Notes</div></div>
                <div className="p-4 rounded-lg bg-secondary/30"><div className="text-3xl font-bold">{session.testers?.length || 0}</div><div className="text-sm text-muted-foreground">Testers</div></div>
                <div className="p-4 rounded-lg bg-secondary/30"><div className="text-3xl font-bold">{session.scenes?.length || 0}</div><div className="text-sm text-muted-foreground">Scenes</div></div>
                <div className="p-4 rounded-lg bg-secondary/30"><div className="text-3xl font-bold text-red-500">{stats?.categoryBreakdown.bug || 0}</div><div className="text-sm text-muted-foreground">Bugs Found</div></div>
                <div className="p-4 rounded-lg bg-secondary/30"><div className="text-3xl font-bold text-amber-500">{session.testers?.reduce((total: number, tester: Tester) => total + (tester.reported_issues?.length || 0), 0) || 0}</div><div className="text-sm text-muted-foreground">Stability Issues</div></div>
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
                      .map(([issue, stats]) => {
                        const percentage = totalTesters ? (stats.count / totalTesters) * 100 : 0;
                        const getColorClasses = () => {
                          if (percentage < 50) return { icon: "text-green-500", bar: "bg-green-500 dark:bg-green-400/60" };
                          if (percentage <= 80) return { icon: "text-amber-500", bar: "bg-amber-500 dark:bg-amber-400/60" };
                          return { icon: "text-red-500", bar: "bg-red-500 dark:bg-red-400/60" };
                        };
                        const colors = getColorClasses();
                        
                        const getIcon = () => {
                          if (percentage < 50) return <CheckCircle className={`w-4 h-4 ${colors.icon}`} />;
                          if (percentage <= 80) return <AlertTriangle className={`w-4 h-4 ${colors.icon}`} />;
                          return <XCircle className={`w-4 h-4 ${colors.icon}`} />;
                        };

                        return (
                          <div key={issue} className="p-3 rounded-lg bg-secondary/30 border border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getIcon()}
                                <span className="text-sm font-medium">{issue}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${colors.bar} rounded-full`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{stats.count}/{totalTesters}</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground/70 mt-1.5 ml-7">
                              {stats.testers.join(", ")}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Poll Results */}
          {(() => {
            const allPollQuestions: (PollQuestion & { sceneName: string; sceneId: string })[] = [];
            session.scenes?.forEach((scene: Scene) => {
              if (scene.poll_questions && scene.poll_questions.length > 0) {
                scene.poll_questions.forEach((q: PollQuestion) => {
                  allPollQuestions.push({ ...q, sceneName: scene.name, sceneId: scene.id });
                });
              }
            });

            if (allPollQuestions.length === 0) return null;

            const filteredPollQuestions = pollSceneFilter === "all" 
              ? allPollQuestions 
              : allPollQuestions.filter(q => q.sceneId === pollSceneFilter);

            const totalTesters = session.testers?.length || 0;
            const hasPollFilters = pollSceneFilter !== "all" || pollTesterFilter !== "all";

            const clearPollFilters = () => {
              setPollSceneFilter("all");
              setPollTesterFilter("all");
            };

            return (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-500" />
                        Poll Results
                      </CardTitle>
                      {hasPollFilters && (
                        <Button variant="ghost" size="sm" onClick={clearPollFilters} className="text-xs">
                          <X className="w-3 h-3 mr-1" />
                          Clear filters
                        </Button>
                      )}
                    </div>
                    <CardDescription>Responses from {totalTesters} tester{totalTesters !== 1 ? "s" : ""}</CardDescription>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Filter:</span>
                      </div>

                      {session.scenes && session.scenes.length > 0 && (
                        <Select value={pollSceneFilter} onValueChange={setPollSceneFilter}>
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue placeholder="Scene" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Scenes</SelectItem>
                            {session.scenes.map((scene: Scene) => (
                              <SelectItem key={scene.id} value={scene.id}>{scene.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {session.testers && session.testers.length > 0 && (
                        <Select value={pollTesterFilter} onValueChange={setPollTesterFilter}>
                          <SelectTrigger className="h-8 w-[150px] text-xs">
                            <SelectValue placeholder="Tester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Testers</SelectItem>
                            {session.testers.map((tester: Tester) => (
                              <SelectItem key={tester.id} value={tester.id}>{tester.first_name} {tester.last_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {filteredPollQuestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No poll questions match the selected filters</p>
                      <Button variant="ghost" size="sm" onClick={clearPollFilters} className="mt-2">
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    filteredPollQuestions.map((question) => {
                      const questionResponses = pollResponses.filter(r => {
                        if (r.poll_question_id !== question.id) return false;
                        if (pollTesterFilter !== "all" && r.tester_id !== pollTesterFilter) return false;
                        return true;
                      });
                      const optionCounts: Record<string, { count: number; testers: string[] }> = {};
                      question.options.forEach(opt => {
                        optionCounts[opt] = { count: 0, testers: [] };
                      });
                      
                      questionResponses.forEach(response => {
                        const tester = session.testers?.find((t: Tester) => t.id === response.tester_id);
                        const testerName = tester ? `${tester.first_name} ${tester.last_name}` : "Unknown";
                        response.selected_options.forEach(opt => {
                          if (optionCounts[opt]) {
                            optionCounts[opt].count++;
                            optionCounts[opt].testers.push(testerName);
                          }
                        });
                      });

                      const respondedCount = questionResponses.length;
                      const displayTotalTesters = pollTesterFilter !== "all" ? 1 : totalTesters;

                      return (
                        <div key={question.id} className="space-y-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">{question.sceneName}</Badge>
                              {question.required && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">Required</Badge>}
                            </div>
                            <p className="font-medium">{question.question}</p>
                            <p className="text-xs text-muted-foreground">
                              {respondedCount}/{displayTotalTesters} responded • {question.question_type === "radio" ? "Single choice" : "Multiple choice"}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {question.options.map((option) => {
                              const stats = optionCounts[option];
                              const percentage = respondedCount > 0 ? (stats.count / respondedCount) * 100 : 0;
                              return (
                                <div key={option} className="p-3 rounded-lg bg-secondary/30 border border-border">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm">{option}</span>
                                    <span className="text-sm font-medium">{stats.count} ({Math.round(percentage)}%)</span>
                                  </div>
                                  <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 dark:bg-blue-400/60 rounded-full transition-all duration-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  {stats.testers.length > 0 && (
                                    <p className="text-xs text-muted-foreground/70 mt-1.5">
                                      {stats.testers.join(", ")}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })()}

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Notes ({filteredNotes.length}{hasActiveFilters ? ` of ${session.notes?.length || 0}` : ""})</CardTitle>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                        <X className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Clear filters</span>
                        <span className="sm:hidden">Clear</span>
                      </Button>
                    )}
                    {canShowNoteFilters && (
                      <Dialog open={noteFiltersOpen} onOpenChange={setNoteFiltersOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="sm:hidden" aria-label="Filters">
                            <Filter className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:hidden left-1/2 top-auto bottom-0 -translate-x-1/2 translate-y-0 w-full max-w-full rounded-t-2xl rounded-b-none p-5 pb-6 shadow-2xl border border-border/70 max-h-[85vh] min-h-[55vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom">
                          <DialogHeader className="text-left space-y-1">
                            <DialogTitle>Filters & Grouping</DialogTitle>
                            <DialogDescription>Refine the notes list or change how notes are grouped.</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="space-y-3">
                              <p className="text-sm font-medium">Filter by</p>
                              <div className="space-y-2">
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                  <SelectTrigger className="h-10 w-full text-sm">
                                    <SelectValue placeholder="Category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="bug">Bug</SelectItem>
                                    <SelectItem value="feature">Feature</SelectItem>
                                    <SelectItem value="ux">UX</SelectItem>
                                    <SelectItem value="performance">Performance</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>

                                {session.scenes && session.scenes.length > 0 && (
                                  <Select value={sceneFilter} onValueChange={setSceneFilter}>
                                    <SelectTrigger className="h-10 w-full text-sm">
                                      <SelectValue placeholder="Scene" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Scenes</SelectItem>
                                      {session.scenes.map((scene: Scene) => (
                                        <SelectItem key={scene.id} value={scene.id}>{scene.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}

                                {session.testers && session.testers.length > 0 && (
                                  <Select value={testerFilter} onValueChange={setTesterFilter}>
                                    <SelectTrigger className="h-10 w-full text-sm">
                                      <SelectValue placeholder="Tester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Testers</SelectItem>
                                      {session.testers.map((tester: Tester) => (
                                        <SelectItem key={tester.id} value={tester.id}>{tester.first_name} {tester.last_name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-sm font-medium">Group by</p>
                              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "scene" | "tester" | "category")}>
                                <SelectTrigger className="h-10 w-full text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="scene">Scene</SelectItem>
                                  <SelectItem value="tester">Tester</SelectItem>
                                  <SelectItem value="category">Category</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center justify-between gap-3 pt-1">
                              {hasActiveFilters ? (
                                <Button variant="ghost" size="sm" className="text-sm" onClick={clearFilters}>
                                  <X className="w-4 h-4 mr-1" />
                                  Clear filters
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">No filters applied</span>
                              )}
                              <Button size="sm" className="min-w-[96px]" onClick={() => setNoteFiltersOpen(false)}>
                                Done
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
                
                {canShowNoteFilters && (
                  <div className="hidden sm:flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Filter:</span>
                    </div>
                    
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="ux">UX</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    {session.scenes && session.scenes.length > 0 && (
                      <Select value={sceneFilter} onValueChange={setSceneFilter}>
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue placeholder="Scene" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Scenes</SelectItem>
                          {session.scenes.map((scene: Scene) => (
                            <SelectItem key={scene.id} value={scene.id}>{scene.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {session.testers && session.testers.length > 0 && (
                      <Select value={testerFilter} onValueChange={setTesterFilter}>
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <SelectValue placeholder="Tester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Testers</SelectItem>
                          {session.testers.map((tester: Tester) => (
                            <SelectItem key={tester.id} value={tester.id}>{tester.first_name} {tester.last_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-sm text-muted-foreground">Group by:</span>
                      <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "scene" | "tester" | "category")}>
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scene">Scene</SelectItem>
                          <SelectItem value="tester">Tester</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {Object.entries(groupedNotes).map(([key, { label, notes }]) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {groupBy === "category" && (
                      <Badge variant={key as "bug" | "feature" | "ux" | "performance" | "secondary"}>{label}</Badge>
                    )}
                    {groupBy !== "category" && label}
                  </CardTitle>
                  <Badge variant="secondary">{notes.length} note{notes.length !== 1 ? "s" : ""}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 rounded-lg border border-border">
                    <div className="flex flex-col gap-2 mb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {groupBy !== "category" && (
                            <Badge variant={note.category as "bug" | "feature" | "ux" | "performance" | "secondary"}>{getCategoryLabel(note.category)}</Badge>
                          )}
                          {groupBy !== "scene" && (
                            <Badge variant="outline" className="text-xs">{note.scene?.name}</Badge>
                          )}
                          {note.auto_classified && <span className="text-xs text-muted-foreground">(auto)</span>}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {groupBy !== "tester" && `${note.tester?.first_name} ${note.tester?.last_name} • `}
                        {formatDate(note.created_at)}
                      </span>
                    </div>
                    <p className="text-sm">{note.edited_transcript || note.raw_transcript || "No transcript"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {filteredNotes.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">
                  {hasActiveFilters ? "No Notes Match Filters" : "No Notes Recorded"}
                </h3>
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab session={session} pollResponses={pollResponses} sessionId={id} />
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Report
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button onClick={generatePDF} disabled={generating} variant="outline" size="sm" className="gap-2">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                {session.share_token ? (
                  <Button onClick={copyShareLink} size="sm" variant="default" className="gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                    Copy Link
                  </Button>
                ) : (
                  <Button onClick={generateShareLink} disabled={generatingShareLink} size="sm" className="gap-2">
                    {generatingShareLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                    Create Link
                  </Button>
                )}
              </div>
            </div>
            <DialogDescription>Create a public link that anyone can use to view this report.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {session.share_token ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input readOnly value={getShareUrl()} className="pr-10 font-mono text-sm" />
                  </div>
                  <Button variant="outline" size="icon" onClick={copyShareLink}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <LinkIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-600 dark:text-green-400">Public sharing is enabled</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                <Unlink className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No public link created yet</span>
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
                {removingShareLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                Disable Link
              </Button>
            ) : (
              <Button onClick={generateShareLink} disabled={generatingShareLink}>
                {generatingShareLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                Create Share Link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
