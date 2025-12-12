"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Copy, Check, Play, Square, Users, FileText, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, getStatusLabel, getCategoryLabel } from "@/lib/utils";
import type { SessionWithDetails, Tester, NoteWithDetails } from "@/types";

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [addTesterDialog, setAddTesterDialog] = useState(false);
  const [newTesterName, setNewTesterName] = useState("");
  const [addingTester, setAddingTester] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => { fetchSession(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function fetchSession() { try { const res = await fetch(`/api/sessions/${id}`); if (res.ok) setSession(await res.json()); } finally { setLoading(false); } }
  async function handleStartSession() { await fetch(`/api/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }) }); fetchSession(); }
  async function handleEndSession() { await fetch(`/api/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "end" }) }); fetchSession(); }
  async function handleAddTester() { if (!newTesterName.trim()) return; setAddingTester(true); try { await fetch(`/api/sessions/${id}/testers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTesterName.trim() }) }); setNewTesterName(""); setAddTesterDialog(false); fetchSession(); } finally { setAddingTester(false); } }
  async function handleDeleteTester(testerId: string) { await fetch(`/api/sessions/${id}/testers?testerId=${testerId}`, { method: "DELETE" }); fetchSession(); }
  function copyInviteLink(token: string) { navigator.clipboard.writeText(`${window.location.origin}/join/${token}`); setCopiedToken(token); setTimeout(() => setCopiedToken(null), 2000); }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-secondary rounded" /><div className="h-64 bg-secondary rounded-xl" /></div>;
  if (!session) return <div className="text-center py-16"><h2 className="text-xl font-semibold mb-2">Session not found</h2><Link href="/admin"><Button variant="ghost">Back</Button></Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4"><Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link><div><div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{session.name}</h1><Badge variant={session.status as "draft" | "active" | "completed"}>{getStatusLabel(session.status)}</Badge></div>{session.build_version && <p className="text-sm text-muted-foreground font-mono">{session.build_version}</p>}</div></div>
        <div className="flex items-center gap-2">{session.status === "draft" && <Button onClick={handleStartSession}><Play className="w-4 h-4" />Start Session</Button>}{session.status === "active" && <Button variant="destructive" onClick={handleEndSession}><Square className="w-4 h-4" />End Session</Button>}{session.status === "completed" && <Link href={`/admin/sessions/${id}/report`}><Button>View Report</Button></Link>}</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><Card><CardContent className="pt-6"><div className="text-2xl font-bold">{session.scenes?.length || 0}</div><p className="text-sm text-muted-foreground">Scenes</p></CardContent></Card><Card><CardContent className="pt-6"><div className="text-2xl font-bold">{session.testers?.length || 0}</div><p className="text-sm text-muted-foreground">Testers</p></CardContent></Card><Card><CardContent className="pt-6"><div className="text-2xl font-bold">{session.notes?.length || 0}</div><p className="text-sm text-muted-foreground">Notes</p></CardContent></Card><Card><CardContent className="pt-6"><div className="text-2xl font-bold">{formatDate(session.created_at).split(",")[0]}</div><p className="text-sm text-muted-foreground">Created</p></CardContent></Card></div>
      <Tabs defaultValue="testers"><TabsList><TabsTrigger value="testers" className="gap-2"><Users className="w-4 h-4" />Testers</TabsTrigger><TabsTrigger value="notes" className="gap-2"><FileText className="w-4 h-4" />Notes</TabsTrigger></TabsList>
        <TabsContent value="testers" className="mt-4"><Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Testers</CardTitle><CardDescription>{session.status === "completed" ? "Testers who participated" : "Manage testers and invite links"}</CardDescription></div>{session.status !== "completed" && <Button onClick={() => setAddTesterDialog(true)}><Plus className="w-4 h-4" />Add Tester</Button>}</div></CardHeader><CardContent>{session.testers?.length === 0 ? <div className="text-center py-8 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No testers added</p></div> : <div className="space-y-3">{session.testers?.map((t: Tester) => <div key={t.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 group"><div><p className="font-medium">{t.name}</p>{session.status !== "completed" && <p className="text-sm text-muted-foreground font-mono">/join/{t.invite_token}</p>}</div>{session.status !== "completed" && <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => copyInviteLink(t.invite_token)}>{copiedToken === t.invite_token ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}Copy</Button><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTester(t.id)}><Trash2 className="w-4 h-4" /></Button></div>}</div>)}</div>}</CardContent></Card></TabsContent>
        <TabsContent value="notes" className="mt-4"><Card><CardHeader><CardTitle>Notes</CardTitle><CardDescription>{session.status === "completed" ? "All notes" : "Notes visible after session ends"}</CardDescription></CardHeader><CardContent>{session.status !== "completed" ? <div className="text-center py-8 text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Notes hidden during sessions</p></div> : session.notes?.length === 0 ? <div className="text-center py-8 text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No notes recorded</p></div> : <div className="space-y-4">{session.notes?.map((n: NoteWithDetails) => <div key={n.id} className="p-4 rounded-lg border border-border"><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><Badge variant={n.category as "bug" | "feature" | "ux" | "performance" | "secondary"}>{getCategoryLabel(n.category)}</Badge><span className="text-sm text-muted-foreground">{n.scene?.name}</span></div><span className="text-xs text-muted-foreground">{n.tester?.name} • {formatDate(n.created_at)}</span></div><p className="text-sm">{n.edited_transcript || n.raw_transcript || "No transcript"}</p>{n.audio_url && <audio src={n.audio_url} controls className="mt-2 w-full h-8" />}</div>)}</div>}</CardContent></Card></TabsContent>
      </Tabs>
      <Dialog open={addTesterDialog} onOpenChange={setAddTesterDialog}><DialogContent><DialogHeader><DialogTitle>Add Tester</DialogTitle><DialogDescription>Create a new tester with invite link</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="testerName">Tester Name</Label><Input id="testerName" value={newTesterName} onChange={(e) => setNewTesterName(e.target.value)} placeholder="e.g., John Doe" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTester(); } }} /></div></div><DialogFooter><Button variant="ghost" onClick={() => setAddTesterDialog(false)}>Cancel</Button><Button onClick={handleAddTester} disabled={addingTester || !newTesterName.trim()}>{addingTester && <Loader2 className="w-4 h-4 animate-spin" />}Add Tester</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
