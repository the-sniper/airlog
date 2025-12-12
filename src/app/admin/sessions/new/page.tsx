"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SceneInput {
  name: string;
  description: string | null;
}

function FormattedDescription({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  
  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-0.5 ml-1">
          {currentList.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^(?:[•\-\*\>]|\d+[\.\)])\s*(.*)$/);
    
    if (bulletMatch) {
      currentList.push(bulletMatch[1] || trimmed.slice(1).trim());
    } else if (trimmed === '') {
      flushList();
    } else {
      flushList();
      elements.push(<p key={`text-${index}`} className="text-xs">{trimmed}</p>);
    }
  });
  
  flushList();
  
  return <div className="text-xs text-muted-foreground space-y-1">{elements}</div>;
}

export default function NewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [buildVersion, setBuildVersion] = useState("");
  const [scenes, setScenes] = useState<SceneInput[]>([]);
  const [addSceneDialog, setAddSceneDialog] = useState(false);
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneDescription, setNewSceneDescription] = useState("");

  function openAddSceneDialog() {
    setNewSceneName("");
    setNewSceneDescription("");
    setAddSceneDialog(true);
  }

  function handleAddScene() {
    if (newSceneName.trim()) {
      setScenes([...scenes, { name: newSceneName.trim(), description: newSceneDescription.trim() || null }]);
      setNewSceneName("");
      setNewSceneDescription("");
      setAddSceneDialog(false);
    }
  }

  function removeScene(i: number) { setScenes(scenes.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || scenes.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), description: description.trim() || null, build_version: buildVersion.trim() || null, scenes }) });
      if (res.ok) { const session = await res.json(); router.push(`/admin/sessions/${session.id}`); }
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4"><Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link><div><h1 className="text-2xl font-bold">Create Session</h1><p className="text-muted-foreground">Set up a new test session</p></div></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card><CardHeader><CardTitle>Session Details</CardTitle><CardDescription>Basic information</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="name">Session Name *</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sprint 24" required /></div><div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of what's being tested..." className="min-h-[80px] resize-none" /></div><div className="space-y-2"><Label htmlFor="buildVersion">Build / Version</Label><Input id="buildVersion" value={buildVersion} onChange={(e) => setBuildVersion(e.target.value)} placeholder="e.g., v2.1.0" /></div></CardContent></Card>
        <Card>
          <CardHeader><CardTitle>Scenes</CardTitle><CardDescription>Areas being tested</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {scenes.length > 0 ? (
              <div className="space-y-2">
                {scenes.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 group">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{s.name}</span>
                      {s.description && (
                        <div className="mt-1">
                          <FormattedDescription text={s.description} />
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0" onClick={() => removeScene(i)}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" className="w-full border-dashed" onClick={openAddSceneDialog}><Plus className="w-4 h-4 mr-2" />Add Scene</Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openAddSceneDialog}
                className="w-full py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Add your first scene</span>
                <span className="text-xs">Define areas or features to test</span>
              </button>
            )}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-4"><Link href="/admin"><Button type="button" variant="ghost">Cancel</Button></Link><Button type="submit" disabled={loading || !name.trim() || scenes.length === 0}>{loading && <Loader2 className="w-4 h-4 animate-spin" />}Create Session</Button></div>
      </form>

      <Dialog open={addSceneDialog} onOpenChange={setAddSceneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Scene</DialogTitle>
            <DialogDescription>
              Add a new scene or area to test
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sceneName">Scene Name</Label>
              <Input
                id="sceneName"
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                placeholder="e.g., Login Flow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sceneDescription">What to Test <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="sceneDescription"
                value={newSceneDescription}
                onChange={(e) => setNewSceneDescription(e.target.value)}
                placeholder={"Use bullet points for clarity:\n• Check login with valid credentials\n• Try invalid password\n• Test forgot password flow"}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">Tip: Use • or - for bullet points</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setAddSceneDialog(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddScene}
              disabled={!newSceneName.trim()}
            >
              Add Scene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
