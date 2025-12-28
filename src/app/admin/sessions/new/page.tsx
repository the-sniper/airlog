"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SceneInput {
  name: string;
  description: string | null;
}

function renderTextWithLinks(text: string) {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s]+/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let linkIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const href = match[2] || match[0];
    const label = match[1] || match[0];
    nodes.push(
      <a
        key={`link-${linkIndex++}-${match.index}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-primary hover:underline break-words"
      >
        {label}
      </a>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function FormattedDescription({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-0.5 ml-1 pl-3">
          {currentList.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{renderTextWithLinks(item)}</span>
            </li>
          ))}
        </ul>,
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^(?:[•\-\*\>]|\d+[\.\)])\s*(.*)$/);

    if (bulletMatch) {
      currentList.push(bulletMatch[1] || trimmed.slice(1).trim());
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={`text-${index}`} className="text-xs">
          {renderTextWithLinks(trimmed)}
        </p>,
      );
    }
  });

  flushList();

  return (
    <div className="text-xs text-muted-foreground space-y-1">{elements}</div>
  );
}

function SortableSceneItem({
  scene,
  index,
  onRemove,
}: {
  scene: SceneInput;
  index: number;
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `scene-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start items-center gap-2 p-3 rounded-lg bg-secondary/50 group w-full"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors pt-0.5 shrink-0 w-4 h-4 flex items-center justify-center"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{scene.name}</span>
        {scene.description && (
          <div className="mt-1">
            <FormattedDescription text={scene.description} />
          </div>
        )}
      </div>
      <div className="h-8 w-8 shrink-0 flex-shrink-0 flex items-center justify-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100"
          onClick={() => onRemove(index)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function NewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionHistory, setDescriptionHistory] = useState<string[]>([""]);
  const [descriptionHistoryIndex, setDescriptionHistoryIndex] = useState(0);
  const descriptionHistoryIndexRef = useRef(0);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const [buildVersion, setBuildVersion] = useState("");
  const [scenes, setScenes] = useState<SceneInput[]>([]);
  const [addSceneDialog, setAddSceneDialog] = useState(false);
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneDescription, setNewSceneDescription] = useState("");
  const newSceneDescriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const [issueOptions, setIssueOptions] = useState<string[]>([]);
  const [newIssueOption, setNewIssueOption] = useState("");

  const defaultIssueOptions = [
    "Performance lag",
    "Spatialization issues",
    "Network lag",
    "Audio issues",
    "Visual glitches",
    "Input/Controls issues",
  ];

  function openAddSceneDialog() {
    setNewSceneName("");
    setNewSceneDescription("");
    setAddSceneDialog(true);
  }

  function insertIntoNewSceneDescription(
    snippet: string,
    startOnNewLine = false,
  ) {
    const textarea = newSceneDescriptionRef.current;
    if (textarea) {
      const { selectionStart, selectionEnd } = textarea;
      const needsNewLine =
        startOnNewLine &&
        selectionStart > 0 &&
        newSceneDescription[selectionStart - 1] !== "\n";
      const insertion = needsNewLine ? `\n${snippet}` : snippet;
      const nextValue =
        newSceneDescription.slice(0, selectionStart) +
        insertion +
        newSceneDescription.slice(selectionEnd);
      setNewSceneDescription(nextValue);
      requestAnimationFrame(() => {
        const caret = selectionStart + insertion.length;
        textarea.focus();
        textarea.setSelectionRange(caret, caret);
      });
    } else {
      setNewSceneDescription((prev) => `${prev}${prev ? "\n" : ""}${snippet}`);
    }
  }

  function handleAddScene() {
    if (newSceneName.trim()) {
      setScenes([
        ...scenes,
        {
          name: newSceneName.trim(),
          description: newSceneDescription.trim() || null,
        },
      ]);
      setNewSceneName("");
      setNewSceneDescription("");
      setAddSceneDialog(false);
    }
  }

  function removeScene(i: number) {
    setScenes(scenes.filter((_, idx) => idx !== i));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = scenes.findIndex((_, i) => `scene-${i}` === active.id);
      const newIndex = scenes.findIndex((_, i) => `scene-${i}` === over.id);
      setScenes(arrayMove(scenes, oldIndex, newIndex));
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function addIssueOption(option: string) {
    const trimmed = option.trim();
    if (trimmed && !issueOptions.includes(trimmed)) {
      setIssueOptions([...issueOptions, trimmed]);
    }
    setNewIssueOption("");
  }

  useEffect(() => {
    descriptionHistoryIndexRef.current = descriptionHistoryIndex;
  }, [descriptionHistoryIndex]);

  function recordDescription(nextValue: string) {
    setDescription(nextValue);
    setDescriptionHistory((prev) => {
      const trimmed = prev.slice(0, descriptionHistoryIndexRef.current + 1);
      if (trimmed[trimmed.length - 1] === nextValue) return prev;
      const nextHistory = [...trimmed, nextValue];
      setDescriptionHistoryIndex(nextHistory.length - 1);
      return nextHistory;
    });
  }

  function handleDescriptionKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    const isUndo =
      (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey;
    if (isUndo && descriptionHistoryIndex > 0) {
      e.preventDefault();
      const prevIndex = descriptionHistoryIndex - 1;
      setDescription(descriptionHistory[prevIndex]);
      setDescriptionHistoryIndex(prevIndex);
    }
  }

  function insertIntoDescription(snippet: string, startOnNewLine = false) {
    const textarea = descriptionRef.current;
    if (textarea) {
      const { selectionStart, selectionEnd } = textarea;
      const needsNewLine =
        startOnNewLine &&
        selectionStart > 0 &&
        description[selectionStart - 1] !== "\n";
      const insertion = needsNewLine ? `\n${snippet}` : snippet;
      const nextValue =
        description.slice(0, selectionStart) +
        insertion +
        description.slice(selectionEnd);
      recordDescription(nextValue);
      requestAnimationFrame(() => {
        const caret = selectionStart + insertion.length;
        textarea.focus();
        textarea.setSelectionRange(caret, caret);
      });
    } else {
      recordDescription(`${description}${description ? "\n" : ""}${snippet}`);
    }
  }

  function removeIssueOption(option: string) {
    setIssueOptions(issueOptions.filter((o) => o !== option));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || scenes.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          build_version: buildVersion.trim() || null,
          scenes,
          issue_options: issueOptions,
        }),
      });
      if (res.ok) {
        const session = await res.json();
        router.push(`/admin/sessions/${session.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Session</h1>
          <p className="text-muted-foreground">Set up a new test session</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Session Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sprint 24"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="description">Description</Label>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Quick format</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => insertIntoDescription("• ", true)}
                  >
                    Bullet
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() =>
                      insertIntoDescription("[Link text](https://)", false)
                    }
                  >
                    Add link
                  </Button>
                </div>
              </div>
              <Textarea
                id="description"
                ref={descriptionRef}
                value={description}
                onChange={(e) => recordDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyDown}
                placeholder={
                  "Add context, links, and bullets:\n• Goals for this session\n• Known issues or areas to avoid\n• Useful links: https://example.com/docs"
                }
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Use bullet points for clarity and add reference links with the
                toolbar.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildVersion">Build / Version</Label>
              <Input
                id="buildVersion"
                value={buildVersion}
                onChange={(e) => setBuildVersion(e.target.value)}
                placeholder="e.g., v2.1.0"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scenes</CardTitle>
            <CardDescription>Areas being tested</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scenes.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={scenes.map((_, i) => `scene-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 w-full">
                    {scenes.map((s, i) => (
                      <SortableSceneItem
                        key={i}
                        scene={s}
                        index={i}
                        onRemove={removeScene}
                      />
                    ))}
                  </div>
                </SortableContext>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed mt-2"
                  onClick={openAddSceneDialog}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Scene
                </Button>
              </DndContext>
            ) : (
              <button
                type="button"
                onClick={openAddSceneDialog}
                className="w-full py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">
                  Add your first scene
                </span>
                <span className="text-xs">
                  Define areas or features to test
                </span>
              </button>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Issue Checkboxes
            </CardTitle>
            <CardDescription>
              Quick checkboxes for common issues testers can report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {issueOptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {issueOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm"
                  >
                    <span>{option}</span>
                    <button
                      type="button"
                      onClick={() => removeIssueOption(option)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newIssueOption}
                onChange={(e) => setNewIssueOption(e.target.value)}
                placeholder="Add custom issue option..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIssueOption(newIssueOption);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addIssueOption(newIssueOption)}
                disabled={!newIssueOption.trim()}
              >
                Add
              </Button>
            </div>
            {issueOptions.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Quick add common issues:
                </p>
                <div className="flex flex-wrap gap-2">
                  {defaultIssueOptions.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addIssueOption(option)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {issueOptions.length > 0 &&
              defaultIssueOptions.some(
                (option) => !issueOptions.includes(option),
              ) && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Add more:</p>
                  <div className="flex flex-wrap gap-2">
                    {defaultIssueOptions
                      .filter((option) => !issueOptions.includes(option))
                      .map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addIssueOption(option)}
                          className="text-xs h-7"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {option}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-4">
          <Link href="/admin">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || !name.trim() || scenes.length === 0}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}Create
            Session
          </Button>
        </div>
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
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sceneDescription">
                  What to Test{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Quick format</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => insertIntoNewSceneDescription("• ", true)}
                  >
                    Bullet
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() =>
                      insertIntoNewSceneDescription(
                        "[Link text](https://)",
                        false,
                      )
                    }
                  >
                    Add link
                  </Button>
                </div>
              </div>
              <Textarea
                id="sceneDescription"
                ref={newSceneDescriptionRef}
                value={newSceneDescription}
                onChange={(e) => setNewSceneDescription(e.target.value)}
                placeholder={
                  "Use bullet points for clarity:\n• Test player movement and controls\n• Check collision detection\n• Verify UI interactions work correctly"
                }
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Use • or - for bullet points
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAddSceneDialog(false)}
            >
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
