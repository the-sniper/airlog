"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Mic, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceRecorder } from "@/components/voice-recorder";
import { NotesList } from "@/components/notes-list";
import type { SessionWithScenes, Tester, Scene, Note } from "@/types";

interface JoinData { tester: Tester; session: SessionWithScenes; }

export default function TesterSessionPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [data, setData] = useState<JoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; type: string } | null>(null);
  const [selectedScene, setSelectedScene] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { fetchSession(); return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); }; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

  async function fetchSession() {
    try {
      // Add cache-busting to prevent browser caching
      const res = await fetch(`/api/join/${token}?t=${Date.now()}`, { cache: 'no-store' });
      const result = await res.json();
      if (!res.ok) {
        let type = "error";
        if (res.status === 410) {
          type = "ended";
          // Session ended - stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
        if (res.status === 425) {
          type = "not_started";
          // Start polling if session not started yet
          if (!pollIntervalRef.current) {
            pollIntervalRef.current = setInterval(fetchSession, 3000);
          }
        }
        setError({ message: result.error, type });
        setLoading(false);
        return;
      }
      // Session is active - start/continue polling to detect when it ends
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(fetchSession, 5000); // Poll every 5 seconds while active
      }
      setError(null);
      setData(result);
      if (result.session.scenes?.length > 0 && !selectedScene) setSelectedScene(result.session.scenes[0].id);
      fetchNotes(result.session.id, result.tester.id);
    } catch { 
      setError({ message: "Failed to load session", type: "error" }); 
    }
    finally { setLoading(false); }
  }

  async function fetchNotes(sessionId: string, testerId: string) { try { const res = await fetch(`/api/sessions/${sessionId}/notes?testerId=${testerId}`); if (res.ok) setNotes(await res.json()); } catch {} }
  function handleNoteCreated(note: Note) { setNotes((prev) => [...prev, note]); }
  function handleNoteUpdated(updatedNote: Note) { setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))); }

  if (loading) return <div className="min-h-screen gradient-mesh flex items-center justify-center"><div className="text-center"><div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"><Mic className="w-8 h-8 text-primary" /></div><p className="text-muted-foreground">Loading...</p></div></div>;
  if (error) return <div className="min-h-screen gradient-mesh flex items-center justify-center p-4"><Card className="max-w-md w-full"><CardContent className="pt-6 text-center">{error.type === "ended" ? <><CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" /><h2 className="text-xl font-semibold mb-2">Session Completed</h2><p className="text-muted-foreground mb-4">Thank you for your feedback!</p></> : error.type === "not_started" ? <><Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" /><h2 className="text-xl font-semibold mb-2">Session Not Started</h2><p className="text-muted-foreground mb-4">Please wait for the admin.</p></> : <><AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" /><h2 className="text-xl font-semibold mb-2">Unable to Join</h2><p className="text-muted-foreground mb-4">{error.message}</p></>}<Link href="/join"><Button variant="outline">Try Another Code</Button></Link></CardContent></Card></div>;
  if (!data) return null;

  const { session, tester } = data;
  const currentScene = session.scenes?.find((s: Scene) => s.id === selectedScene);

  return (
    <div className="min-h-screen gradient-mesh">
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-50"><div className="container mx-auto px-4 h-16 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Mic className="w-4 h-4 text-primary-foreground" /></div><div><h1 className="font-semibold">{session.name}</h1><p className="text-xs text-muted-foreground">Testing as {tester.name}</p></div></div><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-sm text-muted-foreground">Live</span></div></div></header>
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground mb-2">Current Scene</p><Select value={selectedScene} onValueChange={setSelectedScene}><SelectTrigger><SelectValue placeholder="Select a scene" /></SelectTrigger><SelectContent>{session.scenes?.map((s: Scene) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></CardContent></Card>
        {currentScene && <VoiceRecorder sessionId={session.id} sceneId={selectedScene} testerId={tester.id} sceneName={currentScene.name} onNoteCreated={handleNoteCreated} />}
        <NotesList notes={notes} sessionId={session.id} onNoteUpdated={handleNoteUpdated} />
      </main>
    </div>
  );
}
