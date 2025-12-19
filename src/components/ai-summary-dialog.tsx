"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, RefreshCw, Check, Edit2, Copy, X, Filter } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";

export interface SummaryFilters {
  category?: string;
  sceneId?: string;
  testerId?: string;
}

export interface FilterLabels {
  category?: string;
  scene?: string;
  tester?: string;
}


interface AISummaryDialogProps {
  sessionId: string;
  sessionName: string;
  notesCount: number;
  filteredNotesCount?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSummaryApproved?: (summary: string) => void;
  existingSummary?: string | null;
  filters?: SummaryFilters;
  filterLabels?: FilterLabels;
}

export function AISummaryDialog({
  sessionId,
  sessionName,
  notesCount,
  filteredNotesCount,
  open,
  onOpenChange,
  onSummaryApproved,
  existingSummary,
  filters,
  filterLabels,
}: AISummaryDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<string | null>(existingSummary || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(existingSummary || "");
  const [approved, setApproved] = useState(!!existingSummary);
  const [copied, setCopied] = useState(false);
  const [summarizeFiltered, setSummarizeFiltered] = useState(false);

  // Check if filters are active
  const hasActiveFilters = filters && (filters.category || filters.sceneId || filters.testerId);
  const actualFilteredCount = filteredNotesCount ?? notesCount;

  // Initialize state when dialog opens or existingSummary changes
  useEffect(() => {
    if (open) {
      setSummary(existingSummary || null);
      setEditedSummary(existingSummary || "");
      setApproved(!!existingSummary);
      setIsEditing(false);
      setLoading(false);
      // Default to filtered if filters are active
      setSummarizeFiltered(!!hasActiveFilters);
    }
  }, [open, existingSummary, hasActiveFilters]);

  async function generateSummary() {
    setLoading(true);
    setSummary(null);
    setApproved(false);
    setIsEditing(false);
    
    try {
      // Only pass filters if user chose to summarize filtered notes
      const body = summarizeFiltered && hasActiveFilters ? filters : {};
      
      const response = await fetch(`/api/sessions/${sessionId}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

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
        description: error instanceof Error ? error.message : "Failed to generate summary",
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
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_summary: summaryToSave }),
      });

      if (!response.ok) {
        throw new Error("Failed to save summary");
      }

      setApproved(true);
      
      // Notify parent component
      if (onSummaryApproved) {
        onSummaryApproved(summaryToSave);
      }
      
      toast({
        title: "Summary Approved",
        description: "The session summary has been saved.",
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
    const textToCopy = isEditing ? editedSummary : (summary || "");
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
    // Reset state when closing
    setTimeout(() => {
      setSummary(null);
      setIsEditing(false);
      setEditedSummary("");
      setApproved(false);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Session Summary
          </DialogTitle>
          <DialogDescription>
            Generate actionable items from all {notesCount} notes in &quot;{sessionName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 py-4">
          {!summary && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">
                {hasActiveFilters ? "Summarize Session" : "Summarize Entire Session"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Our AI will analyze notes from this session and create
                a comprehensive list of actionable items for your team.
              </p>
              
              {/* Filter selection when filters are active */}
              {hasActiveFilters && (
                <div className="w-full max-w-sm mb-6 space-y-3">
                  <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    <span>Active filters:</span>
                    <span className="text-foreground font-medium">
                      {[filterLabels?.category, filterLabels?.scene, filterLabels?.tester]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSummarizeFiltered(true)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        summarizeFiltered
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="font-medium text-sm">Filtered Notes</p>
                      <p className="text-xs text-muted-foreground">
                        {actualFilteredCount} note{actualFilteredCount !== 1 ? "s" : ""}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummarizeFiltered(false)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        !summarizeFiltered
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="font-medium text-sm">Entire Session</p>
                      <p className="text-xs text-muted-foreground">
                        {notesCount} note{notesCount !== 1 ? "s" : ""}
                      </p>
                    </button>
                  </div>
                </div>
              )}
              
              {!hasActiveFilters && (
                <p className="text-sm text-muted-foreground mb-2">
                  {notesCount} note{notesCount !== 1 ? "s" : ""} to analyze
                </p>
              )}
              
              <Button onClick={generateSummary}>
                <Sparkles className="w-4 h-4" />
                Generate Summary
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Analyzing {summarizeFiltered ? actualFilteredCount : notesCount} notes...
              </p>
              {hasActiveFilters && summarizeFiltered && (
                <p className="text-xs text-muted-foreground mt-1">
                  (filtered notes only)
                </p>
              )}
            </div>
          )}

          {summary && !loading && (
            <div className="space-y-4">
              {approved && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Summary Approved</span>
                </div>
              )}
              
              {isEditing ? (
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Edit the summary..."
                />
              ) : (
                <div className="rounded-lg border border-border bg-secondary/30 p-4 max-h-[400px] overflow-y-auto">
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
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
                  <Button variant="outline" size="sm" onClick={handleEdit} disabled={saving}>
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
