"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Check,
  Edit2,
  Copy,
  X,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getCategoryLabel } from "@/lib/utils";
import type { Note, NoteWithDetails } from "@/types";

interface NoteAISummaryDialogProps {
  sessionId: string;
  note: Note | NoteWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteUpdated?: (note: NoteWithDetails) => void;
}

export function NoteAISummaryDialog({
  sessionId,
  note,
  open,
  onOpenChange,
  onNoteUpdated,
}: NoteAISummaryDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<string | null>(
    note.ai_summary || null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(note.ai_summary || "");
  const [approved, setApproved] = useState(!!note.ai_summary);
  const [copied, setCopied] = useState(false);

  const transcript = note.edited_transcript || note.raw_transcript || "";

  // Reset state when note changes or dialog opens
  useEffect(() => {
    if (open) {
      setSummary(note.ai_summary || null);
      setEditedSummary(note.ai_summary || "");
      setApproved(!!note.ai_summary);
      setIsEditing(false);
      setLoading(false);
    }
  }, [open, note.id, note.ai_summary]);

  async function generateSummary() {
    setLoading(true);
    setSummary(null);
    setApproved(false);
    setIsEditing(false);

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/notes/${note.id}/summarize`,
        { method: "POST" },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
      setEditedSummary(data.summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleEdit() {
    setIsEditing(true);
    setEditedSummary(summary || "");
  }

  function handleSaveEdit() {
    setSummary(editedSummary);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setEditedSummary(summary || "");
    setIsEditing(false);
  }

  async function handleApprove() {
    const summaryToSave = summary || "";
    setSaving(true);

    try {
      // Save to database
      const response = await fetch(
        `/api/sessions/${sessionId}/notes/${note.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ai_summary: summaryToSave }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save summary");
      }

      const updatedNote = await response.json();
      setApproved(true);

      // Notify parent component
      if (onNoteUpdated) {
        onNoteUpdated(updatedNote);
      }

      toast({
        title: "Summary Approved",
        description: "The actionable items have been saved.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving summary:", error);
      toast({
        title: "Error",
        description: "Failed to save summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    const textToCopy = isEditing ? editedSummary : summary || "";
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard.",
    });
  }

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Summary
          </DialogTitle>
          <DialogDescription>
            {note.ai_summary
              ? "View or regenerate actionable items"
              : "Generate actionable items from this note"}
          </DialogDescription>
        </DialogHeader>

        {/* Original Note Preview */}
        <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                note.category as
                  | "bug"
                  | "feature"
                  | "ux"
                  | "performance"
                  | "secondary"
              }
            >
              {getCategoryLabel(note.category)}
            </Badge>
            <span className="text-xs text-muted-foreground">Original note</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {transcript || "No transcript available"}
          </p>
        </div>

        <div className="flex-1 min-h-0 py-2">
          {!summary && !loading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Generate Actionable Items</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                Our AI will analyze this feedback and create specific,
                actionable items.
              </p>
              <Button onClick={generateSummary} disabled={!transcript}>
                <Sparkles className="w-4 h-4" />
                Generate
              </Button>
              {!transcript && (
                <p className="text-xs text-destructive mt-2">
                  No transcript available for this note
                </p>
              )}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Analyzing feedback...
              </p>
            </div>
          )}

          {summary && !loading && (
            <div className="space-y-3">
              {approved && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Approved & Saved</span>
                </div>
              )}

              {isEditing ? (
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Edit the summary..."
                />
              ) : (
                <div className="rounded-lg border border-border bg-secondary/30 p-3 max-h-[250px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {summary}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {summary && !loading && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex flex-wrap gap-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={generateSummary}
                disabled={loading || saving}
              >
                <RefreshCw className="w-4 h-4" />
                Redo
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    disabled={saving}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  {!approved && (
                    <Button size="sm" onClick={handleApprove} disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogFooter>
        )}

        {!summary && !loading && (
          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
