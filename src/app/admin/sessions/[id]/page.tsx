"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Copy,
  Check,
  Play,
  Square,
  Users,
  FileText,
  Trash2,
  Loader2,
  Layout,
  Edit2,
  RotateCcw,
  UserPlus,
  UsersRound,
  ChevronDown,
  CheckSquare,
  Square as SquareIcon,
  Clock,
  Mail,
  AlertTriangle,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, getStatusLabel, getCategoryLabel } from "@/lib/utils";
import type {
  SessionWithDetails,
  Tester,
  NoteWithDetails,
  Scene,
  Team,
  TeamMember,
  TeamWithMembers,
} from "@/types";

interface TeamWithCount extends Team {
  members: { count: number }[];
}

function FormattedDescription({ text }: { text: string }) {
  const lines = text.split('\n');
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
    } else if (trimmed === '') {
      flushList();
      // Add spacing for empty lines between sections
      if (elements.length > 0 && index < lines.length - 1) {
        elements.push(<div key={`space-${index}`} className="h-2" />);
      }
    } else {
      flushList();
      elements.push(<p key={`text-${index}`} className="text-sm">{trimmed}</p>);
    }
  });
  
  flushList();
  
  return <div className="text-sm text-muted-foreground space-y-2">{elements}</div>;
}

