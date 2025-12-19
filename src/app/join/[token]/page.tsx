"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mic,
  AlertCircle,
  Clock,
  CheckCircle,
  Keyboard,
  Info,
  ChevronDown,
  ChevronRight,
  LogOut,
  AlertTriangle,
  Check,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceRecorder } from "@/components/voice-recorder";
import { TextNoteInput } from "@/components/text-note-input";
import { NotesList } from "@/components/notes-list";
import { AdminMobileHeader } from "@/components/admin-sidebar";
import type { SessionWithScenes, Tester, Scene, Note, PollQuestion, PollResponse } from "@/types";

interface JoinData {
  tester: Tester;
  session: SessionWithScenes;
  pollResponses: PollResponse[];
}

function FormattedDescription({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1.5 ml-1">
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
    // Match bullet points: •, -, *, >, or numbered lists like "1." "2)"
    const bulletMatch = trimmed.match(/^(?:[•\-\*\>]|\d+[\.\)])\s*(.*)$/);

    if (bulletMatch) {
      currentList.push(bulletMatch[1] || trimmed.slice(1).trim());
    } else if (trimmed === "") {
      flushList();
      // Add spacing for empty lines between sections
      if (elements.length > 0 && index < lines.length - 1) {
        elements.push(<div key={`space-${index}`} className="h-2" />);
      }
    } else {
      flushList();
      elements.push(
        <p key={`text-${index}`} className="text-sm">
          {trimmed}
        </p>
      );
    }
  });

  flushList();

  return (
    <div className="text-sm text-muted-foreground space-y-2">{elements}</div>
  );
}

