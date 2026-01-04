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
  Trash2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PollQuestionType } from "@/types";
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
  poll_questions?: PollQuestionInput[];
}

interface PollQuestionInput {
  id: string;
  question: string;
  question_type: PollQuestionType;
  options: string[];
  required: boolean;
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
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {scene.description}
          </p>
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

export default function CompanyNewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const [buildVersion, setBuildVersion] = useState("");
  const [scenes, setScenes] = useState<SceneInput[]>([]);
  const [addSceneDialog, setAddSceneDialog] = useState(false);
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneDescription, setNewSceneDescription] = useState("");
  const [issueOptions, setIssueOptions] = useState<string[]>([]);
  const [newIssueOption, setNewIssueOption] = useState("");
  const [newScenePollQuestions, setNewScenePollQuestions] = useState<
    PollQuestionInput[]
  >([]);

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
    setNewScenePollQuestions([]);
    setAddSceneDialog(true);
  }

  function handleAddScene() {
    if (newSceneName.trim()) {
      // Filter out empty poll questions
      const validPollQuestions = newScenePollQuestions
        .filter((q) => q.question.trim())
        .map((q) => ({
          ...q,
          options: q.options.filter((opt) => opt.trim()),
        }))
        .filter((q) => q.options.length >= 2);

      setScenes([
        ...scenes,
        {
          name: newSceneName.trim(),
          description: newSceneDescription.trim() || null,
          poll_questions:
            validPollQuestions.length > 0 ? validPollQuestions : undefined,
        },
      ]);
      setNewSceneName("");
      setNewSceneDescription("");
      setNewScenePollQuestions([]);
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
    })
  );

  function addIssueOption(option: string) {
    const trimmed = option.trim();
    if (trimmed && !issueOptions.includes(trimmed)) {
      setIssueOptions([...issueOptions, trimmed]);
    }
    setNewIssueOption("");
  }

  function removeIssueOption(option: string) {
    setIssueOptions(issueOptions.filter((o) => o !== option));
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
      setDescription(nextValue);
      requestAnimationFrame(() => {
        const caret = selectionStart + insertion.length;
        textarea.focus();
        textarea.setSelectionRange(caret, caret);
      });
    } else {
      setDescription(`${description}${description ? "\n" : ""}${snippet}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || scenes.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/company/sessions", {
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
        router.push(`/company/sessions/${session.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/company/sessions">
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context, links, and bullets..."
                className="min-h-[100px] resize-none"
              />
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
            {defaultIssueOptions.filter((opt) => !issueOptions.includes(opt))
              .length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Quick add common issues:
                </p>
                <div className="flex flex-wrap gap-2">
                  {defaultIssueOptions
                    .filter((opt) => !issueOptions.includes(opt))
                    .map((option) => (
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/company/sessions">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || !name.trim() || scenes.length === 0}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Session
          </Button>
        </div>
      </form>

      <Dialog open={addSceneDialog} onOpenChange={setAddSceneDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
              <Label htmlFor="sceneDescription">
                What to Test{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="sceneDescription"
                value={newSceneDescription}
                onChange={(e) => setNewSceneDescription(e.target.value)}
                placeholder="Describe what testers should focus on..."
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Poll Questions Section */}
            <div className="space-y-3 py-4 border-t border-border/40">
              <div className="flex items-center justify-between">
                <Label>
                  Poll Questions{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                {newScenePollQuestions.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNewScenePollQuestions([
                        ...newScenePollQuestions,
                        {
                          id: crypto.randomUUID(),
                          question: "",
                          question_type: "radio",
                          options: ["", ""],
                          required: false,
                        },
                      ])
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Question
                  </Button>
                )}
              </div>

              {newScenePollQuestions.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No poll questions added. Click &quot;Add Question&quot; to
                  create a poll for testers.
                </p>
              )}

              {newScenePollQuestions.map((q, qIndex) => (
                <div
                  key={q.id}
                  className="p-4 rounded-lg border border-border/40 bg-secondary/30 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Enter your question..."
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...newScenePollQuestions];
                          updated[qIndex].question = e.target.value;
                          setNewScenePollQuestions(updated);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setNewScenePollQuestions(
                          newScenePollQuestions.filter((_, i) => i !== qIndex)
                        )
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <Select
                      value={q.question_type}
                      onValueChange={(value: PollQuestionType) => {
                        const updated = [...newScenePollQuestions];
                        updated[qIndex].question_type = value;
                        setNewScenePollQuestions(updated);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="radio">Single Choice</SelectItem>
                        <SelectItem value="checkbox">
                          Multiple Choice
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => {
                          const updated = [...newScenePollQuestions];
                          updated[qIndex].required = e.target.checked;
                          setNewScenePollQuestions(updated);
                        }}
                        className="rounded"
                      />
                      Required
                    </label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Options
                    </Label>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">
                          {q.question_type === "radio" ? (
                            <div className="w-3 h-3 rounded-full border-2 border-current" />
                          ) : (
                            <div className="w-3 h-3 rounded border-2 border-current" />
                          )}
                        </div>
                        <Input
                          className="flex-1"
                          placeholder={`Option ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newScenePollQuestions];
                            updated[qIndex].options[optIndex] = e.target.value;
                            setNewScenePollQuestions(updated);
                          }}
                        />
                        {q.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              const updated = [...newScenePollQuestions];
                              updated[qIndex].options = updated[
                                qIndex
                              ].options.filter((_, i) => i !== optIndex);
                              setNewScenePollQuestions(updated);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const updated = [...newScenePollQuestions];
                        updated[qIndex].options.push("");
                        setNewScenePollQuestions(updated);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Option
                    </Button>
                  </div>
                </div>
              ))}

              {newScenePollQuestions.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    setNewScenePollQuestions([
                      ...newScenePollQuestions,
                      {
                        id: crypto.randomUUID(),
                        question: "",
                        question_type: "radio",
                        options: ["", ""],
                        required: false,
                      },
                    ])
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Question
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setAddSceneDialog(false);
                setNewScenePollQuestions([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddScene} disabled={!newSceneName.trim()}>
              Add Scene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
