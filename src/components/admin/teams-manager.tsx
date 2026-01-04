"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Users,
  Trash2,
  Pencil,
  Loader2,
  ChevronRight,
  UserPlus,
  Link2,
  Copy,
  Check,
  RefreshCw,
  MoreVertical,
  Building2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { UserSelect, type UserOption } from "@/components/ui/user-select";
import type { Team, TeamMember, TeamWithMembers } from "@/types";

interface TeamWithCount extends Team {
  members: { count: number }[];
  company?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface TeamsManagerProps {
  companyId?: string;
  className?: string;
}

export function TeamsManager({ companyId, className }: TeamsManagerProps) {
  const { toast } = useToast();
  const [teams, setTeams] = useState<TeamWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(
    null
  );
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Dialog states
  const [createTeamDialog, setCreateTeamDialog] = useState(false);
  const [editTeamDialog, setEditTeamDialog] = useState<{
    open: boolean;
    team: Team | null;
  }>({ open: false, team: null });
  const [deleteTeamDialog, setDeleteTeamDialog] = useState<{
    open: boolean;
    team: Team | null;
  }>({ open: false, team: null });
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [editMemberDialog, setEditMemberDialog] = useState<{
    open: boolean;
    member: TeamMember | null;
  }>({ open: false, member: null });
  const [deleteMemberDialog, setDeleteMemberDialog] = useState<{
    open: boolean;
    member: TeamMember | null;
  }>({ open: false, member: null });

  // Form states
  const [newTeamName, setNewTeamName] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [memberForm, setMemberForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Add member tab and form states
  const [memberTab, setMemberTab] = useState<"users" | "invite">("users");
  const [selectedUsersForMember, setSelectedUsersForMember] = useState<
    UserOption[]
  >([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Assign to company state (only used if companyId is NOT provided)
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const [assignCompanyDialog, setAssignCompanyDialog] = useState<{
    open: boolean;
    team: TeamWithCount | null;
  }>({ open: false, team: null });
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [assigningCompany, setAssigningCompany] = useState(false);

  useEffect(() => {
    fetchTeams();
    if (!companyId) {
      fetchCompanies();
    }
  }, [companyId]);

  async function fetchTeams() {
    try {
      let url = "/api/teams";
      if (companyId) {
        url += `?company_id=${companyId}`;
      }
      const res = await fetch(url);
      if (res.ok) setTeams(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeamDetails(teamId: string) {
    setLoadingTeam(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) setSelectedTeam(await res.json());
    } finally {
      setLoadingTeam(false);
    }
  }

  async function fetchCompanies() {
    try {
      const res = await fetch("/api/admin/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(
          data.map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }

  async function handleAssignToCompany() {
    if (!assignCompanyDialog.team || !selectedCompany) return;
    setAssigningCompany(true);
    try {
      const res = await fetch(`/api/admin/companies/${selectedCompany}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: assignCompanyDialog.team.id }),
      });
      if (res.ok) {
        toast({ title: "Team assigned to company!", variant: "success" });
        setAssignCompanyDialog({ open: false, team: null });
        setSelectedCompany("");
        fetchTeams();
      } else {
        toast({ title: "Failed to assign team", variant: "destructive" });
      }
    } finally {
      setAssigningCompany(false);
    }
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    setSubmitting(true);
    try {
      const body: any = { name: newTeamName.trim() };
      if (companyId) {
        body.company_id = companyId;
      }

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const team = await res.json();
        setCreateTeamDialog(false);
        setNewTeamName("");
        fetchTeams();
        fetchTeamDetails(team.id);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditTeam() {
    if (!editTeamDialog.team || !editTeamName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${editTeamDialog.team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editTeamName.trim() }),
      });
      if (res.ok) {
        setEditTeamDialog({ open: false, team: null });
        setEditTeamName("");
        fetchTeams();
        if (selectedTeam?.id === editTeamDialog.team.id) {
          fetchTeamDetails(editTeamDialog.team.id);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTeam() {
    if (!deleteTeamDialog.team) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${deleteTeamDialog.team.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTeamDialog({ open: false, team: null });
        if (selectedTeam?.id === deleteTeamDialog.team.id) {
          setSelectedTeam(null);
        }
        fetchTeams();
      }
    } finally {
      setSubmitting(false);
    }
  }
  function resetMemberDialog() {
    setAddMemberDialog(false);
    setMemberTab("users");
    setSelectedUsersForMember([]);
    setInviteEmail("");
    setInviteError(null);
    setMemberForm({ first_name: "", last_name: "", email: "" });
  }

  async function handleAddUsersAsMember() {
    if (!selectedTeam || selectedUsersForMember.length === 0) return;
    setSubmitting(true);
    try {
      // Add each selected user as a team member
      const membersToAdd = selectedUsersForMember.map((user) => ({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        user_id: user.id,
      }));

      const res = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testers: membersToAdd }),
      });

      if (res.ok) {
        const result = await res.json();
        const addedCount = result.added || result.data?.length || 0;

        if (addedCount > 0) {
          toast({
            title: "Members added!",
            description: `Successfully added ${addedCount} member${
              addedCount > 1 ? "s" : ""
            }.`,
            variant: "success",
          });
        } else {
          toast({
            title: "No members added",
            description:
              result.message ||
              "Selected users are already members of this team.",
          });
        }
        resetMemberDialog();
        fetchTeamDetails(selectedTeam.id);
        fetchTeams();
      } else {
        toast({
          title: "Error",
          description: "Failed to add members. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMemberInviteByEmail() {
    if (!selectedTeam || !inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }

    const normalizedEmail = inviteEmail.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setInviteError("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    setInviteError(null);

    try {
      // Check if user is already registered via the pending invites API
      const res = await fetch("/api/admin/pending-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          invite_type: "team",
          target_id: selectedTeam.id,
        }),
      });

      const result = await res.json();

      if (result.already_registered) {
        // User is registered - add them directly as a team member
        const addRes = await fetch(`/api/teams/${selectedTeam.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testers: [
              {
                first_name: result.user.first_name,
                last_name: result.user.last_name,
                email: result.user.email,
                user_id: result.user.id,
              },
            ],
          }),
        });

        if (addRes.ok) {
          toast({
            title: "Member added!",
            description: `${result.user.first_name} ${result.user.last_name} has been added to the team.`,
            variant: "success",
          });
          resetMemberDialog();
          fetchTeamDetails(selectedTeam.id);
          fetchTeams();
        } else {
          setInviteError(
            "Failed to add member. They may already be in this team."
          );
        }
      } else if (res.status === 409) {
        // Invite already pending
        setInviteError("An invite is already pending for this email");
      } else if (res.ok) {
        // Pending invite created successfully
        toast({
          title: "Invite sent!",
          description: `Signup invitation sent to ${normalizedEmail}. They will be added when they register.`,
          variant: "success",
        });
        resetMemberDialog();
      } else {
        setInviteError(result.error || "Failed to send invite");
      }
    } catch (error) {
      console.error("Error inviting by email:", error);
      setInviteError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditMember() {
    if (
      !selectedTeam ||
      !editMemberDialog.member ||
      !memberForm.first_name.trim() ||
      !memberForm.last_name.trim()
    )
      return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/teams/${selectedTeam.id}/members/${editMemberDialog.member.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: memberForm.first_name,
            last_name: memberForm.last_name,
            email: memberForm.email.trim() || null,
          }),
        }
      );
      if (res.ok) {
        setEditMemberDialog({ open: false, member: null });
        setMemberForm({ first_name: "", last_name: "", email: "" });
        fetchTeamDetails(selectedTeam.id);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteMember() {
    if (!selectedTeam || !deleteMemberDialog.member) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/teams/${selectedTeam.id}/members/${deleteMemberDialog.member.id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setDeleteMemberDialog({ open: false, member: null });
        fetchTeamDetails(selectedTeam.id);
        fetchTeams();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 rounded-xl bg-secondary/30" />
          <div className="h-80 rounded-xl bg-secondary/30" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Title and Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <h2 className="text-xl font-bold">Teams</h2>
          <p className="text-muted-foreground text-sm">
            Manage team templates and members
          </p>
        </div>

        {/* Mobile Button (Outline, Green) */}
        <Button
          onClick={() => setCreateTeamDialog(true)}
          className="sm:hidden w-full text-primary border-primary hover:bg-primary/10 hover:text-primary"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Team
        </Button>
        {/* Desktop Button (Filled, Default) */}
        <Button
          onClick={() => setCreateTeamDialog(true)}
          className="hidden sm:flex"
          variant="default"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Team
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Teams List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Teams</CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No teams yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a team to add members
                </p>
                <Button onClick={() => setCreateTeamDialog(true)} size="sm">
                  <Plus className="w-4 h-4" />
                  Create Team
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group ${
                      selectedTeam?.id === team.id
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-secondary/50 hover:bg-secondary"
                    }`}
                    onClick={() => fetchTeamDetails(team.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {team.members?.[0]?.count || 0} member
                            {(team.members?.[0]?.count || 0) !== 1 ? "s" : ""}
                          </span>
                          {!companyId && team.company && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {team.company.name}
                              </span>
                            </>
                          )}
                          {!companyId && !team.company && (
                            <>
                              <span>•</span>
                              <span className="text-amber-500">Legacy</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 hidden sm:inline-flex"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTeamName(team.name);
                          setEditTeamDialog({ open: true, team });
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hidden sm:inline-flex"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTeamDialog({ open: true, team });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {!companyId && !team.company && companies.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 opacity-0 group-hover:opacity-100 text-primary hidden sm:inline-flex"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignCompanyDialog({ open: true, team });
                          }}
                        >
                          <Building2 className="w-4 h-4 mr-1" />
                          Assign
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:hidden"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Team options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          sideOffset={4}
                          className="w-32 sm:hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditTeamName(team.name);
                              setEditTeamDialog({ open: true, team });
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTeamDialog({ open: true, team });
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                          {!companyId &&
                            !team.company &&
                            companies.length > 0 && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssignCompanyDialog({ open: true, team });
                                }}
                              >
                                <Building2 className="w-4 h-4 mr-2" />
                                Assign to Company
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Details */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {selectedTeam && (
                <div className="flex items-center gap-2 justify-end sm:order-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => fetchTeamDetails(selectedTeam.id)}
                    disabled={loadingTeam}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loadingTeam ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Button size="sm" onClick={() => setAddMemberDialog(true)}>
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </Button>
                </div>
              )}
              <CardTitle className="text-lg sm:order-1">
                {selectedTeam ? selectedTeam.name : "Team Members"}
              </CardTitle>
            </div>
            {/* Invite Link Section */}
            {selectedTeam?.invite_token && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Invite Link
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${
                      typeof window !== "undefined"
                        ? window.location.origin
                        : ""
                    }/teams/join/${selectedTeam.invite_token}`}
                    className="text-xs font-mono bg-secondary/50 h-9"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-9"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/teams/join/${selectedTeam.invite_token}`
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this link with team members to let them register
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loadingTeam ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted/40 rounded" />
                      <div className="h-3 w-40 bg-muted/30 rounded" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-8 bg-muted/30 rounded-lg" />
                      <div className="w-8 h-8 bg-muted/30 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !selectedTeam ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Select a team to view members
                </p>
              </div>
            ) : selectedTeam.members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserPlus className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No members yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add team members to this team
                </p>
                <Button onClick={() => setAddMemberDialog(true)} size="sm">
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedTeam.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group"
                  >
                    <div>
                      <p className="font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hidden sm:inline-flex"
                        onClick={() =>
                          setDeleteMemberDialog({ open: true, member })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:hidden"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Member options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          sideOffset={4}
                          className="w-32 sm:hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              setDeleteMemberDialog({ open: true, member })
                            }
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {/* Create Team Dialog */}
      <Dialog open={createTeamDialog} onOpenChange={setCreateTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team template. You can add members after creating it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="e.g. Core Team"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateTeamDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={submitting || !newTeamName.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog
        open={editTeamDialog.open}
        onOpenChange={(open) =>
          setEditTeamDialog({ open, team: open ? editTeamDialog.team : null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Change the team name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Team Name</Label>
              <Input
                id="edit-name"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditTeamDialog({ open: false, team: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditTeam}
              disabled={submitting || !editTeamName.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <Dialog
        open={deleteTeamDialog.open}
        onOpenChange={(open) =>
          setDeleteTeamDialog({
            open,
            team: open ? deleteTeamDialog.team : null,
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTeamDialog.team?.name}?
              This action cannot be undone and will remove all members from this
              team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTeamDialog({ open: false, team: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog (with tabs for Users vs Invite) */}
      <Dialog open={addMemberDialog} onOpenChange={resetMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add existing users or invite new ones via email.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 mb-4">
            <Button
              variant={memberTab === "users" ? "default" : "outline"}
              size="sm"
              onClick={() => setMemberTab("users")}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              Existing Users
            </Button>
            <Button
              variant={memberTab === "invite" ? "default" : "outline"}
              size="sm"
              onClick={() => setMemberTab("invite")}
              className="flex-1"
            >
              <Mail className="w-4 h-4 mr-2" />
              Invite by Email
            </Button>
          </div>

          {memberTab === "users" ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Users</Label>
                <UserSelect
                  onSelect={setSelectedUsersForMember}
                  selectedUsers={selectedUsersForMember}
                />
                <p className="text-xs text-muted-foreground">
                  Search and select users to add to this team.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  placeholder="colleague@example.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError(null);
                  }}
                  className={inviteError ? "border-destructive" : ""}
                />
                {inviteError && (
                  <p className="text-sm text-destructive">{inviteError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  We&apos;ll send an invite link to this email address.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={resetMemberDialog}>
              Cancel
            </Button>
            {memberTab === "users" ? (
              <Button
                onClick={handleAddUsersAsMember}
                disabled={submitting || selectedUsersForMember.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Members"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleMemberInviteByEmail}
                disabled={submitting || !inviteEmail.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invite"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Company Dialog - Only if no companyId provided */}
      {!companyId && (
        <Dialog
          open={assignCompanyDialog.open}
          onOpenChange={(open) =>
            setAssignCompanyDialog({
              open,
              team: open ? assignCompanyDialog.team : null,
            })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign to Company</DialogTitle>
              <DialogDescription>
                Assign &quot;{assignCompanyDialog.team?.name}&quot; to a
                company.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Company</Label>
                <Select
                  value={selectedCompany}
                  onValueChange={setSelectedCompany}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() =>
                  setAssignCompanyDialog({ open: false, team: null })
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignToCompany}
                disabled={assigningCompany || !selectedCompany}
              >
                {assigningCompany ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Member Dialog */}
      <Dialog
        open={deleteMemberDialog.open}
        onOpenChange={(open) =>
          setDeleteMemberDialog({
            open,
            member: open ? deleteMemberDialog.member : null,
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              {deleteMemberDialog.member?.first_name}{" "}
              {deleteMemberDialog.member?.last_name} from this team?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() =>
                setDeleteMemberDialog({ open: false, member: null })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMember}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