export default function TesterSessionPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const [data, setData] = useState<JoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; type: string } | null>(
    null
  );
  const [selectedScene, setSelectedScene] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [hasLeft, setHasLeft] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reportedIssues, setReportedIssues] = useState<string[]>([]);
  const [issuesExpanded, setIssuesExpanded] = useState(false);
  const [pollExpanded, setPollExpanded] = useState(false);
  const [pollResponses, setPollResponses] = useState<Record<string, string[]>>({});
  const [savingPollResponse, setSavingPollResponse] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sceneInitializedRef = useRef(false);
  const issuesInitializedRef = useRef(false);
  const pollInitializedRef = useRef(false);

  useEffect(() => {
    // Check if user is admin
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          setIsAdmin(true);
        }
      } catch {
        // Not logged in as admin
      }
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    fetchSession();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }; /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [token]);

  async function fetchSession() {
    try {
      // Add cache-busting to prevent browser caching
      const res = await fetch(`/api/join/${token}?t=${Date.now()}`, {
        cache: "no-store",
      });
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
      // Only set default scene on first load, not on subsequent polls
      if (result.session.scenes?.length > 0 && !sceneInitializedRef.current) {
        setSelectedScene(result.session.scenes[0].id);
        sceneInitializedRef.current = true;
      }
      // Initialize reported issues from tester data
      if (!issuesInitializedRef.current && result.tester.reported_issues) {
        setReportedIssues(result.tester.reported_issues);
        issuesInitializedRef.current = true;
      }
      // Initialize poll responses
      if (!pollInitializedRef.current && result.pollResponses) {
        const responsesMap: Record<string, string[]> = {};
        result.pollResponses.forEach((r: PollResponse) => {
          responsesMap[r.poll_question_id] = r.selected_options;
        });
        setPollResponses(responsesMap);
        pollInitializedRef.current = true;
      }
      fetchNotes(result.session.id, result.tester.id);
    } catch {
      setError({ message: "Failed to load session", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotes(sessionId: string, testerId: string) {
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/notes?testerId=${testerId}`
      );
      if (res.ok) setNotes(await res.json());
    } catch {}
  }
  function handleNoteCreated(note: Note) {
    setNotes((prev) => [...prev, note]);
  }
  function handleNoteUpdated(updatedNote: Note) {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
  }
  function handleNoteDeleted(noteId: string) {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function toggleIssue(issue: string) {
    if (!data) return;
    const newIssues = reportedIssues.includes(issue)
      ? reportedIssues.filter((i) => i !== issue)
      : [...reportedIssues, issue];
    setReportedIssues(newIssues);
    
    // Save to server
    try {
      await fetch(`/api/sessions/${data.session.id}/testers/${data.tester.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reported_issues: newIssues }),
      });
    } catch (error) {
      console.error("Failed to save reported issues:", error);
    }
  }

  async function handlePollResponse(questionId: string, questionType: string, option: string) {
    if (!data) return;
    
    let newSelected: string[];
    const currentSelected = pollResponses[questionId] || [];
    
    if (questionType === "radio") {
      // Radio: single selection
      newSelected = [option];
    } else {
      // Checkbox: toggle selection
      if (currentSelected.includes(option)) {
        newSelected = currentSelected.filter(o => o !== option);
      } else {
        newSelected = [...currentSelected, option];
      }
    }
    
    // Update local state immediately
    setPollResponses(prev => ({ ...prev, [questionId]: newSelected }));
    setSavingPollResponse(questionId);
    
    // Save to server
    try {
      await fetch(`/api/sessions/${data.session.id}/poll-responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poll_question_id: questionId,
          tester_id: data.tester.id,
          selected_options: newSelected,
        }),
      });
    } catch (error) {
      console.error("Failed to save poll response:", error);
    } finally {
      setSavingPollResponse(null);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            {error.type === "ended" ? (
              <>
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Session Completed
                </h2>
                <p className="text-muted-foreground mb-4">
                  Thank you for your feedback!
                </p>
              </>
            ) : error.type === "not_started" ? (
              <>
                <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Session Not Started
                </h2>
                <p className="text-muted-foreground mb-4">
                  Please wait for the admin to begin the session.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Unable to Join</h2>
                <p className="text-muted-foreground mb-4">{error.message}</p>
              </>
            )}
            <Link href="/join">
              <Button variant="outline">Try Another Code</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  if (!data) return null;

  if (hasLeft)
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Thanks for Your Feedback!
            </h2>
            <p className="text-muted-foreground mb-2">
              You&apos;ve submitted {notes.length} note
              {notes.length !== 1 ? "s" : ""} so far.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              The session is still active. You can rejoin anytime to add more
              feedback.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setHasLeft(false)}>
                Continue Testing
              </Button>
              <Link href="/join">
                <Button variant="ghost">Join Different Session</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  const { session, tester } = data;
  const currentScene = session.scenes?.find(
    (s: Scene) => s.id === selectedScene
  );

  return (
    <>
      {/* Show admin mobile navigation when logged in as admin */}
      {isAdmin && <AdminMobileHeader />}
      
      <div className={`min-h-screen gradient-mesh ${isAdmin ? "pt-16 pb-24 md:pt-0 md:pb-0" : ""}`}>
        <header className="border-b border-border bg-card/80 glass sticky top-0 z-40">
          <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
            {/* Left: Session info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold truncate text-sm sm:text-base">{session.name}</h1>
                <p className="text-xs text-muted-foreground truncate">
                  Testing as {tester.first_name} {tester.last_name}
                </p>
              </div>
            </div>
            
            {/* Center: Logo (desktop only) */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
              <Link href="/">
                <Image src="/logo.svg" alt="AirLog" width={100} height={28} className="dark:hidden" />
                <Image src="/logo-dark.svg" alt="AirLog" width={100} height={28} className="hidden dark:block" />
              </Link>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5 mr-1 sm:mr-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs sm:text-sm text-muted-foreground">Live</span>
            </div>
            <ThemeToggle />
            {/* Mobile: Icon button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHasLeft(true)}
              className="sm:hidden text-destructive hover:text-destructive hover:bg-destructive/10"
              title="End Session"
            >
              <LogOut className="w-5 h-5" />
            </Button>
            {/* Desktop: Text button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHasLeft(true)}
              className="hidden sm:flex border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              End Session
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Current Scene</p>
            <Select value={selectedScene} onValueChange={setSelectedScene}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a scene" />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                {session.scenes?.map((s: Scene) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentScene && (
              <div className="mt-4 rounded-lg bg-primary/5 border border-primary/10 overflow-hidden">
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="w-full p-3 flex items-center gap-2 hover:bg-primary/10 transition-colors text-left"
                >
                  <Info className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-primary flex-1">
                    What to test
                  </span>
                  {descriptionExpanded ? (
                    <ChevronDown className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
                {descriptionExpanded && (
                  <div className="px-3 pb-3 pl-9">
                    {currentScene.description ? (
                      <FormattedDescription text={currentScene.description} />
                    ) : (
                      <p className="text-sm text-muted-foreground/60 italic">
                        No testing instructions added yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {session.issue_options && session.issue_options.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 overflow-hidden">
                <button
                  onClick={() => setIssuesExpanded(!issuesExpanded)}
                  className="w-full p-3 flex items-center gap-2 hover:bg-amber-500/10 transition-colors text-left"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400 flex-1">
                    Report General Issues
                    {reportedIssues.length > 0 && (
                      <span className="ml-2 text-xs text-amber-500/70">
                        ({reportedIssues.length} selected)
                      </span>
                    )}
                  </span>
                  {issuesExpanded ? (
                    <ChevronDown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                </button>
                {issuesExpanded && (
                  <div className="px-3 pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      {session.issue_options.map((issue: string) => {
                        const isChecked = reportedIssues.includes(issue);
                        return (
                          <button
                            key={issue}
                            type="button"
                            onClick={() => toggleIssue(issue)}
                            className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${
                              isChecked
                                ? "bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400"
                                : "bg-secondary/30 border-border hover:bg-secondary/50"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isChecked
                                  ? "bg-amber-500 border-amber-500"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="truncate">{issue}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {currentScene && currentScene.poll_questions && currentScene.poll_questions.length > 0 && (() => {
          const requiredQuestions = currentScene.poll_questions?.filter((q: PollQuestion) => q.required) || [];
          const unansweredRequired = requiredQuestions.filter((q: PollQuestion) => !pollResponses[q.id]?.length);
          const hasUnansweredRequired = unansweredRequired.length > 0;
          const allQuestions = currentScene.poll_questions || [];
          const answeredCount = allQuestions.filter((q: PollQuestion) => pollResponses[q.id]?.length > 0).length;
          
          return (
            <Card>
              <CardContent className="pt-6">
                <div className={`rounded-lg overflow-hidden ${
                  hasUnansweredRequired 
                    ? "bg-amber-500/5 border border-amber-500/20" 
                    : "bg-blue-500/5 border border-blue-500/10"
                }`}>
                  <button
                    onClick={() => setPollExpanded(!pollExpanded)}
                    className={`w-full p-3 flex items-center gap-2 transition-colors text-left ${
                      hasUnansweredRequired 
                        ? "hover:bg-amber-500/10" 
                        : "hover:bg-blue-500/10"
                    }`}
                  >
                    <ClipboardList className={`w-4 h-4 flex-shrink-0 ${
                      hasUnansweredRequired ? "text-amber-500" : "text-blue-500"
                    }`} />
                    <span className={`text-sm font-medium flex-1 ${
                      hasUnansweredRequired 
                        ? "text-amber-600 dark:text-amber-400" 
                        : "text-blue-600 dark:text-blue-400"
                    }`}>
                      Scene Poll
                      {hasUnansweredRequired ? (
                        <span className="ml-2 text-xs text-amber-500">
                          ({unansweredRequired.length} required unanswered)
                        </span>
                      ) : answeredCount > 0 ? (
                        <span className="ml-2 text-xs text-blue-500/70">
                          ({answeredCount}/{allQuestions.length} answered)
                        </span>
                      ) : null}
                    </span>
                    {pollExpanded ? (
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 ${
                        hasUnansweredRequired ? "text-amber-500" : "text-blue-500"
                      }`} />
                    ) : (
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                        hasUnansweredRequired ? "text-amber-500" : "text-blue-500"
                      }`} />
                    )}
                  </button>
                  {pollExpanded && (
                    <div className="px-3 pb-3 space-y-4">
                      {currentScene.poll_questions?.map((q: PollQuestion) => {
                        const isAnswered = (pollResponses[q.id] || []).length > 0;
                        const isRequiredUnanswered = q.required && !isAnswered;
                        
                        return (
                          <div 
                            key={q.id} 
                            className={`space-y-2 ${
                              isRequiredUnanswered 
                                ? "p-3 -mx-3 rounded-lg bg-amber-500/5 border border-amber-500/20" 
                                : ""
                            }`}
                          >
                            <p className="text-sm font-medium flex items-center gap-1">
                              {q.question}
                              {q.required && (
                                <span className={isRequiredUnanswered ? "text-amber-500" : "text-red-500"}>*</span>
                              )}
                              {isRequiredUnanswered && (
                                <span className="text-xs text-amber-500 ml-1">(required)</span>
                              )}
                            </p>
                            <div className="space-y-1.5">
                              {q.options.map((option, optIndex) => {
                                const isSelected = (pollResponses[q.id] || []).includes(option);
                                const isSaving = savingPollResponse === q.id;
                                return (
                                  <button
                                    key={optIndex}
                                    type="button"
                                    onClick={() => handlePollResponse(q.id, q.question_type, option)}
                                    disabled={isSaving}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-colors ${
                                      isSelected
                                        ? "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400"
                                        : "bg-secondary/30 border-border hover:bg-secondary/50"
                                    } ${isSaving ? "opacity-50" : ""}`}
                                  >
                                    <div
                                      className={`w-5 h-5 flex items-center justify-center shrink-0 transition-colors ${
                                        q.question_type === "radio"
                                          ? `rounded-full border-2 ${
                                              isSelected
                                                ? "border-blue-500 bg-blue-500"
                                                : "border-muted-foreground/30"
                                            }`
                                          : `rounded border-2 ${
                                              isSelected
                                                ? "border-blue-500 bg-blue-500"
                                                : "border-muted-foreground/30"
                                            }`
                                      }`}
                                    >
                                      {isSelected && (
                                        q.question_type === "radio" ? (
                                          <div className="w-2 h-2 rounded-full bg-white" />
                                        ) : (
                                          <Check className="w-3 h-3 text-white" />
                                        )
                                      )}
                                    </div>
                                    <span className="flex-1">{option}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}
        {currentScene && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add Note</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="voice" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger
                    value="voice"
                    className="flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    Voice
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4" />
                    Text
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="voice" className="mt-0">
                  <VoiceRecorder
                    sessionId={session.id}
                    sceneId={selectedScene}
                    testerId={tester.id}
                    sceneName={currentScene.name}
                    onNoteCreated={handleNoteCreated}
                  />
                </TabsContent>
                <TabsContent value="text" className="mt-0">
                  <TextNoteInput
                    sessionId={session.id}
                    sceneId={selectedScene}
                    testerId={tester.id}
                    sceneName={currentScene.name}
                    onNoteCreated={handleNoteCreated}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        <NotesList
          notes={notes}
          sessionId={session.id}
          scenes={session.scenes}
          onNoteUpdated={handleNoteUpdated}
          onNoteDeleted={handleNoteDeleted}
        />
      </main>
      </div>
    </>
  );
}
