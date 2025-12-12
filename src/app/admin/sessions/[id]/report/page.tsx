"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getCategoryLabel } from "@/lib/utils";
import type { SessionWithDetails, NoteWithDetails, NoteCategory } from "@/types";

export default function ReportPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchSession(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function fetchSession() {
    try {
      const response = await fetch(`/api/sessions/${id}`);
      if (response.ok) setSession(await response.json());
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  }

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
        <Button onClick={generatePDF} disabled={generating}>{generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Export PDF</Button>
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
    </div>
  );
}

