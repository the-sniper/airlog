"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
// ...existing code...
import { usePollRealtime } from "@/hooks/usePollRealtime";
import {
  Mic,
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  Keyboard,
  Info,
  ChevronDown,
  ChevronUp,
  LogOut,
  Check,
  X,
  ClipboardList,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VoiceRecorder } from "@/components/tester/voice-recorder";
import { TextNoteInput } from "@/components/tester/text-note-input";
import { NotesList } from "@/components/tester/notes-list";
import { AdminMobileHeader } from "@/components/admin/admin-sidebar";
import { TesterHeader } from "@/components/tester/tester-header";
import type {
  SessionWithScenes,
  Tester,
  Scene,
  Note,
  PollQuestion,
  PollResponse,
} from "@/types";

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
  params: { code: string };
}) {
  const { code } = params;
  const sessionCode = code.toUpperCase();
  const [data, setData] = useState<JoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; type: string } | null>(
    null
  );
  const [selectedScene, setSelectedScene] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [hasLeft, setHasLeft] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [issuesExpanded, setIssuesExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null>(null);
  const [reportedIssues, setReportedIssues] = useState<string[]>([]);
  const [pollResponses, setPollResponses] = useState<Record<string, string[]>>(
    {}
  );
  const [savingPollResponse, setSavingPollResponse] = useState<string | null>(
    null
  );
  const [recorderExpanded, setRecorderExpanded] = useState(false);
  const [pollPanelOpen, setPollPanelOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sceneInitializedRef = useRef(false);
  const issuesInitializedRef = useRef(false);
  const pollInitializedRef = useRef(false);
  const [showAuthLanding, setShowAuthLanding] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{
    sessionName: string;
    description: string | null;
  } | null>(null);
  const authCheckDoneRef = useRef(false);

  // Lock body scroll when recorder panel or poll panel is open - iOS compatible
  useEffect(() => {
    const isModalOpen = recorderExpanded || pollPanelOpen;
    if (isModalOpen) {
      const scrollY = window.scrollY;
      document.body.setAttribute("data-scroll-locked", "");
      document.body.style.top = `-${scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.removeAttribute("data-scroll-locked");
      document.body.style.top = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.removeAttribute("data-scroll-locked");
      document.body.style.top = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    };
  }, [recorderExpanded, pollPanelOpen]);

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

    // Check if user is logged in as a tester user
    async function checkLoggedInUser() {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // API returns { user: {...} }
          setLoggedInUser(data.user);
          authCheckDoneRef.current = true;
          return data.user;
        }
      } catch {
        // Not logged in
      }
      authCheckDoneRef.current = true;
      return null;
    }

    // Validate session code and check auth
    async function initializePage() {
      const loggedInUserData = await checkLoggedInUser();

      // First, validate the session code
      try {
        const res = await fetch(`/api/sessions/join/${sessionCode}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const info = await res.json();
          setSessionInfo({
            sessionName: info.sessionName,
            description: info.description,
          });
        } else {
          const result = await res.json();
          if (res.status === 410) {
            setError({
              message: result.error || "Session has ended",
              type: "ended",
            });
          } else {
            setError({
              message: result.error || "Invalid session code",
              type: "error",
            });
          }
          setLoading(false);
          return;
        }
      } catch {
        setError({ message: "Failed to validate session code", type: "error" });
        setLoading(false);
        return;
      }

      if (!loggedInUserData) {
        // Not logged in - show auth landing
        setShowAuthLanding(true);
        setLoading(false);
        return;
      }

      // User is logged in - proceed to join session
      // The fetchSession effect will handle loading the session
    }

    initializePage();
  }, [sessionCode]);

  const fetchSessionCallback = useCallback(fetchSession, [sessionCode]);

  useEffect(() => {
    // Only fetch session if user is logged in (auth check done and we have a user)
    if (!authCheckDoneRef.current || !loggedInUser) return;

    fetchSessionCallback();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchSessionCallback, loggedInUser]);

  // Subscribe to poll question changes (realtime)
  usePollRealtime({
    sessionId: data?.session?.id || "",
    onPollChange: fetchSessionCallback,
  });

  async function fetchSession(rejoin = false) {
    try {
      // Use POST to join session - this creates/finds tester and returns session data
      const url = `/api/sessions/join/${sessionCode}${
        rejoin ? "?rejoin=true" : ""
      }`;
      const res = await fetch(url, {
        method: "POST",
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
      // Session is active - start/continue polling to detect when it ends
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(() => fetchSession(false), 5000); // Poll every 5 seconds while active
      }

      setError(null);
      setData(result);

      // Check if user has left
      if (result.tester?.left_at) {
        setHasLeft(true);
      } else {
        setHasLeft(false);
      }

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
      await fetch(
        `/api/sessions/${data.session.id}/testers/${data.tester.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reported_issues: newIssues }),
        }
      );
    } catch (error) {
      console.error("Failed to save reported issues:", error);
    }
  }

  async function handlePollResponse(
    questionId: string,
    questionType: string,
    option: string
  ) {
    if (!data) return;

    let newSelected: string[];
    const currentSelected = pollResponses[questionId] || [];

    if (questionType === "radio") {
      // Radio: single selection
      newSelected = [option];
    } else {
      // Checkbox: toggle selection
      if (currentSelected.includes(option)) {
        newSelected = currentSelected.filter((o) => o !== option);
      } else {
        newSelected = [...currentSelected, option];
      }
    }

    // Update local state immediately
    setPollResponses((prev) => ({ ...prev, [questionId]: newSelected }));
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
      <div className="min-h-screen gradient-mesh flex flex-col">
        {/* Header skeleton */}
        <div className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm" />

        {/* Session info bar skeleton */}
        <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm animate-pulse" />

        {/* Main content skeleton */}
        <main className="flex-1 overflow-y-auto pb-36">
          <div className="container mx-auto px-4 py-6 max-w-xl space-y-6 animate-pulse">
            {/* Scene selector skeleton */}
            <div className="h-16 rounded-lg bg-muted/30" />

            {/* What to test card skeleton */}
            <div className="h-20 rounded-xl bg-muted/30" />

            {/* Notes section skeleton */}
            <div className="space-y-3">
              <div className="h-6 rounded bg-muted/30" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-secondary/30" />
              ))}
            </div>
          </div>
        </main>

        {/* FAB skeleton */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="container mx-auto px-4 max-w-xl">
            <div className="bg-card border border-border rounded-t-2xl shadow-2xl">
              <div className="p-5 flex items-center justify-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted/40" />
                <div className="w-16 h-16 rounded-full bg-muted/40" />
                <div className="w-12 h-12 rounded-full bg-muted/40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  // Auth Landing Screen - shown when user is not logged in but session is valid
  if (showAuthLanding && sessionInfo)
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative">
          <Card className="glass border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
                <Mic
                  className="w-8 h-8 text-primary-foreground"
                  strokeWidth={1.75}
                />
              </div>
              <CardTitle className="text-2xl font-bold">Join Session</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to start testing
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Session Info */}
              <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Session</span>
                </div>
                <p className="font-semibold text-lg">
                  {sessionInfo.sessionName}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Code: {sessionCode}
                </p>
              </div>

              {/* Auth Options */}
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  Sign in or create an account to continue
                </p>

                <div className="grid gap-3">
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(
                      `/join/${sessionCode}`
                    )}`}
                  >
                    <Button className="w-full h-12" size="lg">
                      <LogIn className="w-5 h-5 mr-2" />
                      Log in
                    </Button>
                  </Link>

                  <Link
                    href={`/signup?callbackUrl=${encodeURIComponent(
                      `/join/${sessionCode}`
                    )}`}
                  >
                    <Button variant="outline" className="w-full h-12" size="lg">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            Anyone with this session code can join as a tester.
          </p>
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
            <Link href="/dashboard">
              <Button variant="outline">Go to Dashboard</Button>
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
              <Button
                onClick={() => {
                  setHasLeft(false);
                  fetchSession(true); // Explicity request rejoin to clear left_at
                }}
              >
                Continue Testing
              </Button>
              <Link href="/dashboard">
                <Button variant="ghost">Go to Dashboard</Button>
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

  // Convert tester data to user format for the header
  // Use the actual logged-in user ID if available, otherwise fallback to tester data
  const user =
    loggedInUser ||
    (tester
      ? {
          id: tester.user_id || "", // Use empty string if no user_id - notifications won't work without a real user
          first_name: tester.first_name,
          last_name: tester.last_name,
          email: tester.email || "",
        }
      : null);

  // Calculate poll status for current scene
  const pollQuestions = currentScene?.poll_questions || [];
  const hasPollQuestions = pollQuestions.length > 0;
  const answeredPollCount = pollQuestions.filter(
    (q: PollQuestion) => pollResponses[q.id]?.length > 0
  ).length;
  const unansweredRequired = pollQuestions.filter(
    (q: PollQuestion) => q.required && !pollResponses[q.id]?.length
  );
  const hasUnansweredRequired = unansweredRequired.length > 0;

  return (
    <>
      {/* Show admin mobile navigation when logged in as admin (hide bottom nav and top header to not overlap with tester UI) */}
      {isAdmin && <AdminMobileHeader hideBottomNav hideTopHeader />}

      {/* Tester Header */}
      <TesterHeader user={user} />

      <div className="min-h-screen gradient-mesh flex flex-col pt-16">
        {/* Session Info Bar */}
        <div className="border-b border-border bg-card/80 glass sticky top-16 z-40 h-14 flex items-center justify-between px-4">
          {/* Left: Session info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold truncate">{session.name}</h1>
              <p className="text-sm text-muted-foreground truncate">
                {tester.first_name} {tester.last_name}
              </p>
            </div>
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Live
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!data?.tester?.invite_token) {
                  alert("Error: Missing invite token");
                  return;
                }
                const token = data.tester.invite_token;
                console.log("Attempting to leave with token:", token);

                try {
                  const res = await fetch(`/api/leave/${token}`, {
                    method: "POST",
                    cache: "no-store",
                  });

                  if (res.ok) {
                    console.log("Leave successful");
                    // Force a re-fetch of session data to ensure cleaner state
                    setHasLeft(true);
                  } else {
                    const err = await res.json().catch(() => ({}));
                    console.error("Leave failed:", res.status, err);
                    alert(
                      `Failed to leave session: ${err.error || "Unknown error"}`
                    );
                    // Do NOT setHasLeft(true) here, so user sees it failed
                  }
                } catch (error) {
                  console.error("Error leaving session:", error);
                  alert("Network error when trying to leave session");
                }
              }}
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Leave</span>
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto pb-36">
          <div className="container mx-auto px-4 py-6 max-w-xl space-y-6">
            {/* Scene Selector - Full width, prominent */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Current Scene
              </label>
              <Select value={selectedScene} onValueChange={setSelectedScene}>
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Select a scene" />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] z-50">
                  {session.scenes?.map((s: Scene) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* What to test - More prominent */}
            {currentScene && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-0">
                  <button
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-primary/5 transition-colors rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Info className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-primary">What to test</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {currentScene.description
                          ? "View testing instructions"
                          : "No instructions yet"}
                      </p>
                    </div>
                    {descriptionExpanded ? (
                      <ChevronUp className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </button>
                  {descriptionExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="p-4 rounded-lg bg-background/50">
                        {currentScene.description ? (
                          <FormattedDescription
                            text={currentScene.description}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No testing instructions have been added for this
                            scene.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Report General Issues - Accordion */}
            {session.issue_options && session.issue_options.length > 0 && (
              <Card className="border-muted-foreground/20 bg-muted/5">
                <CardContent className="p-0">
                  <button
                    onClick={() => setIssuesExpanded(!issuesExpanded)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/5 transition-colors rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted-foreground/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Report General Issues</p>
                      <p className="text-xs text-muted-foreground">
                        System-wide, not scene-specific
                      </p>
                    </div>
                    {issuesExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {issuesExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {session.issue_options.map((issue: string) => {
                          const isChecked = reportedIssues.includes(issue);
                          return (
                            <button
                              key={issue}
                              type="button"
                              onClick={() => toggleIssue(issue)}
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                isChecked
                                  ? "text-white [background:hsl(32deg_81.1%_41.69%)] dark:[background:hsl(32.15deg_33.04%_56.82%/80%)]"
                                  : "bg-secondary hover:bg-secondary/80"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                              {issue}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Your Notes</h3>
                <span className="text-sm text-muted-foreground">
                  {notes.length} note{notes.length !== 1 ? "s" : ""}
                </span>
              </div>
              <NotesList
                notes={notes}
                sessionId={session.id}
                scenes={session.scenes}
                onNoteUpdated={handleNoteUpdated}
                onNoteDeleted={handleNoteDeleted}
              />
            </div>
          </div>
        </main>

        {/* Poll Panel (separate from recorder) */}
        {pollPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{ backdropFilter: "blur(5px)" }}
              onClick={() => setPollPanelOpen(false)}
            />
            {/* Panel */}
            <div className="relative w-full max-w-xl mx-4 mb-0 bg-card border border-border rounded-t-2xl shadow-2xl h-[500px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Scene Poll</h3>
                </div>
                <div className="flex items-center gap-3">
                  {hasPollQuestions && (
                    <span
                      className={`text-sm px-2 py-0.5 rounded-full ${
                        hasUnansweredRequired
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {answeredPollCount}/{pollQuestions.length}
                    </span>
                  )}
                  <button
                    onClick={() => setPollPanelOpen(false)}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="px-3 py-4 pb-6 overflow-y-auto flex-1 min-h-0">
                {hasPollQuestions ? (
                  <div className="space-y-3">
                    {pollQuestions.map((q: PollQuestion, qIndex: number) => {
                      const isAnswered = (pollResponses[q.id] || []).length > 0;
                      const isRequiredUnanswered = q.required && !isAnswered;

                      return (
                        <div
                          key={q.id}
                          className={`space-y-2 p-2 rounded-lg transition-colors ${
                            isRequiredUnanswered
                              ? "bg-red-500/5 border border-red-500/20"
                              : ""
                          }`}
                        >
                          <p className="text-sm font-medium">
                            <span className="text-muted-foreground mr-1.5">
                              {qIndex + 1}.
                            </span>
                            {q.question}
                            {q.required && (
                              <span className="ml-1 text-red-500">*</span>
                            )}
                            {isRequiredUnanswered && (
                              <span className="ml-2 text-xs text-red-500">
                                (required)
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {q.options.map((option, optIndex) => {
                              const isSelected = (
                                pollResponses[q.id] || []
                              ).includes(option);
                              const isSaving = savingPollResponse === q.id;
                              return (
                                <button
                                  key={optIndex}
                                  type="button"
                                  onClick={() =>
                                    handlePollResponse(
                                      q.id,
                                      q.question_type,
                                      option
                                    )
                                  }
                                  disabled={isSaving}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-secondary hover:bg-secondary/80"
                                  } ${isSaving ? "opacity-50" : ""}`}
                                >
                                  {q.question_type === "radio" ? (
                                    <div
                                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                        isSelected
                                          ? "border-primary-foreground"
                                          : "border-current opacity-60"
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${
                                        isSelected
                                          ? "border-primary-foreground bg-primary-foreground/20"
                                          : "border-current opacity-60"
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check className="w-2.5 h-2.5" />
                                      )}
                                    </div>
                                  )}
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No active polls for this scene
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Bar */}
        {recorderExpanded ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{ backdropFilter: "blur(5px)" }}
              onClick={() => setRecorderExpanded(false)}
            />
            {/* Panel Container */}
            <div className="relative w-full max-w-xl mx-4 mb-0">
              <div className="bg-card border border-border rounded-t-2xl shadow-2xl flex flex-col h-[500px]">
                {/* Expanded state header */}
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInputMode("voice")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        inputMode === "voice"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      Voice
                    </button>
                    <button
                      onClick={() => setInputMode("text")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        inputMode === "text"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <Keyboard className="w-4 h-4" />
                      Text
                    </button>
                  </div>
                  <button
                    onClick={() => setRecorderExpanded(false)}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Recorder content */}
                <div className="p-4 pb-4 overflow-y-auto flex-1 min-h-0 flex flex-col">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Adding note for:{" "}
                      <span className="font-medium text-foreground">
                        {currentScene?.name}
                      </span>
                    </p>
                  </div>
                  {currentScene && inputMode === "voice" ? (
                    <VoiceRecorder
                      sessionId={session.id}
                      sceneId={selectedScene}
                      testerId={tester.id}
                      sceneName={currentScene.name}
                      onNoteCreated={(note) => {
                        handleNoteCreated(note);
                        setRecorderExpanded(false);
                      }}
                    />
                  ) : currentScene ? (
                    <TextNoteInput
                      sessionId={session.id}
                      sceneId={selectedScene}
                      testerId={tester.id}
                      sceneName={currentScene.name}
                      onNoteCreated={(note) => {
                        handleNoteCreated(note);
                        setRecorderExpanded(false);
                      }}
                    />
                  ) : null}
                </div>
              </div>
            </div>
            {/* Safe area padding for mobile */}
            <div className="absolute bottom-0 left-0 right-0 h-safe-area-inset-bottom bg-card pointer-events-none" />
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 z-40">
            <div className="container mx-auto px-4 max-w-xl">
              <div className="bg-card border border-border rounded-t-2xl shadow-2xl flex flex-col">
                {/* Collapsed state - FAB buttons */}
                <div className="p-5 flex items-center justify-center gap-4">
                  {/* Text note button */}
                  <button
                    onClick={() => {
                      setInputMode("text");
                      setRecorderExpanded(true);
                    }}
                    className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    title="Add text note"
                  >
                    <Keyboard className="w-5 h-5 text-muted-foreground" />
                  </button>

                  {/* Voice note button (primary) */}
                  <button
                    onClick={() => {
                      setInputMode("voice");
                      setRecorderExpanded(true);
                    }}
                    className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg hover:scale-105"
                    title="Record voice note"
                  >
                    <Mic className="w-7 h-7 text-primary-foreground" />
                  </button>

                  {/* Poll button (always visible for consistent UI) */}
                  <button
                    onClick={() => setPollPanelOpen(true)}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      hasUnansweredRequired
                        ? "bg-red-500/10 hover:bg-red-500/20"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                    title="Scene Poll"
                  >
                    <ClipboardList
                      className={`w-5 h-5 ${
                        hasUnansweredRequired
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    {hasUnansweredRequired && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unansweredRequired.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {/* Safe area padding for mobile */}
            <div className="h-safe-area-inset-bottom bg-card" />
          </div>
        )}
      </div>
    </>
  );
}
