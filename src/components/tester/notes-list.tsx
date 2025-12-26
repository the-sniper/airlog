"use client";
import { useState, useMemo } from "react";
import {
  FileText,
  Edit2,
  Check,
  X,
  Play,
  Pause,
  SlidersHorizontal,
  Trash2,
  MoreVertical,
  Sparkles,
  AlertTriangle,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, getCategoryLabel } from "@/lib/utils";
import { NoteAISummaryDialog } from "@/components/admin/note-ai-summary-dialog";
import { AISummaryViewDialog } from "@/components/admin/ai-summary-view-dialog";
import type {
  Note,
  NoteWithDetails,
  NoteCategory,
  Scene,
  Tester,
} from "@/types";

interface Props {
  notes: (Note | NoteWithDetails)[];
  sessionId: string;
  scenes?: Scene[];
  testers?: Tester[];
  onNoteUpdated: (note: Note) => void;
  onNoteDeleted?: (noteId: string) => void;
}

const CATEGORIES: { value: NoteCategory; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "ux", label: "UX Feedback" },
  { value: "performance", label: "Performance" },
  { value: "other", label: "Other" },
];

export function NotesList({
  notes,
  sessionId,
  scenes,
  testers,
  onNoteUpdated,
  onNoteDeleted,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteNoteDialog, setDeleteNoteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<
    Note | NoteWithDetails | null
  >(null);
  const [aiSummaryNote, setAiSummaryNote] = useState<
    Note | NoteWithDetails | null
  >(null);
  const [viewSummaryNote, setViewSummaryNote] = useState<
    Note | NoteWithDetails | null
  >(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sceneFilter, setSceneFilter] = useState<string>("all");
  const [testerFilter, setTesterFilter] = useState<string>("all");

  // Filter notes based on selected filters
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (categoryFilter !== "all" && note.category !== categoryFilter)
        return false;
      if (sceneFilter !== "all" && note.scene_id !== sceneFilter) return false;
      if (testerFilter !== "all" && note.tester_id !== testerFilter)
        return false;
      return true;
    });
  }, [notes, categoryFilter, sceneFilter, testerFilter]);

  const hasActiveFilters =
    categoryFilter !== "all" || sceneFilter !== "all" || testerFilter !== "all";

  function clearFilters() {
    setCategoryFilter("all");
    setSceneFilter("all");
    setTesterFilter("all");
  }

  function startEditing(note: Note | NoteWithDetails) {
    setEditingId(note.id);
    setEditText(note.edited_transcript || note.raw_transcript || "");
  }
  function cancelEditing() {
    setEditingId(null);
    setEditText("");
  }
  async function saveEdit(noteId: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edited_transcript: editText }),
      });
      if (res.ok) {
        onNoteUpdated(await res.json());
        setEditingId(null);
        setEditText("");
      }
    } catch { }
  }
  function toggleAudio(noteId: string) {
    const audio = document.getElementById(
      `audio-${noteId}`
    ) as HTMLAudioElement;
    if (audio) {
      if (playingId === noteId) {
        audio.pause();
        setPlayingId(null);
      } else {
        if (playingId)
          (
            document.getElementById(`audio-${playingId}`) as HTMLAudioElement
          )?.pause();
        audio.play();
        setPlayingId(noteId);
        audio.onended = () => setPlayingId(null);
      }
    }
  }
  async function updateCategory(noteId: string, category: NoteCategory) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, auto_classified: false }),
      });
      if (res.ok) {
        onNoteUpdated(await res.json());
      }
    } catch {
    } finally {
      setEditingCategoryId(null);
    }
  }
  async function updateScene(noteId: string, sceneId: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene_id: sceneId }),
      });
      if (res.ok) {
        onNoteUpdated(await res.json());
      }
    } catch {
    } finally {
      setEditingSceneId(null);
    }
  }
  function openDeleteNoteDialog(note: Note | NoteWithDetails) {
    setNoteToDelete(note);
    setDeleteNoteDialog(true);
  }

  async function deleteNote() {
    if (!noteToDelete) return;
    setDeletingId(noteToDelete.id);
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/notes/${noteToDelete.id}`,
        { method: "DELETE" }
      );
      if (res.ok && onNoteDeleted) {
        onNoteDeleted(noteToDelete.id);
        setDeleteNoteDialog(false);
        setNoteToDelete(null);
      }
    } catch {
    } finally {
      setDeletingId(null);
    }
  }
  function getSceneName(note: Note | NoteWithDetails): string {
    if ("scene" in note && note.scene) return note.scene.name;
    if (scenes) {
      const scene = scenes.find((s) => s.id === note.scene_id);
      if (scene) return scene.name;
    }
    return "Unknown";
  }

  function getTesterName(note: Note | NoteWithDetails): string {
    if ("tester" in note && note.tester)
      return `${note.tester.first_name} ${note.tester.last_name}`;
    if (testers) {
      const tester = testers.find((t) => t.id === note.tester_id);
      if (tester) return `${tester.first_name} ${tester.last_name}`;
    }
    return "Unknown";
  }

  if (notes.length === 0)
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-5">
            <FileText
              className="w-7 h-7 text-muted-foreground/50"
              strokeWidth={1.5}
            />
          </div>
          <p className="text-muted-foreground">No notes yet</p>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Notes</span>
          <span className="text-sm font-normal text-muted-foreground">
            {hasActiveFilters
              ? `${filteredNotes.length} of ${notes.length}`
              : `${notes.length}`}{" "}
            notes
          </span>
        </CardTitle>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 flex-1 sm:flex-none sm:w-[140px] text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {scenes && scenes.length > 0 && (
              <Select value={sceneFilter} onValueChange={setSceneFilter}>
                <SelectTrigger className="h-8 flex-1 sm:flex-none sm:w-[130px] text-xs">
                  <SelectValue placeholder="Scene" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scenes</SelectItem>
                  {scenes.map((scene) => (
                    <SelectItem key={scene.id} value={scene.id}>
                      {scene.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {testers && testers.length > 0 && (
              <Select value={testerFilter} onValueChange={setTesterFilter}>
                <SelectTrigger className="h-8 w-[120px] sm:w-[150px] text-xs">
                  <SelectValue placeholder="Tester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Testers</SelectItem>
                  {testers.map((tester) => (
                    <SelectItem key={tester.id} value={tester.id}>
                      {tester.first_name} {tester.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={clearFilters}
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredNotes.length === 0 && hasActiveFilters ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              No notes match the current filters
            </p>
            <Button variant="link" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-lg border border-border bg-card/50 space-y-2 animate-fade-in"
            >
              {/* Row 1: Category, auto tag, scene, three-dot menu */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {editingCategoryId === note.id ? (
                    <Select
                      value={note.category}
                      onValueChange={(value) =>
                        updateCategory(note.id, value as NoteCategory)
                      }
                      onOpenChange={(open) => {
                        if (!open) setEditingCategoryId(null);
                      }}
                    >
                      <SelectTrigger className="h-6 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={
                        note.category as
                        | "bug"
                        | "feature"
                        | "ux"
                        | "performance"
                        | "secondary"
                      }
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => setEditingCategoryId(note.id)}
                    >
                      {getCategoryLabel(note.category)}
                    </Badge>
                  )}
                  {note.auto_classified && (
                    <span className="text-xs text-muted-foreground">
                      (auto)
                    </span>
                  )}
                  {note.ai_summary && (
                    <button
                      onClick={() => setViewSummaryNote(note)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      AI Summary
                    </button>
                  )}
                  {scenes && scenes.length > 0 ? (
                    editingSceneId === note.id ? (
                      <Select
                        value={note.scene_id}
                        onValueChange={(value) => updateScene(note.id, value)}
                        onOpenChange={(open) => {
                          if (!open) setEditingSceneId(null);
                        }}
                      >
                        <SelectTrigger className="h-6 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {scenes.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => setEditingSceneId(note.id)}
                      >
                        {getSceneName(note)}
                      </span>
                    )
                  ) : (
                    "scene" in note &&
                    note.scene && (
                      <span className="text-xs text-muted-foreground">
                        {note.scene.name}
                      </span>
                    )
                  )}
                </div>
                {(note.edited_transcript ||
                  note.raw_transcript ||
                  onNoteDeleted) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 -mr-2"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(note.edited_transcript || note.raw_transcript) && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setAiSummaryNote(note)}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              AI Summary
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => startEditing(note)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </>
                        )}
                        {onNoteDeleted && (
                          <DropdownMenuItem
                            onClick={() => openDeleteNoteDialog(note)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
              </div>

              {/* Row 2: Tester name and date */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{getTesterName(note)}</span>
                <span>{formatDate(note.created_at)}</span>
              </div>

              {/* Row 3: Transcript */}
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={cancelEditing}>
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => saveEdit(note.id)}>
                      <Check className="w-4 h-4" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm">
                  {note.edited_transcript || note.raw_transcript || (
                    <span className="text-muted-foreground italic">
                      [Transcription unavailable]
                    </span>
                  )}
                </p>
              )}
              {note.edited_transcript &&
                note.raw_transcript &&
                note.edited_transcript !== note.raw_transcript && (
                  <details className="text-xs">
                    <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                      Show original
                    </summary>
                    <p className="mt-2 p-2 bg-secondary/30 rounded text-muted-foreground">
                      {note.raw_transcript}
                    </p>
                  </details>
                )}
              {note.audio_url && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => toggleAudio(note.id)}
                  >
                    {playingId === note.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {playingId === note.id ? "Pause" : "Play"}
                  </Button>
                  <audio
                    id={`audio-${note.id}`}
                    src={note.audio_url}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>

      {/* AI Summary Dialog (from three-dot menu) */}
      {aiSummaryNote && (
        <NoteAISummaryDialog
          sessionId={sessionId}
          note={aiSummaryNote}
          open={!!aiSummaryNote}
          onOpenChange={(open) => !open && setAiSummaryNote(null)}
          onNoteUpdated={(updatedNote) => {
            onNoteUpdated(updatedNote);
            setAiSummaryNote(updatedNote);
          }}
        />
      )}

      {/* AI Summary View Dialog (from badge click - read only) */}
      {viewSummaryNote && (
        <AISummaryViewDialog
          note={viewSummaryNote}
          open={!!viewSummaryNote}
          onOpenChange={(open) => !open && setViewSummaryNote(null)}
        />
      )}

      {/* Delete Note Confirmation Dialog */}
      <Dialog open={deleteNoteDialog} onOpenChange={setDeleteNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note?</DialogTitle>
            <DialogDescription className="space-y-1">
              <span className="block">
                Are you sure you want to delete this note?
              </span>
              <span className="block">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          {noteToDelete &&
            (noteToDelete.edited_transcript || noteToDelete.raw_transcript) && (
              <div className="py-2">
                <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                  <p className="text-muted-foreground line-clamp-3">
                    {noteToDelete.edited_transcript ||
                      noteToDelete.raw_transcript}
                  </p>
                </div>
              </div>
            )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteNoteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteNote}
              disabled={deletingId === noteToDelete?.id}
            >
              {deletingId === noteToDelete?.id && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Delete Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
