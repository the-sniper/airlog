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
  Activity,
  CheckCircle,
  XCircle,
  X,
  MoreVertical,
  Sparkles,
  UserPlus2,
  Eye,
  EyeOff,
  Send,
  BarChart3,
  GripVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, getStatusLabel, getCategoryLabel } from "@/lib/utils";
import { AISummaryDialog, SummaryFilters, FilterLabels } from "@/components/ai-summary-dialog";
import { NoteAISummaryDialog } from "@/components/note-ai-summary-dialog";
import { AISummaryViewDialog } from "@/components/ai-summary-view-dialog";
import { Tooltip } from "@/components/ui/tooltip";
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
import type {
  SessionWithDetails,
  Tester,
  NoteWithDetails,
  Scene,
  Team,
  TeamMember,
  TeamWithMembers,
  PollQuestion,
  PollQuestionType,
  PollResponse,
} from "@/types";

interface PollQuestionInput {
  id: string;
  question: string;
  question_type: PollQuestionType;
  options: string[];
  required: boolean;
}

interface TeamWithCount extends Team {
  members: { count: number }[];
}

function SortableSceneItem({
  scene,
  session,
  onEdit,
  onDelete,
}: {
  scene: Scene;
  session: SessionWithDetails;
  onEdit: (scene: Scene) => void;
  onDelete: (scene: Scene) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 rounded-lg bg-secondary/30 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {session.status !== "completed" && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors pt-0.5 shrink-0 w-4 h-4 flex items-center justify-center"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <p className="font-medium">{scene.name}</p>
        </div>
        {session.status !== "completed" && (
          <>
            {/* Desktop: Icon + text buttons */}
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-8"
                onClick={() => onEdit(scene)}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              {session.scenes && session.scenes.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-8"
                  onClick={() => onDelete(scene)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
            {/* Mobile: 3-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(scene)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {session.scenes && session.scenes.length > 1 && (
                  <DropdownMenuItem
                    onClick={() => onDelete(scene)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      {scene.description ? (
        <div className="mt-2 ml-2">
          <FormattedDescription text={scene.description} />
        </div>
      ) : session.status !== "completed" && (
        <p className="text-sm text-muted-foreground/50 mt-2 ml-7 italic">No testing instructions</p>
      )}
    </div>
  );
}

function FormattedDescription({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  
  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1.5 w-full">
          {currentList.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary shrink-0">•</span>
              <span className="flex-1">{item}</span>
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

// Component to render the session AI summary with proper formatting
function SessionSummaryContent({ summary }: { summary: string }) {
  const lines = summary.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Warning headers
    if (trimmed.startsWith("**") && (trimmed.includes("⚠️") || trimmed.toLowerCase().includes("requiring review"))) {
      const headerMatch = trimmed.match(/^\*\*(.+?):\*\*\s*(.*)?$/) || trimmed.match(/^\*\*(.+?)\*\*\s*(.*)?$/);
      if (headerMatch) {
        elements.push(
          <div 
            key={index} 
            className="rounded-lg bg-yellow-500/10 border border-yellow-500/20"
            style={{ padding: "10px 15px", margin: "30px 0 10px" }}
          >
            <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 m-0">{headerMatch[1].replace(/:$/, "")}:</h4>
            {headerMatch[2] && <p className="text-sm text-muted-foreground m-0">{headerMatch[2]}</p>}
          </div>
        );
        return;
      }
    }
    
    // Bold headers like **Summary Overview:**
    if (trimmed.startsWith("**") && trimmed.includes(":**")) {
      const headerMatch = trimmed.match(/^\*\*(.+?):\*\*\s*(.*)?$/);
      if (headerMatch) {
        elements.push(
          <div key={index} className="mt-6 first:mt-0">
            <h4 className="font-semibold text-foreground text-base mb-2">{headerMatch[1]}:</h4>
            {headerMatch[2] && <p className="text-sm text-muted-foreground">{headerMatch[2]}</p>}
          </div>
        );
        return;
      }
    }
    
    // Bullet points with category tags like - **[Bug]** - Scene:
    if (trimmed.startsWith("- **[")) {
      const match = trimmed.match(/^-\s*\*\*\[(\w+)\]\*\*\s*(.+)$/);
      if (match) {
        const category = match[1];
        const content = match[2];
        const categoryColor: Record<string, string> = {
          BUG: "bg-[#fb7088]/20 text-[#fb7088]",
          FEATURE: "bg-[#6e71f1]/20 text-[#6e71f1]",
          UX: "bg-[#03bcfa]/20 text-[#03bcfa]",
          PERFORMANCE: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
          OTHER: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
        };
        const colorClass = categoryColor[category.toUpperCase()] || "bg-gray-500/20 text-gray-600";
        
        elements.push(
          <div key={index} className="flex gap-3 mt-4 first:mt-0 p-3 rounded-lg bg-secondary/30">
            <span className={`shrink-0 px-2.5 py-1 rounded text-xs font-medium ${colorClass}`}>
              {category}
            </span>
            <span 
              className="text-sm flex-1"
              dangerouslySetInnerHTML={{ 
                __html: content.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
              }}
            />
          </div>
        );
        return;
      }
    }
    
    // Reported by line
    if (trimmed.startsWith("- *Reported by:") || trimmed.startsWith("*Reported by:")) {
      const reporter = trimmed.replace(/^-?\s*\*Reported by:\s*/, "").replace(/\*$/, "");
      elements.push(
        <p key={index} className="text-xs text-muted-foreground ml-16 -mt-2 mb-3 italic">
          Reported by: {reporter}
        </p>
      );
      return;
    }
    
    // Issue line
    if (trimmed.startsWith("- *Issue:") || trimmed.startsWith("*Issue:")) {
      const issue = trimmed.replace(/^-?\s*\*Issue:\s*/, "").replace(/\*$/, "");
      elements.push(
        <p key={index} className="text-xs text-yellow-600 dark:text-yellow-400 ml-4 -mt-1 mb-2 italic">
          Issue: {issue}
        </p>
      );
      return;
    }
    
    // Regular bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const bulletContent = trimmed.slice(2);
      const formattedContent = bulletContent.replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="font-semibold">$1</strong>'
      );
      elements.push(
        <div key={index} className="flex gap-2 ml-2 mt-2">
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
      return;
    }
    
    // Regular text
    const formattedText = trimmed.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold">$1</strong>'
    );
    elements.push(
      <p 
        key={index} 
        className="text-sm text-muted-foreground mt-2"
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  });

  return <div className="space-y-1">{elements}</div>;
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
  const [newScenePollQuestions, setNewScenePollQuestions] = useState<PollQuestionInput[]>([]);
  const [addingScene, setAddingScene] = useState(false);
  const [editSceneDialog, setEditSceneDialog] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [editSceneName, setEditSceneName] = useState("");
  const [editSceneDescription, setEditSceneDescription] = useState("");
  const [editScenePollQuestions, setEditScenePollQuestions] = useState<PollQuestionInput[]>([]);
  const [savingScene, setSavingScene] = useState(false);
  const [deleteSceneDialog, setDeleteSceneDialog] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);
  const [deletingScene, setDeletingScene] = useState(false);
  const [restartDialog, setRestartDialog] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Edit session state
  const [editSessionDialog, setEditSessionDialog] = useState(false);
  const [editSessionName, setEditSessionName] = useState("");
  const [editSessionDescription, setEditSessionDescription] = useState("");
  const [editSessionBuildVersion, setEditSessionBuildVersion] = useState("");
  const [editSessionIssueOptions, setEditSessionIssueOptions] = useState<string[]>([]);
  const [newIssueOption, setNewIssueOption] = useState("");
  const [savingSession, setSavingSession] = useState(false);

  // Tester selection for email invites
  const [selectedTesterIds, setSelectedTesterIds] = useState<Set<string>>(new Set());
  const [sendingInvites, setSendingInvites] = useState(false);
  const [skipEmailDialog, setSkipEmailDialog] = useState(false);
  const [testersWithoutEmail, setTestersWithoutEmail] = useState<Tester[]>([]);
  const [testersWithEmail, setTestersWithEmail] = useState<Tester[]>([]);

  // Edit tester state
  const [editTesterDialog, setEditTesterDialog] = useState(false);

  // Delete tester state
  const [deleteTesterDialog, setDeleteTesterDialog] = useState(false);
  const [testerToDelete, setTesterToDelete] = useState<Tester | null>(null);
  const [deletingTester, setDeletingTester] = useState(false);

  // Notes filter state
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>("all");
  const [noteSceneFilter, setNoteSceneFilter] = useState<string>("all");
  const [noteTesterFilter, setNoteTesterFilter] = useState<string>("all");
  
  // AI Summary dialog state
  const [aiSummaryDialog, setAISummaryDialog] = useState(false);
  
  // Toggle notes visibility during active session (hidden by default)
  const [showNotesWhileActive, setShowNotesWhileActive] = useState(false);
  
  // Note-level AI Summary state
  const [noteAISummaryNote, setNoteAISummaryNote] = useState<NoteWithDetails | null>(null);
  const [viewSummaryNote, setViewSummaryNote] = useState<NoteWithDetails | null>(null);

  // Delete note state
  const [deleteNoteDialog, setDeleteNoteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<NoteWithDetails | null>(null);
  const [deletingNote, setDeletingNote] = useState(false);
  const [deleteNoteReason, setDeleteNoteReason] = useState("");

  const [editingTester, setEditingTester] = useState<Tester | null>(null);
  const [editTesterFirstName, setEditTesterFirstName] = useState("");
  const [editTesterLastName, setEditTesterLastName] = useState("");
  const [editTesterEmail, setEditTesterEmail] = useState("");
  const [savingTester, setSavingTester] = useState(false);

  // Add to Team dialog state
  const [addToTeamDialog, setAddToTeamDialog] = useState(false);
  const [addToTeamLoading, setAddToTeamLoading] = useState(false);
  const [teamMemberships, setTeamMemberships] = useState<Record<string, Set<string>>>({}); // teamId -> Set of "firstName_lastName"
  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState<string | null>(null);
  const [addingToTeam, setAddingToTeam] = useState(false);

  // End session confirmation dialog state
  const [endSessionDialog, setEndSessionDialog] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [sendingReportEmails, setSendingReportEmails] = useState(false);

  // Poll responses state
  const [pollResponses, setPollResponses] = useState<(PollResponse & { poll_question: PollQuestion & { scene: { session_id: string } } })[]>([]);

  // Refresh loading states
  const [refreshingSession, setRefreshingSession] = useState(false);
  const [refreshingPoll, setRefreshingPoll] = useState(false);

  // Report sending state (for completed sessions)
  const [selectedReportTesterIds, setSelectedReportTesterIds] = useState<Set<string>>(new Set());
  const [sendingReports, setSendingReports] = useState(false);
  const [skipReportEmailDialog, setSkipReportEmailDialog] = useState(false);
  const [reportTestersWithoutEmail, setReportTestersWithoutEmail] = useState<Tester[]>([]);
  const [reportTestersWithEmail, setReportTestersWithEmail] = useState<Tester[]>([]);

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

  // Prepare filter values for AI Summary dialog
  const summaryFilters: SummaryFilters = useMemo(() => ({
    category: noteCategoryFilter !== "all" ? noteCategoryFilter : undefined,
    sceneId: noteSceneFilter !== "all" ? noteSceneFilter : undefined,
    testerId: noteTesterFilter !== "all" ? noteTesterFilter : undefined,
  }), [noteCategoryFilter, noteSceneFilter, noteTesterFilter]);

  // Prepare filter labels for display in AI Summary dialog
  const summaryFilterLabels: FilterLabels = useMemo(() => {
    const labels: FilterLabels = {};
    if (noteCategoryFilter !== "all") {
      labels.category = getCategoryLabel(noteCategoryFilter);
    }
    if (noteSceneFilter !== "all" && session?.scenes) {
      const scene = session.scenes.find(s => s.id === noteSceneFilter);
      labels.scene = scene?.name;
    }
    if (noteTesterFilter !== "all" && session?.testers) {
      const tester = session.testers.find(t => t.id === noteTesterFilter);
      labels.tester = tester ? `${tester.first_name} ${tester.last_name}` : undefined;
    }
    return labels;
  }, [noteCategoryFilter, noteSceneFilter, noteTesterFilter, session?.scenes, session?.testers]);

  function clearNoteFilters() {
    setNoteCategoryFilter("all");
    setNoteSceneFilter("all");
    setNoteTesterFilter("all");
  }

  function handleNoteUpdated(updatedNote: NoteWithDetails) {
    if (!session) return;
    setSession({
      ...session,
      notes: session.notes.map((n) => n.id === updatedNote.id ? updatedNote : n),
    });
    setNoteAISummaryNote(updatedNote);
  }

  function openDeleteNoteDialog(note: NoteWithDetails) {
    setNoteToDelete(note);
    setDeleteNoteReason("");
    setDeleteNoteDialog(true);
  }

  async function handleDeleteNote() {
    if (!noteToDelete || !session || !deleteNoteReason.trim()) return;
    setDeletingNote(true);
    try {
      const res = await fetch(
        `/api/sessions/${id}/notes/${noteToDelete.id}?reason=${encodeURIComponent(deleteNoteReason.trim())}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setSession({
          ...session,
          notes: session.notes.filter((n) => n.id !== noteToDelete.id),
        });
        setDeleteNoteDialog(false);
        setNoteToDelete(null);
        setDeleteNoteReason("");
        toast({
          title: "Note deleted",
          description: "The note has been removed and logged.",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete note.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    } finally {
      setDeletingNote(false);
    }
  }

  useEffect(() => {
    fetchSession();
    fetchTeams();
    fetchPollResponses();
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

  async function fetchPollResponses() {
    try {
      const res = await fetch(`/api/sessions/${id}/poll-responses`);
      if (res.ok) setPollResponses(await res.json());
    } catch (error) {
      console.error("Failed to fetch poll responses:", error);
    }
  }

  async function refreshSession() {
    setRefreshingSession(true);
    try {
      await fetchSession();
    } finally {
      setRefreshingSession(false);
    }
  }

  async function refreshPollResponses() {
    setRefreshingPoll(true);
    try {
      await fetchPollResponses();
    } finally {
      setRefreshingPoll(false);
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

  const defaultIssueOptions = [
    "Performance lag",
    "Spatialization issues",
    "Network lag",
    "Audio issues",
    "Visual glitches",
    "Input/Controls issues",
  ];

  function openEditSessionDialog() {
    if (!session) return;
    setEditSessionName(session.name);
    setEditSessionDescription(session.description || "");
    setEditSessionBuildVersion(session.build_version || "");
    setEditSessionIssueOptions(session.issue_options || []);
    setNewIssueOption("");
    setEditSessionDialog(true);
  }

  function addEditIssueOption(option: string) {
    const trimmed = option.trim();
    if (trimmed && !editSessionIssueOptions.includes(trimmed)) {
      setEditSessionIssueOptions([...editSessionIssueOptions, trimmed]);
    }
    setNewIssueOption("");
  }

  function removeEditIssueOption(option: string) {
    setEditSessionIssueOptions(editSessionIssueOptions.filter(o => o !== option));
  }

  async function handleSaveSession() {
    if (!session || !editSessionName.trim()) return;
    setSavingSession(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editSessionName.trim(),
          description: editSessionDescription.trim() || null,
          build_version: editSessionBuildVersion.trim() || null,
          issue_options: editSessionIssueOptions,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSession({ ...session, ...updated });
        setEditSessionDialog(false);
        toast({
          title: "Session updated",
          description: "Session details have been saved.",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update session.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving session:", error);
      toast({
        title: "Error",
        description: "Failed to update session.",
        variant: "destructive",
      });
    } finally {
      setSavingSession(false);
    }
  }

  async function handleEndSession(sendReport: boolean = false) {
    if (sendReport) {
      setSendingReportEmails(true);
    } else {
      setEndingSession(true);
    }

    try {
      // End the session first
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });

      // If sendReport is true, send report emails to all testers
      if (sendReport) {
        const testersWithEmail = session?.testers?.filter((t) => t.email) || [];
        if (testersWithEmail.length > 0) {
          const res = await fetch(`/api/sessions/${id}/report/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (res.ok) {
            const result = await res.json();
            toast({
              title: "Session ended & report sent!",
              description: `Report sent to ${result.sent} tester${result.sent !== 1 ? "s" : ""}.`,
              variant: "success",
            });
          } else {
            toast({
              title: "Session ended",
              description: "Failed to send report emails. You can share the report manually.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Session ended",
            description: "No testers with email addresses to send report to.",
          });
        }
      } else {
        toast({
          title: "Session ended",
          description: "The testing session has been completed.",
          variant: "success",
        });
      }

      setEndSessionDialog(false);
      fetchSession();
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEndingSession(false);
      setSendingReportEmails(false);
    }
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
  function openDeleteTesterDialog(tester: Tester) {
    setTesterToDelete(tester);
    setDeleteTesterDialog(true);
  }

  async function handleDeleteTester() {
    if (!testerToDelete) return;
    setDeletingTester(true);
    try {
      await fetch(`/api/sessions/${id}/testers?testerId=${testerToDelete.id}`, {
        method: "DELETE",
      });
      setDeleteTesterDialog(false);
      setTesterToDelete(null);
      fetchSession();
      toast({
        title: "Tester removed",
        description: `${testerToDelete.first_name} ${testerToDelete.last_name} has been removed from the session.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting tester:", error);
      toast({
        title: "Error",
        description: "Failed to remove tester.",
        variant: "destructive",
      });
    } finally {
      setDeletingTester(false);
    }
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
      // Filter out empty poll questions
      const validPollQuestions = newScenePollQuestions
        .filter(q => q.question.trim() && q.options.some(o => o.trim()))
        .map(q => ({
          question: q.question.trim(),
          question_type: q.question_type,
          options: q.options.filter(o => o.trim()),
          required: q.required,
        }));
      
      await fetch(`/api/sessions/${id}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newSceneName.trim(), 
          description: newSceneDescription.trim() || null,
          poll_questions: validPollQuestions.length > 0 ? validPollQuestions : undefined,
        }),
      });
      setNewSceneName("");
      setNewSceneDescription("");
      setNewScenePollQuestions([]);
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
    // Load existing poll questions
    const existingQuestions = (scene.poll_questions || []).map((q: PollQuestion) => ({
      id: q.id,
      question: q.question,
      question_type: q.question_type,
      options: q.options,
      required: q.required,
    }));
    setEditScenePollQuestions(existingQuestions);
    setEditSceneDialog(true);
  }
  async function handleSaveScene() {
    if (!editingScene || !editSceneName.trim()) return;
    setSavingScene(true);
    try {
      // Filter out empty poll questions
      const validPollQuestions = editScenePollQuestions
        .filter(q => q.question.trim() && q.options.some(o => o.trim()))
        .map(q => ({
          question: q.question.trim(),
          question_type: q.question_type,
          options: q.options.filter(o => o.trim()),
          required: q.required,
        }));
      
      await fetch(`/api/sessions/${id}/scenes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sceneId: editingScene.id, 
          name: editSceneName.trim(), 
          description: editSceneDescription.trim() || null,
          poll_questions: validPollQuestions,
        }),
      });
      setEditSceneDialog(false);
      setEditingScene(null);
      setEditScenePollQuestions([]);
      fetchSession();
    } finally {
      setSavingScene(false);
    }
  }

  async function handleSceneDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !session?.scenes || active.id === over.id) return;

    const oldIndex = session.scenes.findIndex((s) => s.id === active.id);
    const newIndex = session.scenes.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update the UI
    const newScenes = arrayMove(session.scenes, oldIndex, newIndex);
    setSession({ ...session, scenes: newScenes });

    // Update the order in the database
    try {
      const sceneIds = newScenes.map((s) => s.id);
      await fetch(`/api/sessions/${id}/scenes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneIds }),
      });
      // Refresh to ensure consistency
      fetchSession();
    } catch (error) {
      console.error("Error updating scene order:", error);
      // Revert on error
      fetchSession();
      toast({
        title: "Error",
        description: "Failed to update scene order. Please try again.",
        variant: "destructive",
      });
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function openDeleteSceneDialog(scene: Scene) {
    setSceneToDelete(scene);
    setDeleteSceneDialog(true);
  }

  async function handleDeleteScene() {
    if (!sceneToDelete) return;
    setDeletingScene(true);
    try {
      await fetch(`/api/sessions/${id}/scenes?sceneId=${sceneToDelete.id}`, {
        method: "DELETE",
      });
      setDeleteSceneDialog(false);
      setSceneToDelete(null);
      fetchSession();
      toast({
        title: "Scene deleted",
        description: `"${sceneToDelete.name}" has been removed.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting scene:", error);
      toast({
        title: "Error",
        description: "Failed to delete scene.",
        variant: "destructive",
      });
    } finally {
      setDeletingScene(false);
    }
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
        // Refresh session to get updated invite_sent_at
        fetchSession();
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

  // Toggle report tester selection (for completed sessions)
  function toggleReportTesterSelection(testerId: string) {
    setSelectedReportTesterIds((prev) => {
      const next = new Set(prev);
      if (next.has(testerId)) {
        next.delete(testerId);
      } else {
        next.add(testerId);
      }
      return next;
    });
  }

  // Toggle all report testers selection
  function toggleAllReportTesters() {
    if (!session?.testers) return;
    if (selectedReportTesterIds.size === session.testers.length) {
      setSelectedReportTesterIds(new Set());
    } else {
      setSelectedReportTesterIds(new Set(session.testers.map((t) => t.id)));
    }
  }

  // Initiate report sending process (for completed sessions)
  function handleSendReports() {
    if (!session?.testers || selectedReportTesterIds.size === 0) return;

    const selectedTesters = session.testers.filter((t) => selectedReportTesterIds.has(t.id));
    const withEmail = selectedTesters.filter((t) => t.email);
    const withoutEmail = selectedTesters.filter((t) => !t.email);

    if (withoutEmail.length > 0) {
      setReportTestersWithEmail(withEmail);
      setReportTestersWithoutEmail(withoutEmail);
      setSkipReportEmailDialog(true);
    } else {
      sendReports(withEmail);
    }
  }

  // Send reports to selected testers
  async function sendReports(testers: Tester[]) {
    if (testers.length === 0) return;

    setSendingReports(true);
    try {
      const res = await fetch(`/api/sessions/${id}/report/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testerIds: testers.map((t) => t.id),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        // Clear selection after successful send
        setSelectedReportTesterIds(new Set());
        toast({
          title: "Reports sent!",
          description: `Successfully sent ${result.sent} report${result.sent !== 1 ? 's' : ''}.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Failed to send reports",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending reports:", error);
      toast({
        title: "Failed to send reports",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingReports(false);
      setSkipReportEmailDialog(false);
      setReportTestersWithEmail([]);
      setReportTestersWithoutEmail([]);
    }
  }

  // Open Add to Team dialog
  async function openAddToTeamDialog() {
    if (selectedTesterIds.size === 0) return;
    setAddToTeamDialog(true);
    setAddToTeamLoading(true);
    setSelectedTeamForAdd(null);

    try {
      // Fetch membership info for all teams
      const memberships: Record<string, Set<string>> = {};
      await Promise.all(
        teams.map(async (team) => {
          const res = await fetch(`/api/teams/${team.id}/members`);
          if (res.ok) {
            const members = await res.json();
            memberships[team.id] = new Set(
              members.map((m: { first_name: string; last_name: string }) =>
                `${m.first_name.toLowerCase()}_${m.last_name.toLowerCase()}`
              )
            );
          }
        })
      );
      setTeamMemberships(memberships);
    } catch (error) {
      console.error("Error fetching team memberships:", error);
    } finally {
      setAddToTeamLoading(false);
    }
  }

  // Check if a tester is already a member of a team
  function isTesterInTeam(tester: Tester, teamId: string): boolean {
    const members = teamMemberships[teamId];
    if (!members) return false;
    return members.has(`${tester.first_name.toLowerCase()}_${tester.last_name.toLowerCase()}`);
  }

  // Check if all selected testers are already in a team
  function areAllSelectedTestersInTeam(teamId: string): boolean {
    if (!session?.testers || selectedTesterIds.size === 0) return false;
    const selectedTesters = session.testers.filter((t) => selectedTesterIds.has(t.id));
    return selectedTesters.every((t) => isTesterInTeam(t, teamId));
  }

  // Get count of selected testers not yet in a team
  function getTestersToAddCount(teamId: string): number {
    if (!session?.testers || selectedTesterIds.size === 0) return 0;
    const selectedTesters = session.testers.filter((t) => selectedTesterIds.has(t.id));
    return selectedTesters.filter((t) => !isTesterInTeam(t, teamId)).length;
  }

  // Add selected testers to a team
  async function handleAddToTeam() {
    if (!selectedTeamForAdd || !session?.testers || selectedTesterIds.size === 0) return;
    
    const selectedTesters = session.testers.filter((t) => selectedTesterIds.has(t.id));
    const testersToAdd = selectedTesters.filter((t) => !isTesterInTeam(t, selectedTeamForAdd));

    if (testersToAdd.length === 0) {
      toast({
        title: "No testers to add",
        description: "All selected testers are already members of this team.",
        variant: "default",
      });
      return;
    }

    setAddingToTeam(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeamForAdd}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testers: testersToAdd.map((t) => ({
            first_name: t.first_name,
            last_name: t.last_name,
            email: t.email,
          })),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Added to team!",
          description: `Successfully added ${result.added || testersToAdd.length} tester${(result.added || testersToAdd.length) !== 1 ? "s" : ""} to the team.`,
          variant: "success",
        });
        setAddToTeamDialog(false);
        setSelectedTesterIds(new Set());
        setSelectedTeamForAdd(null);
      } else {
        toast({
          title: "Failed to add to team",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding testers to team:", error);
      toast({
        title: "Failed to add to team",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingToTeam(false);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold">{session.name}</h1>
                <Badge
                  variant={session.status as "draft" | "active" | "completed"}
                >
                  {getStatusLabel(session.status)}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={openEditSessionDialog}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              {session.build_version && (
                <p className="text-sm text-muted-foreground font-mono">
                  {session.build_version}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {session.status === "draft" && (
            <Button onClick={handleStartSession} className="w-full sm:w-auto">
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
              <Button variant="destructive" onClick={() => setEndSessionDialog(true)} className="flex-1 sm:flex-none">
                <Square className="w-4 h-4" />
                End Session
              </Button>
            </>
          )}
          {session.status === "completed" && (
            <>
              <Button variant="outline" onClick={() => setRestartDialog(true)} className="flex-1 sm:flex-none">
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Restart Session</span>
                <span className="sm:hidden">Restart</span>
              </Button>
              <Link href={`/admin/sessions/${id}/report`} className="flex-1 sm:flex-none">
                <Button className="w-full">View Report</Button>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              {session.testers?.reduce((total: number, tester: Tester) => 
                total + (tester.reported_issues?.length || 0), 0) || 0}
            </div>
            <p className="text-sm text-muted-foreground">Stability Issues</p>
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
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="scenes" className="gap-1.5 sm:gap-2 flex-1 sm:flex-none">
            <Layout className="w-4 h-4" />
            <span>Scenes</span>
          </TabsTrigger>
          <TabsTrigger value="testers" className="gap-1.5 sm:gap-2 flex-1 sm:flex-none">
            <Users className="w-4 h-4" />
            <span>Testers</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5 sm:gap-2 flex-1 sm:flex-none">
            <FileText className="w-4 h-4" />
            <span>Notes</span>
          </TabsTrigger>
          {session.issue_options && session.issue_options.length > 0 && (
            <TabsTrigger value="stability" className="gap-1.5 sm:gap-2 flex-1 sm:flex-none">
              <Activity className="w-4 h-4" />
              <span>Stability</span>
            </TabsTrigger>
          )}
          {session.scenes?.some((s: Scene) => s.poll_questions && s.poll_questions.length > 0) && (
            <TabsTrigger value="poll" className="gap-1.5 sm:gap-2 flex-1 sm:flex-none">
              <BarChart3 className="w-4 h-4" />
              <span>Poll</span>
            </TabsTrigger>
          )}
          {session.ai_summary ? (
            <TabsTrigger value="summary" className="gap-1.5 sm:gap-2 flex-1 sm:flex-none">
              <Sparkles className="w-4 h-4" />
              <span>Summary</span>
            </TabsTrigger>
          ) : (
            <Tooltip 
              content={
                session.status !== "completed" 
                  ? "Complete the session first to generate a summary" 
                  : "Generate a summary from the Notes tab"
              }
              side="bottom"
            >
              <TabsTrigger 
                value="summary" 
                disabled 
                className="gap-1.5 sm:gap-2 flex-1 sm:flex-none opacity-50 cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>Summary</span>
              </TabsTrigger>
            </Tooltip>
          )}
        </TabsList>
        <TabsContent value="scenes" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Scenes</CardTitle>
                  <CardDescription>
                    {session.status === "completed"
                      ? "Scenes that were tested"
                      : "Areas or features being tested"}
                  </CardDescription>
                </div>
                {session.status !== "completed" && (
                  <Button onClick={() => setAddSceneDialog(true)} size="sm" className="w-full sm:w-auto">
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
              ) : session.status === "completed" ? (
                <div className="space-y-3">
                  {session.scenes?.map((s: Scene) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-lg bg-secondary/30 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <p className="font-medium">{s.name}</p>
                        </div>
                      </div>
                      {s.description && (
                        <div className="mt-2 ml-2">
                          <FormattedDescription text={s.description} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSceneDragEnd}
                >
                  <SortableContext
                    items={session.scenes?.map((s) => s.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {session.scenes?.map((s: Scene) => (
                        <SortableSceneItem
                          key={s.id}
                          scene={s}
                          session={session}
                          onEdit={openEditSceneDialog}
                          onDelete={openDeleteSceneDialog}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="testers" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Testers</CardTitle>
                  <CardDescription>
                    {session.status === "completed"
                      ? "Testers who participated"
                      : "Manage testers and invite links"}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {session.status === "completed" && selectedReportTesterIds.size > 0 && (
                    <Button
                      onClick={handleSendReports}
                      disabled={sendingReports}
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      {sendingReports ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Send Report</span>
                      <span className="sm:hidden">Send</span>
                      <span>({selectedReportTesterIds.size})</span>
                    </Button>
                  )}
                  {session.status !== "completed" && selectedTesterIds.size > 0 && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={openAddToTeamDialog}
                        disabled={teams.length === 0}
                        size="sm"
                        className="flex-1 sm:flex-none"
                      >
                        <UserPlus2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Add to Team</span>
                        <span className="sm:hidden">Team</span>
                        <span>({selectedTesterIds.size})</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleSendEmailInvites}
                        disabled={sendingInvites}
                        size="sm"
                        className="flex-1 sm:flex-none"
                      >
                        {sendingInvites ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Send Email Invite</span>
                        <span className="sm:hidden">Email</span>
                        <span>({selectedTesterIds.size})</span>
                      </Button>
                    </>
                  )}
                  {session.status !== "completed" && (
                    <Button onClick={() => setAddTesterDialog(true)} size="sm" className="flex-1 sm:flex-none">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Tester</span>
                      <span className="sm:hidden">Add</span>
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
                  {/* Select all checkbox - for non-completed sessions */}
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
                  {/* Select all checkbox - for completed sessions (report sending) */}
                  {session.status === "completed" && session.testers && session.testers.length > 0 && (
                    <div className="flex items-center gap-3 pb-2 border-b border-border">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={toggleAllReportTesters}
                      >
                        {selectedReportTesterIds.size === session.testers.length ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : selectedReportTesterIds.size > 0 ? (
                          <div className="w-4 h-4 border-2 border-primary rounded-sm flex items-center justify-center">
                            <div className="w-2 h-0.5 bg-primary" />
                          </div>
                        ) : (
                          <SquareIcon className="w-4 h-4" />
                        )}
                        {selectedReportTesterIds.size === session.testers.length ? "Deselect all" : "Select all to send report"}
                      </button>
                    </div>
                  )}
                  {session.testers?.map((t: Tester) => (
                    <div
                      key={t.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg bg-secondary/30 group"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {session.status !== "completed" && (
                          <button
                            type="button"
                            className="flex-shrink-0 mt-0.5 sm:mt-0"
                            onClick={() => toggleTesterSelection(t.id)}
                          >
                            {selectedTesterIds.has(t.id) ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <SquareIcon className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                            )}
                          </button>
                        )}
                        {session.status === "completed" && (
                          <button
                            type="button"
                            className="flex-shrink-0 mt-0.5 sm:mt-0"
                            onClick={() => toggleReportTesterSelection(t.id)}
                          >
                            {selectedReportTesterIds.has(t.id) ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <SquareIcon className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                            )}
                          </button>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{t.first_name} {t.last_name}</p>
                            {t.invite_sent_at && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                                <Mail className="w-3 h-3" />
                                Invited
                              </span>
                            )}
                          </div>
                          {t.email && (
                            <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                          )}
                          {session.status !== "completed" && (
                            <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate">
                              /join/{t.invite_token}
                            </p>
                          )}
                        </div>
                      </div>
                      {session.status !== "completed" && (
                        <div className="flex items-center gap-2 pl-8 sm:pl-0">
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
                            className="text-muted-foreground hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                            onClick={() => openEditTesterDialog(t)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                            onClick={() => openDeleteTesterDialog(t)}
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
                      : session.status === "active" && showNotesWhileActive
                      ? `${session.notes?.length || 0} notes (live view)`
                      : "Notes hidden by default during active sessions"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {session.status === "active" && (
                    <>
                      <Button
                        variant={showNotesWhileActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowNotesWhileActive(!showNotesWhileActive)}
                        className="gap-2"
                      >
                        {showNotesWhileActive ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span className="hidden sm:inline">Hide Notes</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Show Notes</span>
                          </>
                        )}
                      </Button>
                      {showNotesWhileActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={refreshSession}
                          disabled={refreshingSession}
                          className="gap-2"
                        >
                          <RotateCcw className={`w-4 h-4 ${refreshingSession ? "animate-spin" : ""}`} />
                          <span className="hidden sm:inline">Refresh</span>
                        </Button>
                      )}
                    </>
                  )}
                  {session.status === "completed" && session.notes && session.notes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAISummaryDialog(true)}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline">Summarize Session</span>
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Filters - show when notes are visible and has notes */}
              {(session.status === "completed" || (session.status === "active" && showNotesWhileActive)) && session.notes && session.notes.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter by:</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={noteCategoryFilter} onValueChange={setNoteCategoryFilter}>
                      <SelectTrigger className="h-8 w-[120px] sm:w-[140px] text-xs">
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
                        <SelectTrigger className="h-8 w-[110px] sm:w-[130px] text-xs">
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
                        <SelectTrigger className="h-8 w-[120px] sm:w-[150px] text-xs">
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
                </div>
              )}
            </CardHeader>
            <CardContent>
              {session.status !== "completed" && !(session.status === "active" && showNotesWhileActive) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{session.status === "active" ? "Click \"Show Notes\" to view notes during this session" : "Notes hidden during draft sessions"}</p>
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
                      className="p-3 sm:p-4 rounded-lg border border-border"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-2">
                        <div className="flex flex-wrap items-center gap-2">
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
                          {n.ai_summary && (
                            <button
                              onClick={() => setViewSummaryNote(n)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Sparkles className="w-3 h-3" />
                              AI Summary
                            </button>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {n.scene?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {n.tester?.first_name} {n.tester?.last_name} • {formatDate(n.created_at)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(n.edited_transcript || n.raw_transcript) && (
                                <DropdownMenuItem onClick={() => setNoteAISummaryNote(n)}>
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  AI Summary
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => openDeleteNoteDialog(n)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
        
        {/* Summary Tab */}
        {session.ai_summary && (
          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Session Summary
                    </CardTitle>
                    <CardDescription>
                      AI-generated actionable items from {session.notes?.length || 0} notes
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAISummaryDialog(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Summary</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <SessionSummaryContent summary={session.ai_summary} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        {session.issue_options && session.issue_options.length > 0 && (
          <TabsContent value="stability" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-amber-500" />
                      Stability Issues
                    </CardTitle>
                    <CardDescription>
                      General issues reported by testers during the session
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshSession}
                    disabled={refreshingSession}
                    className="gap-2"
                  >
                    <RotateCcw className={`w-4 h-4 ${refreshingSession ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Aggregate reported issues from all testers
                  const issueStats: Record<string, { count: number; testers: string[] }> = {};
                  session.issue_options.forEach((issue: string) => {
                    issueStats[issue] = { count: 0, testers: [] };
                  });
                  session.testers?.forEach((tester: Tester) => {
                    const testerIssues = tester.reported_issues || [];
                    testerIssues.forEach((issue: string) => {
                      if (issueStats[issue]) {
                        issueStats[issue].count++;
                        issueStats[issue].testers.push(`${tester.first_name} ${tester.last_name}`);
                      }
                    });
                  });
                  const totalTesters = session.testers?.length || 0;
                  const hasAnyIssues = Object.values(issueStats).some((s) => s.count > 0);

                  if (!hasAnyIssues) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No stability issues reported yet</p>
                        <p className="text-sm mt-1">
                          Testers can report issues during the session
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {Object.entries(issueStats)
                        .sort((a, b) => b[1].count - a[1].count)
                        .map(([issue, stats]) => {
                          const percentage = totalTesters ? (stats.count / totalTesters) * 100 : 0;
                          // Color coding: < 50% green, 50-80% orange, > 80% red
                          const getColorClasses = () => {
                            if (stats.count === 0) return { icon: "text-muted-foreground/40", bar: "bg-muted-foreground/30" };
                            if (percentage < 50) return { icon: "text-green-500", bar: "bg-green-500 dark:bg-green-400/60" };
                            if (percentage <= 80) return { icon: "text-amber-500", bar: "bg-amber-500 dark:bg-amber-400/60" };
                            return { icon: "text-red-500", bar: "bg-red-500 dark:bg-red-400/60" };
                          };
                          const colors = getColorClasses();
                          
                          // Icon based on severity
                          const getIcon = () => {
                            if (stats.count === 0) return <AlertTriangle className={`w-4 h-4 ${colors.icon}`} />;
                            if (percentage < 50) return <CheckCircle className={`w-4 h-4 ${colors.icon}`} />;
                            if (percentage <= 80) return <AlertTriangle className={`w-4 h-4 ${colors.icon}`} />;
                            return <XCircle className={`w-4 h-4 ${colors.icon}`} />;
                          };
                          
                          return (
                            <div
                              key={issue}
                              className={`p-3 rounded-lg border ${
                                stats.count > 0
                                  ? "bg-secondary/30 border-border"
                                  : "bg-secondary/20 border-border/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getIcon()}
                                  <span className={`text-sm ${stats.count > 0 ? "font-medium" : "text-muted-foreground"}`}>{issue}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                                      style={{
                                        width: `${percentage}%`,
                                      }}
                                    />
                                  </div>
                                  <span className={`text-xs ${stats.count > 0 ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                                    {stats.count}/{totalTesters}
                                  </span>
                                </div>
                              </div>
                              {stats.count > 0 && (
                                <p className="text-xs text-muted-foreground/70 mt-1.5 ml-7">
                                  {stats.testers.join(", ")}
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        )}
        {session.scenes?.some((s: Scene) => s.poll_questions && s.poll_questions.length > 0) && (
          <TabsContent value="poll" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      Poll Results
                    </CardTitle>
                    <CardDescription>
                      Poll responses from testers grouped by scene
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshPollResponses}
                    disabled={refreshingPoll}
                    className="gap-2"
                  >
                    <RotateCcw className={`w-4 h-4 ${refreshingPoll ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Filter scenes with poll questions
                  const scenesWithPolls = session.scenes?.filter(
                    (s: Scene) => s.poll_questions && s.poll_questions.length > 0
                  ) || [];

                  if (scenesWithPolls.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No poll questions configured</p>
                      </div>
                    );
                  }

                  const totalTesters = session.testers?.length || 0;

                  return (
                    <div className="space-y-8">
                      {scenesWithPolls.map((scene: Scene) => (
                        <div key={scene.id} className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Layout className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{scene.name}</h3>
                          </div>
                          <div className="space-y-6 pl-2">
                            {scene.poll_questions?.map((question: PollQuestion, qIndex: number) => {
                              // Get responses for this question
                              const questionResponses = pollResponses.filter(
                                (r) => r.poll_question_id === question.id
                              );
                              
                              // Count responses for each option
                              const optionCounts: Record<string, { count: number; testers: string[] }> = {};
                              question.options.forEach((opt) => {
                                optionCounts[opt] = { count: 0, testers: [] };
                              });
                              
                              questionResponses.forEach((response) => {
                                const tester = session.testers?.find((t: Tester) => t.id === response.tester_id);
                                const testerName = tester ? `${tester.first_name} ${tester.last_name}` : "Unknown";
                                response.selected_options.forEach((opt) => {
                                  if (optionCounts[opt]) {
                                    optionCounts[opt].count++;
                                    optionCounts[opt].testers.push(testerName);
                                  }
                                });
                              });

                              const respondentCount = questionResponses.length;
                              const hasResponses = respondentCount > 0;

                              return (
                                <div key={question.id} className="space-y-3">
                                  <div className="flex items-start gap-2">
                                    <span className="text-sm text-muted-foreground font-mono shrink-0">
                                      Q{qIndex + 1}.
                                    </span>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{question.question}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {question.question_type === "radio" ? "Single Choice" : "Multiple Choice"}
                                        </Badge>
                                        {question.required && (
                                          <Badge variant="secondary" className="text-xs">Required</Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                          {respondentCount}/{totalTesters} responded
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {!hasResponses ? (
                                    <div className="text-sm text-muted-foreground/70 py-2 pl-8">
                                      No responses yet
                                    </div>
                                  ) : (
                                    <div className="space-y-2 pl-8">
                                      {question.options.map((option, optIndex) => {
                                        const stats = optionCounts[option];
                                        const percentage = respondentCount > 0 
                                          ? Math.round((stats.count / respondentCount) * 100) 
                                          : 0;
                                        
                                        return (
                                          <div
                                            key={optIndex}
                                            className={`p-2.5 rounded-lg border ${
                                              stats.count > 0
                                                ? "bg-secondary/30 border-border"
                                                : "bg-secondary/10 border-border/50"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-3">
                                              <span className={`text-sm flex-1 ${stats.count > 0 ? "" : "text-muted-foreground"}`}>
                                                {option}
                                              </span>
                                              <div className="flex items-center gap-3 shrink-0">
                                                <div className="w-20 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                                                  <div
                                                    className="h-full bg-blue-500 dark:bg-blue-400/60 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                  />
                                                </div>
                                                <span className={`text-xs w-12 text-right ${stats.count > 0 ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                                                  {percentage}% ({stats.count})
                                                </span>
                                              </div>
                                            </div>
                                            {stats.count > 0 && (
                                              <p className="text-xs text-muted-foreground/70 mt-1.5">
                                                {stats.testers.join(", ")}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        )}
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
              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none"
            >
              <UsersRound className="w-4 h-4" />
              <span className="hidden sm:inline">From Team</span>
              <span className="sm:hidden">Team</span>
            </Button>
            <Button
              variant={testerTab === "adhoc" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTesterTab("adhoc")}
              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Individual Tester</span>
              <span className="sm:hidden">Individual</span>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                placeholder={"Use bullet points for clarity:\n• Test player movement and controls\n• Check collision detection\n• Verify UI interactions work correctly"}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">Tip: Use • or - for bullet points</p>
            </div>
            
            {/* Poll Questions Section */}
            <div className="space-y-3 py-4 border-t border-border/40">
              <div className="flex items-center justify-between">
                <Label>Poll Questions <span className="text-muted-foreground font-normal">(optional)</span></Label>
                {newScenePollQuestions.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewScenePollQuestions([...newScenePollQuestions, {
                      id: crypto.randomUUID(),
                      question: "",
                      question_type: "radio",
                      options: ["", ""],
                      required: false,
                    }])}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Question
                  </Button>
                )}
              </div>
              
              {newScenePollQuestions.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No poll questions added. Click &quot;Add Question&quot; to create a poll for testers.
                </p>
              )}
              
              {newScenePollQuestions.map((q, qIndex) => (
                <div key={q.id} className="p-4 rounded-lg border border-border/40 bg-secondary/30 space-y-3">
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
                      onClick={() => setNewScenePollQuestions(newScenePollQuestions.filter((_, i) => i !== qIndex))}
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
                        <SelectItem value="checkbox">Multiple Choice</SelectItem>
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
                    <Label className="text-xs text-muted-foreground">Options</Label>
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
                              updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
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
                  onClick={() => setNewScenePollQuestions([...newScenePollQuestions, {
                    id: crypto.randomUUID(),
                    question: "",
                    question_type: "radio",
                    options: ["", ""],
                    required: false,
                  }])}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Question
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setAddSceneDialog(false); setNewScenePollQuestions([]); }}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                placeholder={"Use bullet points for clarity:\n• Test player movement and controls\n• Check collision detection\n• Verify UI interactions work correctly"}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">Tip: Use • or - for bullet points</p>
            </div>
            
            {/* Poll Questions Section */}
            <div className="space-y-3 py-4 border-t border-border/40">
              <div className="flex items-center justify-between">
                <Label>Poll Questions <span className="text-muted-foreground font-normal">(optional)</span></Label>
                {editScenePollQuestions.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditScenePollQuestions([...editScenePollQuestions, {
                      id: crypto.randomUUID(),
                      question: "",
                      question_type: "radio",
                      options: ["", ""],
                      required: false,
                    }])}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Question
                  </Button>
                )}
              </div>
              
              {editScenePollQuestions.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No poll questions added. Click &quot;Add Question&quot; to create a poll for testers.
                </p>
              )}
              
              {editScenePollQuestions.map((q, qIndex) => (
                <div key={q.id} className="p-4 rounded-lg border border-border/40 bg-secondary/30 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Enter your question..."
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...editScenePollQuestions];
                          updated[qIndex].question = e.target.value;
                          setEditScenePollQuestions(updated);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setEditScenePollQuestions(editScenePollQuestions.filter((_, i) => i !== qIndex))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Select
                      value={q.question_type}
                      onValueChange={(value: PollQuestionType) => {
                        const updated = [...editScenePollQuestions];
                        updated[qIndex].question_type = value;
                        setEditScenePollQuestions(updated);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="radio">Single Choice</SelectItem>
                        <SelectItem value="checkbox">Multiple Choice</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => {
                          const updated = [...editScenePollQuestions];
                          updated[qIndex].required = e.target.checked;
                          setEditScenePollQuestions(updated);
                        }}
                        className="rounded"
                      />
                      Required
                    </label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Options</Label>
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
                            const updated = [...editScenePollQuestions];
                            updated[qIndex].options[optIndex] = e.target.value;
                            setEditScenePollQuestions(updated);
                          }}
                        />
                        {q.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              const updated = [...editScenePollQuestions];
                              updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
                              setEditScenePollQuestions(updated);
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
                        const updated = [...editScenePollQuestions];
                        updated[qIndex].options.push("");
                        setEditScenePollQuestions(updated);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Option
                    </Button>
                  </div>
                </div>
              ))}
              
              {editScenePollQuestions.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setEditScenePollQuestions([...editScenePollQuestions, {
                    id: crypto.randomUUID(),
                    question: "",
                    question_type: "radio",
                    options: ["", ""],
                    required: false,
                  }])}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Question
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditSceneDialog(false); setEditScenePollQuestions([]); }}>
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

      {/* Delete Scene Confirmation Dialog */}
      <Dialog open={deleteSceneDialog} onOpenChange={setDeleteSceneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scene?</DialogTitle>
            <DialogDescription className="space-y-1">
              <span className="block">Are you sure you want to delete &quot;{sceneToDelete?.name}&quot;?</span>
              <span className="block">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm">
              <p className="text-destructive font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Warning
              </p>
              <p className="text-muted-foreground mt-1">
                All notes associated with this scene will also be deleted.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteSceneDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteScene}
              disabled={deletingScene}
            >
              {deletingScene && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Scene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tester Confirmation Dialog */}
      <Dialog open={deleteTesterDialog} onOpenChange={setDeleteTesterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Tester?</DialogTitle>
            <DialogDescription className="space-y-1">
              <span className="block">Are you sure you want to remove {testerToDelete?.first_name} {testerToDelete?.last_name}?</span>
              <span className="block">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm">
              <p className="text-destructive font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Warning
              </p>
              <p className="text-muted-foreground mt-1">
                All notes recorded by this tester will also be deleted.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTesterDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTester}
              disabled={deletingTester}
            >
              {deletingTester && <Loader2 className="w-4 h-4 animate-spin" />}
              Remove Tester
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Note Confirmation Dialog */}
      <Dialog open={deleteNoteDialog} onOpenChange={setDeleteNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note?</DialogTitle>
            <DialogDescription className="space-y-1">
              <span className="block">Are you sure you want to delete this note?</span>
              <span className="block">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {noteToDelete && (noteToDelete.edited_transcript || noteToDelete.raw_transcript) && (
              <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                <p className="text-muted-foreground line-clamp-3">
                  {noteToDelete.edited_transcript || noteToDelete.raw_transcript}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="deleteNoteReason">Reason for deletion *</Label>
              <Textarea
                id="deleteNoteReason"
                value={deleteNoteReason}
                onChange={(e) => setDeleteNoteReason(e.target.value)}
                placeholder="e.g., Duplicate note, Test recording, Accidental submission..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteNoteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteNote}
              disabled={deletingNote || !deleteNoteReason.trim()}
            >
              {deletingNote && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Note
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

      {/* End Session Confirmation Dialog */}
      <Dialog open={endSessionDialog} onOpenChange={setEndSessionDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>End Testing Session?</DialogTitle>
            <DialogDescription>
              Choose how you&apos;d like to end this session.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="rounded-lg bg-secondary/50 p-4 text-sm space-y-3">
              <div>
                <p className="font-medium mb-1">Session Summary</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• {session?.notes?.length || 0} notes recorded</li>
                  <li>• {session?.testers?.length || 0} testers participated</li>
                  <li>• {session?.testers?.filter((t) => t.email).length || 0} testers with email addresses</li>
                </ul>
              </div>
            </div>
            {session?.testers?.filter((t) => t.email).length === 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  No testers have email addresses. Reports can only be shared manually.
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => handleEndSession(false)}
                disabled={endingSession || sendingReportEmails}
                className="flex-1 border-primary text-primary hover:bg-primary/10 hover:text-primary"
              >
                {endingSession && <Loader2 className="w-4 h-4 animate-spin" />}
                <Square className="w-4 h-4" />
                Just End Session
              </Button>
              <Button
                onClick={() => handleEndSession(true)}
                disabled={endingSession || sendingReportEmails || (session?.testers?.filter((t) => t.email).length || 0) === 0}
                className="flex-1"
              >
                {sendingReportEmails && <Loader2 className="w-4 h-4 animate-spin" />}
                <Send className="w-4 h-4" />
                End & Send Report
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => setEndSessionDialog(false)}
              disabled={endingSession || sendingReportEmails}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
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

      {/* Skip report email dialog for testers without email */}
      <Dialog open={skipReportEmailDialog} onOpenChange={setSkipReportEmailDialog}>
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
                {reportTestersWithoutEmail.map((t) => (
                  <li key={t.id} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-yellow-500">•</span>
                    {t.first_name} {t.last_name}
                  </li>
                ))}
              </ul>
            </div>
            {reportTestersWithEmail.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {reportTestersWithEmail.length} tester{reportTestersWithEmail.length !== 1 ? 's' : ''} will receive the report.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSkipReportEmailDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendReports(reportTestersWithEmail)}
              disabled={sendingReports || reportTestersWithEmail.length === 0}
            >
              {sendingReports ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {reportTestersWithEmail.length > 0
                ? `Send to ${reportTestersWithEmail.length} tester${reportTestersWithEmail.length !== 1 ? 's' : ''}`
                : 'No emails to send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session AI Summary Dialog */}
      <AISummaryDialog
        sessionId={id}
        sessionName={session.name}
        notesCount={session.notes?.length || 0}
        filteredNotesCount={hasActiveNoteFilters ? filteredNotes.length : undefined}
        open={aiSummaryDialog}
        onOpenChange={setAISummaryDialog}
        existingSummary={session.ai_summary}
        onSummaryApproved={(summary) => {
          setSession({ ...session, ai_summary: summary });
        }}
        filters={hasActiveNoteFilters ? summaryFilters : undefined}
        filterLabels={hasActiveNoteFilters ? summaryFilterLabels : undefined}
      />

      {/* Note-level AI Summary Dialog (from three-dot menu) */}
      {noteAISummaryNote && (
        <NoteAISummaryDialog
          sessionId={id}
          note={noteAISummaryNote}
          open={!!noteAISummaryNote}
          onOpenChange={(open) => !open && setNoteAISummaryNote(null)}
          onNoteUpdated={handleNoteUpdated}
        />
      )}

      {/* Note-level AI Summary View Dialog (from badge click - read only) */}
      {viewSummaryNote && (
        <AISummaryViewDialog
          note={viewSummaryNote}
          open={!!viewSummaryNote}
          onOpenChange={(open) => !open && setViewSummaryNote(null)}
        />
      )}

      {/* Add to Team Dialog */}
      <Dialog open={addToTeamDialog} onOpenChange={setAddToTeamDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Team</DialogTitle>
            <DialogDescription>
              Add {selectedTesterIds.size} selected tester{selectedTesterIds.size !== 1 ? "s" : ""} to an existing team
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {addToTeamLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UsersRound className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm mb-2">No teams available</p>
                <Link href="/admin/teams">
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4" />
                    Create Team
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Select Team</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teams.map((team) => {
                    const allInTeam = areAllSelectedTestersInTeam(team.id);
                    const toAddCount = getTestersToAddCount(team.id);
                    
                    return (
                      <button
                        key={team.id}
                        type="button"
                        disabled={allInTeam}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          allInTeam
                            ? "opacity-50 cursor-not-allowed bg-secondary/30 border-border"
                            : selectedTeamForAdd === team.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => !allInTeam && setSelectedTeamForAdd(team.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{team.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {team.members?.[0]?.count || 0} members
                            </p>
                          </div>
                          {allInTeam ? (
                            <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded">
                              All added
                            </span>
                          ) : toAddCount < selectedTesterIds.size ? (
                            <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded">
                              {toAddCount} new
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddToTeamDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToTeam}
              disabled={addingToTeam || !selectedTeamForAdd || addToTeamLoading}
            >
              {addingToTeam && <Loader2 className="w-4 h-4 animate-spin" />}
              Add to Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={editSessionDialog} onOpenChange={setEditSessionDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update the session details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSessionName">Session Name *</Label>
              <Input
                id="editSessionName"
                value={editSessionName}
                onChange={(e) => setEditSessionName(e.target.value)}
                placeholder="e.g., Sprint 24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSessionDescription">Description</Label>
              <Textarea
                id="editSessionDescription"
                value={editSessionDescription}
                onChange={(e) => setEditSessionDescription(e.target.value)}
                placeholder="Brief description of what's being tested..."
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSessionBuildVersion">Build / Version</Label>
              <Input
                id="editSessionBuildVersion"
                value={editSessionBuildVersion}
                onChange={(e) => setEditSessionBuildVersion(e.target.value)}
                placeholder="e.g., v2.1.0"
              />
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Issue Checkboxes
              </Label>
              <p className="text-xs text-muted-foreground">
                Quick checkboxes for common issues testers can report
              </p>
              {editSessionIssueOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editSessionIssueOptions.map((option) => (
                    <div
                      key={option}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm"
                    >
                      <span>{option}</span>
                      <button
                        type="button"
                        onClick={() => removeEditIssueOption(option)}
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
                      addEditIssueOption(newIssueOption);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addEditIssueOption(newIssueOption)}
                  disabled={!newIssueOption.trim()}
                >
                  Add
                </Button>
              </div>
              {editSessionIssueOptions.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Quick add common issues:</p>
                  <div className="flex flex-wrap gap-2">
                    {defaultIssueOptions.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addEditIssueOption(option)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {editSessionIssueOptions.length > 0 && defaultIssueOptions.some(option => !editSessionIssueOptions.includes(option)) && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Add more:</p>
                  <div className="flex flex-wrap gap-2">
                    {defaultIssueOptions
                      .filter((option) => !editSessionIssueOptions.includes(option))
                      .map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addEditIssueOption(option)}
                          className="text-xs h-7"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {option}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditSessionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSession}
              disabled={savingSession || !editSessionName.trim()}
            >
              {savingSession && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