export default function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { toast } = useToast();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [addTesterDialog, setAddTesterDialog] = useState(false);
  const [testerTab, setTesterTab] = useState<"team" | "adhoc">("team");
  const [addingTester, setAddingTester] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Individual tester form
  const [newTesterFirstName, setNewTesterFirstName] = useState("");
  const [newTesterLastName, setNewTesterLastName] = useState("");
  const [newTesterEmail, setNewTesterEmail] = useState("");
  const [individualTesterError, setIndividualTesterError] = useState<string | null>(null);
  
  // Team selection
  const [teams, setTeams] = useState<TeamWithCount[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [loadingTeam, setLoadingTeam] = useState(false);
  
  const [addSceneDialog, setAddSceneDialog] = useState(false);
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneDescription, setNewSceneDescription] = useState("");
  const [addingScene, setAddingScene] = useState(false);
  const [editSceneDialog, setEditSceneDialog] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [editSceneName, setEditSceneName] = useState("");
  const [editSceneDescription, setEditSceneDescription] = useState("");
  const [savingScene, setSavingScene] = useState(false);
  const [restartDialog, setRestartDialog] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Tester selection for email invites
  const [selectedTesterIds, setSelectedTesterIds] = useState<Set<string>>(new Set());
  const [sendingInvites, setSendingInvites] = useState(false);
  const [skipEmailDialog, setSkipEmailDialog] = useState(false);
  const [testersWithoutEmail, setTestersWithoutEmail] = useState<Tester[]>([]);
  const [testersWithEmail, setTestersWithEmail] = useState<Tester[]>([]);

  // Edit tester state
  const [editTesterDialog, setEditTesterDialog] = useState(false);

  // Notes filter state
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>("all");
  const [noteSceneFilter, setNoteSceneFilter] = useState<string>("all");
  const [noteTesterFilter, setNoteTesterFilter] = useState<string>("all");
  const [editingTester, setEditingTester] = useState<Tester | null>(null);
  const [editTesterFirstName, setEditTesterFirstName] = useState("");
  const [editTesterLastName, setEditTesterLastName] = useState("");
  const [editTesterEmail, setEditTesterEmail] = useState("");
  const [savingTester, setSavingTester] = useState(false);

  // Calculate elapsed time for active sessions
  useEffect(() => {
    if (session?.status !== "active" || !session?.started_at) {
      return;
    }

    const startTime = new Date(session.started_at).getTime();
    
    const updateElapsed = () => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    
    return () => clearInterval(interval);
  }, [session?.status, session?.started_at]);

  // Format elapsed time as "Xh Ym Zs"
  const formattedElapsedTime = useMemo(() => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [elapsedTime]);

  // Filter notes based on selected filters
  const filteredNotes = useMemo(() => {
    if (!session?.notes) return [];
    return session.notes.filter((note) => {
      if (noteCategoryFilter !== "all" && note.category !== noteCategoryFilter) return false;
      if (noteSceneFilter !== "all" && note.scene_id !== noteSceneFilter) return false;
      if (noteTesterFilter !== "all" && note.tester_id !== noteTesterFilter) return false;
      return true;
    });
  }, [session?.notes, noteCategoryFilter, noteSceneFilter, noteTesterFilter]);

  const hasActiveNoteFilters = noteCategoryFilter !== "all" || noteSceneFilter !== "all" || noteTesterFilter !== "all";

  function clearNoteFilters() {
    setNoteCategoryFilter("all");
    setNoteSceneFilter("all");
    setNoteTesterFilter("all");
  }

  useEffect(() => {
    fetchSession();
    fetchTeams();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id]);

  async function fetchSession() {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) setSession(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) setTeams(await res.json());
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
  }

  // Check if a team member is already added as a tester
  function isMemberAlreadyTester(member: TeamMember, testers?: Tester[]): boolean {
    const testerList = testers || session?.testers;
    if (!testerList) return false;
    return testerList.some(
      (t) =>
        t.first_name.toLowerCase() === member.first_name.toLowerCase() &&
        t.last_name.toLowerCase() === member.last_name.toLowerCase()
    );
  }

  // Check if an individual tester with given name already exists
  function isIndividualTesterDuplicate(firstName: string, lastName: string): boolean {
    if (!session?.testers) return false;
    return session.testers.some(
      (t) =>
        t.first_name.toLowerCase() === firstName.toLowerCase().trim() &&
        t.last_name.toLowerCase() === lastName.toLowerCase().trim()
    );
  }

  // Get available members (not already testers)
  function getAvailableMembers(): TeamMember[] {
    if (!selectedTeam) return [];
    return selectedTeam.members.filter((m) => !isMemberAlreadyTester(m));
  }

  async function fetchTeamDetails(teamId: string) {
    setLoadingTeam(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const team = await res.json();
        setSelectedTeam(team);
        // Only select members who are NOT already testers
        // Use session.testers directly from the current session state
        const currentTesters = session?.testers || [];
        const availableIds = team.members
          .filter((m: TeamMember) => !isMemberAlreadyTester(m, currentTesters))
          .map((m: TeamMember) => m.id);
        setSelectedMembers(new Set(availableIds));
      }
    } finally {
      setLoadingTeam(false);
    }
  }

  function handleTeamSelect(teamId: string) {
    setSelectedTeamId(teamId);
    fetchTeamDetails(teamId);
  }

  function toggleMember(memberId: string) {
    // Don't allow toggling members who are already testers
    const member = selectedTeam?.members.find((m) => m.id === memberId);
    if (member && isMemberAlreadyTester(member)) return;

    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }

  function toggleAllMembers() {
    if (!selectedTeam) return;
    const availableMembers = getAvailableMembers();
    const selectedAvailableCount = availableMembers.filter((m) =>
      selectedMembers.has(m.id)
    ).length;

    if (selectedAvailableCount === availableMembers.length) {
      // Deselect all available members
      setSelectedMembers(new Set());
    } else {
      // Select all available members
      setSelectedMembers(new Set(availableMembers.map((m) => m.id)));
    }
  }
  async function handleStartSession() {
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    fetchSession();
  }
  async function handleEndSession() {
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    fetchSession();
  }
  async function handleRestartSession() {
    setRestarting(true);
    try {
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" }),
      });
      setRestartDialog(false);
      fetchSession();
    } finally {
      setRestarting(false);
    }
  }
  async function handleAddTesterFromTeam() {
    if (!selectedTeam || selectedMembers.size === 0) return;
    setAddingTester(true);
    try {
      const membersToAdd = selectedTeam.members
        .filter((m) => selectedMembers.has(m.id))
        .map((m) => ({
          first_name: m.first_name,
          last_name: m.last_name,
          email: m.email,
        }));

      await fetch(`/api/sessions/${id}/testers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: membersToAdd }),
      });
      resetTesterDialog();
      fetchSession();
    } finally {
      setAddingTester(false);
    }
  }

  async function handleAddIndividualTester() {
    if (!newTesterFirstName.trim() || !newTesterLastName.trim()) return;
    
    // Check for duplicate
    if (isIndividualTesterDuplicate(newTesterFirstName, newTesterLastName)) {
      setIndividualTesterError(`${newTesterFirstName.trim()} ${newTesterLastName.trim()} is already added as a tester`);
      return;
    }
    
    setAddingTester(true);
    setIndividualTesterError(null);
    try {
      await fetch(`/api/sessions/${id}/testers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newTesterFirstName.trim(),
          last_name: newTesterLastName.trim(),
          email: newTesterEmail.trim() || null,
        }),
      });
      resetTesterDialog();
      fetchSession();
    } finally {
      setAddingTester(false);
    }
  }

  function resetTesterDialog() {
    setAddTesterDialog(false);
    setTesterTab("team");
    setNewTesterFirstName("");
    setNewTesterLastName("");
    setNewTesterEmail("");
    setIndividualTesterError(null);
    setSelectedTeamId(null);
    setSelectedTeam(null);
    setSelectedMembers(new Set());
  }
  async function handleDeleteTester(testerId: string) {
    await fetch(`/api/sessions/${id}/testers?testerId=${testerId}`, {
      method: "DELETE",
    });
    fetchSession();
  }

  function openEditTesterDialog(tester: Tester) {
    setEditingTester(tester);
    setEditTesterFirstName(tester.first_name);
    setEditTesterLastName(tester.last_name);
    setEditTesterEmail(tester.email || "");
    setEditTesterDialog(true);
  }

  async function handleSaveTester() {
    if (!editingTester || !editTesterFirstName.trim() || !editTesterLastName.trim()) return;
    setSavingTester(true);
    try {
      await fetch(`/api/sessions/${id}/testers/${editingTester.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: editTesterFirstName.trim(),
          last_name: editTesterLastName.trim(),
          email: editTesterEmail.trim() || null,
        }),
      });
      setEditTesterDialog(false);
      setEditingTester(null);
      fetchSession();
    } finally {
      setSavingTester(false);
    }
  }
  async function handleAddScene() {
    if (!newSceneName.trim()) return;
    setAddingScene(true);
    try {
      await fetch(`/api/sessions/${id}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSceneName.trim(), description: newSceneDescription.trim() || null }),
      });
      setNewSceneName("");
      setNewSceneDescription("");
      setAddSceneDialog(false);
      fetchSession();
    } finally {
      setAddingScene(false);
    }
  }
  function openEditSceneDialog(scene: Scene) {
    setEditingScene(scene);
    setEditSceneName(scene.name);
    setEditSceneDescription(scene.description || "");
    setEditSceneDialog(true);
  }
  async function handleSaveScene() {
    if (!editingScene || !editSceneName.trim()) return;
    setSavingScene(true);
    try {
      await fetch(`/api/sessions/${id}/scenes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneId: editingScene.id, name: editSceneName.trim(), description: editSceneDescription.trim() || null }),
      });
      setEditSceneDialog(false);
      setEditingScene(null);
      fetchSession();
    } finally {
      setSavingScene(false);
    }
  }
  async function handleDeleteScene(sceneId: string) {
    await fetch(`/api/sessions/${id}/scenes?sceneId=${sceneId}`, {
      method: "DELETE",
    });
    fetchSession();
  }
  function copyInviteLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/join/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  // Toggle individual tester selection
  function toggleTesterSelection(testerId: string) {
    setSelectedTesterIds((prev) => {
      const next = new Set(prev);
      if (next.has(testerId)) {
        next.delete(testerId);
      } else {
        next.add(testerId);
      }
      return next;
    });
  }

  // Toggle all testers selection
  function toggleAllTesters() {
    if (!session?.testers) return;
    if (selectedTesterIds.size === session.testers.length) {
      setSelectedTesterIds(new Set());
    } else {
      setSelectedTesterIds(new Set(session.testers.map((t) => t.id)));
    }
  }

  // Initiate email invite process
  function handleSendEmailInvites() {
    if (!session?.testers || selectedTesterIds.size === 0) return;
    
    const selectedTesters = session.testers.filter((t) => selectedTesterIds.has(t.id));
    const withEmail = selectedTesters.filter((t) => t.email);
    const withoutEmail = selectedTesters.filter((t) => !t.email);
    
    if (withoutEmail.length > 0) {
      setTestersWithEmail(withEmail);
      setTestersWithoutEmail(withoutEmail);
      setSkipEmailDialog(true);
    } else {
      sendEmailInvites(withEmail);
    }
  }

  // Send email invites to testers
  async function sendEmailInvites(testers: Tester[]) {
    if (testers.length === 0) return;
    
    setSendingInvites(true);
    try {
      const res = await fetch(`/api/sessions/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          testers, 
          sessionName: session?.name 
        }),
      });
      
      if (res.ok) {
        const result = await res.json();
        // Clear selection after successful send
        setSelectedTesterIds(new Set());
        toast({
          title: "Invites sent!",
          description: `Successfully sent ${result.sent} invite${result.sent !== 1 ? 's' : ''}.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Failed to send invites",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending invites:", error);
      toast({
        title: "Failed to send invites",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingInvites(true);
      setSkipEmailDialog(false);
      setTestersWithEmail([]);
      setTestersWithoutEmail([]);
      setSendingInvites(false);
    }
  }

  if (loading)
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-secondary rounded" />
        <div className="h-64 bg-secondary rounded-xl" />
      </div>
    );
  if (!session)
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Session not found</h2>
        <Link href="/admin">
          <Button variant="ghost">Back</Button>
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link> */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{session.name}</h1>
                <Badge
                  variant={session.status as "draft" | "active" | "completed"}
                >
                  {getStatusLabel(session.status)}
                </Badge>
              </div>
              {session.build_version && (
                <p className="text-sm text-muted-foreground font-mono">
                  {session.build_version}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
          {session.status === "draft" && (
            <Button onClick={handleStartSession}>
              <Play className="w-4 h-4" />
              Start Session
            </Button>
          )}
          {session.status === "active" && (
            <>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-md">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formattedElapsedTime}</span>
              </div>
              <Button variant="destructive" onClick={handleEndSession}>
                <Square className="w-4 h-4" />
                End Session
              </Button>
            </>
          )}
          {session.status === "completed" && (
            <>
              <Button variant="outline" onClick={() => setRestartDialog(true)}>
                <RotateCcw className="w-4 h-4" />
                Restart Session
              </Button>
              <Link href={`/admin/sessions/${id}/report`}>
                <Button>View Report</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      {session.description && (
        <p className="text-sm pt-3 text-muted-foreground">
          {session.description}
        </p>
      )}
    </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {session.scenes?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Scenes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {session.testers?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Testers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {session.notes?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatDate(session.created_at).split(",")[0]}
            </div>
            <p className="text-sm text-muted-foreground">Created</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="scenes">
        <TabsList>
          <TabsTrigger value="scenes" className="gap-2">
            <Layout className="w-4 h-4" />
            Scenes
          </TabsTrigger>
          <TabsTrigger value="testers" className="gap-2">
            <Users className="w-4 h-4" />
            Testers
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="w-4 h-4" />
            Notes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="scenes" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scenes</CardTitle>
                  <CardDescription>
                    {session.status === "completed"
                      ? "Scenes that were tested"
                      : "Areas or features being tested"}
                  </CardDescription>
                </div>
                {session.status !== "completed" && (
                  <Button onClick={() => setAddSceneDialog(true)}>
                    <Plus className="w-4 h-4" />
                    Add Scene
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {session.scenes?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No scenes added</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {session.scenes?.map((s: Scene, index: number) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-lg bg-secondary/30 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="text-sm text-muted-foreground font-mono w-6 pt-0.5">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{s.name}</p>
                            {s.description ? (
                              <div className="mt-1">
                                <FormattedDescription text={s.description} />
                              </div>
                            ) : session.status !== "completed" && (
                              <p className="text-sm text-muted-foreground/50 mt-1 italic">No testing instructions</p>
                            )}
                          </div>
                        </div>
                        {session.status !== "completed" && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => openEditSceneDialog(s)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {session.scenes && session.scenes.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteScene(s.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="testers" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Testers</CardTitle>
                  <CardDescription>
                    {session.status === "completed"
                      ? "Testers who participated"
                      : "Manage testers and invite links"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {session.status !== "completed" && selectedTesterIds.size > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={handleSendEmailInvites}
                      disabled={sendingInvites}
                    >
                      {sendingInvites ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      Send Email Invite ({selectedTesterIds.size})
                    </Button>
                  )}
                  {session.status !== "completed" && (
                    <Button onClick={() => setAddTesterDialog(true)}>
                      <Plus className="w-4 h-4" />
                      Add Tester
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {session.testers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No testers added</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Select all checkbox */}
                  {session.status !== "completed" && session.testers && session.testers.length > 0 && (
                    <div className="flex items-center gap-3 pb-2 border-b border-border">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={toggleAllTesters}
                      >
                        {selectedTesterIds.size === session.testers.length ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : selectedTesterIds.size > 0 ? (
                          <div className="w-4 h-4 border-2 border-primary rounded-sm flex items-center justify-center">
                            <div className="w-2 h-0.5 bg-primary" />
                          </div>
                        ) : (
                          <SquareIcon className="w-4 h-4" />
                        )}
                        {selectedTesterIds.size === session.testers.length ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                  )}
                  {session.testers?.map((t: Tester) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 group"
                    >
                      <div className="flex items-center gap-3">
                        {session.status !== "completed" && (
                          <button
                            type="button"
                            className="flex-shrink-0"
                            onClick={() => toggleTesterSelection(t.id)}
                          >
                            {selectedTesterIds.has(t.id) ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <SquareIcon className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                            )}
                          </button>
                        )}
                        <div>
                          <p className="font-medium">{t.first_name} {t.last_name}</p>
                          {t.email && (
                            <p className="text-xs text-muted-foreground">{t.email}</p>
                          )}
                          {session.status !== "completed" && (
                            <p className="text-sm text-muted-foreground font-mono">
                              /join/{t.invite_token}
                            </p>
                          )}
                        </div>
                      </div>
                      {session.status !== "completed" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyInviteLink(t.invite_token)}
                          >
                            {copiedToken === t.invite_token ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                            onClick={() => openEditTesterDialog(t)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                            onClick={() => handleDeleteTester(t.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    {session.status === "completed"
                      ? hasActiveNoteFilters 
                        ? `${filteredNotes.length} of ${session.notes?.length || 0} notes`
                        : `${session.notes?.length || 0} notes`
                      : "Notes visible after session ends"}
                  </CardDescription>
                </div>
              </div>
              
              {/* Filters - only show when completed and has notes */}
              {session.status === "completed" && session.notes && session.notes.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter by:</span>
                  </div>
                  
                  <Select value={noteCategoryFilter} onValueChange={setNoteCategoryFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="ux">UX Feedback</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {session.scenes && session.scenes.length > 0 && (
                    <Select value={noteSceneFilter} onValueChange={setNoteSceneFilter}>
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue placeholder="Scene" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Scenes</SelectItem>
                        {session.scenes.map((scene) => (
                          <SelectItem key={scene.id} value={scene.id}>{scene.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {session.testers && session.testers.length > 0 && (
                    <Select value={noteTesterFilter} onValueChange={setNoteTesterFilter}>
                      <SelectTrigger className="h-8 w-[150px] text-xs">
                        <SelectValue placeholder="Tester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Testers</SelectItem>
                        {session.testers.map((tester) => (
                          <SelectItem key={tester.id} value={tester.id}>
                            {tester.first_name} {tester.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {hasActiveNoteFilters && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearNoteFilters}>
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {session.status !== "completed" ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Notes hidden during sessions</p>
                </div>
              ) : session.notes?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notes recorded</p>
                </div>
              ) : filteredNotes.length === 0 && hasActiveNoteFilters ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No notes match the current filters</p>
                  <Button variant="link" size="sm" onClick={clearNoteFilters}>Clear filters</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotes.map((n: NoteWithDetails) => (
                    <div
                      key={n.id}
                      className="p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              n.category as
                                | "bug"
                                | "feature"
                                | "ux"
                                | "performance"
                                | "secondary"
                            }
                          >
                            {getCategoryLabel(n.category)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {n.scene?.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {n.tester?.first_name} {n.tester?.last_name} • {formatDate(n.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">
                        {n.edited_transcript ||
                          n.raw_transcript ||
                          "No transcript"}
                      </p>
                      {n.audio_url && (
                        <audio
                          src={n.audio_url}
                          controls
                          className="mt-2 w-full h-8"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={addTesterDialog} onOpenChange={(open) => { if (!open) resetTesterDialog(); else setAddTesterDialog(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Testers</DialogTitle>
            <DialogDescription>
              Add testers from a team or create individual testers
            </DialogDescription>
          </DialogHeader>
          
          {/* Tab Buttons */}
          <div className="flex gap-2 border-b border-border pb-4">
            <Button
              variant={testerTab === "team" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTesterTab("team")}
              className="gap-2"
            >
              <UsersRound className="w-4 h-4" />
              From Team
            </Button>
            <Button
              variant={testerTab === "adhoc" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTesterTab("adhoc")}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Individual Tester
            </Button>
          </div>

          {/* Team Selection Tab */}
          {testerTab === "team" && (
            <div className="space-y-4 py-2">
              {teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UsersRound className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-2">No teams created yet</p>
                  <Link href="/admin/teams">
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                      Create Team
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Select Team</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {teams.map((team) => (
                        <button
                          key={team.id}
                          type="button"
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedTeamId === team.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleTeamSelect(team.id)}
                        >
                          <p className="font-medium text-sm">{team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {team.members?.[0]?.count || 0} members
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedTeamId && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Select Members</Label>
                        {selectedTeam && getAvailableMembers().length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={toggleAllMembers}
                            className="h-auto py-1 px-2 text-xs"
                          >
                            {selectedMembers.size === getAvailableMembers().length
                              ? "Deselect All"
                              : "Select All"}
                          </Button>
                        )}
                      </div>
                      
                      {loadingTeam ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : selectedTeam?.members.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <p className="text-sm">No members in this team</p>
                        </div>
                      ) : getAvailableMembers().length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Check className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="text-sm">All team members already added</p>
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border p-2">
                          {selectedTeam?.members.map((member) => {
                            const isAlreadyAdded = isMemberAlreadyTester(member);
                            return (
                              <button
                                key={member.id}
                                type="button"
                                disabled={isAlreadyAdded}
                                className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
                                  isAlreadyAdded
                                    ? "opacity-50 cursor-not-allowed bg-secondary/30"
                                    : selectedMembers.has(member.id)
                                    ? "bg-primary/10"
                                    : "hover:bg-secondary"
                                }`}
                                onClick={() => toggleMember(member.id)}
                              >
                                {isAlreadyAdded ? (
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                ) : selectedMembers.has(member.id) ? (
                                  <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                                ) : (
                                  <SquareIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">
                                      {member.first_name} {member.last_name}
                                    </p>
                                    {isAlreadyAdded && (
                                      <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded shrink-0">
                                        Added
                                      </span>
                                    )}
                                  </div>
                                  {member.email && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {member.email}
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Individual Tester Tab */}
          {testerTab === "adhoc" && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testerFirstName">First Name *</Label>
                  <Input
                    id="testerFirstName"
                    value={newTesterFirstName}
                    onChange={(e) => {
                      setNewTesterFirstName(e.target.value);
                      setIndividualTesterError(null);
                    }}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testerLastName">Last Name *</Label>
                  <Input
                    id="testerLastName"
                    value={newTesterLastName}
                    onChange={(e) => {
                      setNewTesterLastName(e.target.value);
                      setIndividualTesterError(null);
                    }}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="testerEmail">
                  Email <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="testerEmail"
                  type="email"
                  value={newTesterEmail}
                  onChange={(e) => setNewTesterEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddIndividualTester();
                    }
                  }}
                />
              </div>
              {individualTesterError && (
                <p className="text-sm text-destructive">{individualTesterError}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={resetTesterDialog}>
              Cancel
            </Button>
            {testerTab === "team" ? (
              <Button
                onClick={handleAddTesterFromTeam}
                disabled={addingTester || selectedMembers.size === 0}
              >
                {addingTester && <Loader2 className="w-4 h-4 animate-spin" />}
                Add {selectedMembers.size > 0 ? `${selectedMembers.size} Tester${selectedMembers.size > 1 ? "s" : ""}` : "Testers"}
              </Button>
            ) : (
              <Button
                onClick={handleAddIndividualTester}
                disabled={addingTester || !newTesterFirstName.trim() || !newTesterLastName.trim()}
              >
                {addingTester && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Tester
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
            <Button variant="ghost" onClick={() => setAddSceneDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddScene}
              disabled={addingScene || !newSceneName.trim()}
            >
              {addingScene && <Loader2 className="w-4 h-4 animate-spin" />}Add Scene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editSceneDialog} onOpenChange={setEditSceneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Scene</DialogTitle>
            <DialogDescription>
              Update scene details and testing instructions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSceneName">Scene Name</Label>
              <Input
                id="editSceneName"
                value={editSceneName}
                onChange={(e) => setEditSceneName(e.target.value)}
                placeholder="e.g., Login Flow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSceneDescription">What to Test <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="editSceneDescription"
                value={editSceneDescription}
                onChange={(e) => setEditSceneDescription(e.target.value)}
                placeholder={"Use bullet points for clarity:\n• Check login with valid credentials\n• Try invalid password\n• Test forgot password flow"}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">Tip: Use • or - for bullet points</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditSceneDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveScene}
              disabled={savingScene || !editSceneName.trim()}
            >
              {savingScene && <Loader2 className="w-4 h-4 animate-spin" />}Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={restartDialog} onOpenChange={setRestartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restart Session?</DialogTitle>
            <DialogDescription>
              This will set the session back to active. Testers will be able to
              rejoin using their existing invite links.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="rounded-lg bg-secondary/50 p-3 text-sm">
              <p className="font-medium mb-1">What happens when you restart:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• All existing notes are preserved</li>
                <li>• Testers can rejoin with the same links</li>
                <li>• Session becomes active for new notes</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRestartDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestartSession} disabled={restarting}>
              {restarting && <Loader2 className="w-4 h-4 animate-spin" />}
              Restart Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Tester Dialog */}
      <Dialog open={editTesterDialog} onOpenChange={setEditTesterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tester</DialogTitle>
            <DialogDescription>
              Update tester details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTesterFirstName">First Name *</Label>
                <Input
                  id="editTesterFirstName"
                  value={editTesterFirstName}
                  onChange={(e) => setEditTesterFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTesterLastName">Last Name *</Label>
                <Input
                  id="editTesterLastName"
                  value={editTesterLastName}
                  onChange={(e) => setEditTesterLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTesterEmail">
                Email <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="editTesterEmail"
                type="email"
                value={editTesterEmail}
                onChange={(e) => setEditTesterEmail(e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTesterDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTester}
              disabled={savingTester || !editTesterFirstName.trim() || !editTesterLastName.trim()}
            >
              {savingTester && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip email dialog for testers without email */}
      <Dialog open={skipEmailDialog} onOpenChange={setSkipEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Some testers don&apos;t have email
            </DialogTitle>
            <DialogDescription>
              The following testers will be skipped because they don&apos;t have an email address:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="rounded-lg bg-secondary/50 p-3 max-h-40 overflow-y-auto">
              <ul className="space-y-1">
                {testersWithoutEmail.map((t) => (
                  <li key={t.id} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-yellow-500">•</span>
                    {t.first_name} {t.last_name}
                  </li>
                ))}
              </ul>
            </div>
            {testersWithEmail.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {testersWithEmail.length} tester{testersWithEmail.length !== 1 ? 's' : ''} will receive an email invite.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSkipEmailDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => sendEmailInvites(testersWithEmail)}
              disabled={sendingInvites || testersWithEmail.length === 0}
            >
              {sendingInvites ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {testersWithEmail.length > 0 
                ? `Send to ${testersWithEmail.length} tester${testersWithEmail.length !== 1 ? 's' : ''}` 
                : 'No emails to send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
