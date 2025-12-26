"use client";

import { useState } from "react";
import { Sparkles, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getCategoryLabel } from "@/lib/utils";
import type { Note, NoteWithDetails } from "@/types";

interface AISummaryViewDialogProps {
  note: Note | NoteWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Parse and render the AI summary with proper formatting
function FormattedSummary({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Warning header like **⚠️ Transcription Quality Issue**
    if (trimmed.startsWith("**⚠️") || (trimmed.startsWith("**") && trimmed.toLowerCase().includes("quality issue"))) {
      const headerText = trimmed.replace(/^\*\*/, "").replace(/\*\*$/, "").replace(/:$/, "");
      elements.push(
        <div key={index} className="mt-3 first:mt-0 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <h4 className="font-semibold text-yellow-600 dark:text-yellow-400">{headerText}</h4>
        </div>
      );
      return;
    }
    
    // Bold headers like **Summary:** or **Actionable Items:**
    if (trimmed.startsWith("**") && trimmed.includes(":**")) {
      const headerMatch = trimmed.match(/^\*\*(.+?):\*\*\s*(.*)?$/);
      if (headerMatch) {
        const headerText = headerMatch[1];
        const isWarning = headerText.includes("⚠️") || headerText.toLowerCase().includes("suggestion");
        elements.push(
          <div key={index} className={`mt-3 first:mt-0 ${isWarning ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
            <h4 className={`font-semibold ${isWarning ? "" : "text-foreground"}`}>{headerText}:</h4>
            {headerMatch[2] && (
              <p className="text-sm text-muted-foreground mt-1">{headerMatch[2]}</p>
            )}
          </div>
        );
        return;
      }
    }
    
    // Bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const bulletContent = trimmed.slice(2);
      // Check for bold text within bullet
      const formattedContent = bulletContent.replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="font-semibold text-foreground">$1</strong>'
      );
      elements.push(
        <div key={index} className="flex gap-2 ml-2 mt-1.5">
          <span className="text-primary shrink-0">•</span>
          <span 
            className="text-sm text-muted-foreground flex-1"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        </div>
      );
      return;
    }
    
    // Empty lines
    if (trimmed === "") {
      if (elements.length > 0) {
        elements.push(<div key={index} className="h-1" />);
      }
      return;
    }
    
    // Regular text - check for bold
    const formattedText = trimmed.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-foreground">$1</strong>'
    );
    elements.push(
      <p 
        key={index} 
        className="text-sm text-muted-foreground mt-1"
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  });

  return <div className="space-y-1">{elements}</div>;
}

export function AISummaryViewDialog({
  note,
  open,
  onOpenChange,
}: AISummaryViewDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!note.ai_summary) return;
    await navigator.clipboard.writeText(note.ai_summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard.",
    });
  }

  if (!note.ai_summary) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Summary
          </DialogTitle>
        </DialogHeader>

        {/* Category badge */}
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
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <Check className="w-3.5 h-3.5" />
            <span>Approved</span>
          </div>
        </div>

        {/* Summary content with formatting */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border bg-secondary/20 p-4">
          <FormattedSummary text={note.ai_summary} />
        </div>

        {/* Footer with copy button */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
