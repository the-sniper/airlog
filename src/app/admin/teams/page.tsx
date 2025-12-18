"use client";
import { useEffect, useState } from "react";
import { Plus, Users, Trash2, Pencil, Loader2, ChevronRight, UserPlus, Link2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Team, TeamMember, TeamWithMembers } from "@/types";

interface TeamWithCount extends Team {
  members: { count: number }[];
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Dialog states
  const [createTeamDialog, setCreateTeamDialog] = useState(false);
  const [editTeamDialog, setEditTeamDialog] = useState<{ open: boolean; team: Team | null }>({ open: false, team: null });
  const [deleteTeamDialog, setDeleteTeamDialog] = useState<{ open: boolean; team: Team | null }>({ open: false, team: null });
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [editMemberDialog, setEditMemberDialog] = useState<{ open: boolean; member: TeamMember | null }>({ open: false, member: null });
  const [deleteMemberDialog, setDeleteMemberDialog] = useState<{ open: boolean; member: TeamMember | null }>({ open: false, member: null });

  // Form states
  const [newTeamName, setNewTeamName] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [memberForm, setMemberForm] = useState({ first_name: "", last_name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
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

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName.trim() }),
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
      const res = await fetch(`/api/teams/${deleteTeamDialog.team.id}`, { method: "DELETE" });
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

  async function handleAddMember() {
    if (!selectedTeam || !memberForm.first_name.trim() || !memberForm.last_name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: memberForm.first_name,
          last_name: memberForm.last_name,
          email: memberForm.email.trim() || null,
        }),
      });
      if (res.ok) {
        setAddMemberDialog(false);
        setMemberForm({ first_name: "", last_name: "", email: "" });
        fetchTeamDetails(selectedTeam.id);
        fetchTeams();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditMember() {
    if (!selectedTeam || !editMemberDialog.member || !memberForm.first_name.trim() || !memberForm.last_name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members/${editMemberDialog.member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: memberForm.first_name,
          last_name: memberForm.last_name,
          email: memberForm.email.trim() || null,
        }),
      });
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
      const res = await fetch(`/api/teams/${selectedTeam.id}/members/${deleteMemberDialog.member.id}`, {
        method: "DELETE",
      });
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
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-secondary rounded" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 bg-secondary rounded-xl" />
          <div className="h-64 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage team templates for testing sessions</p>
        </div>
        <Button onClick={() => setCreateTeamDialog(true)}>
          <Plus className="w-4 h-4" />
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
                <p className="text-sm text-muted-foreground mb-4">Create a team to add members</p>
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
                        <p className="text-xs text-muted-foreground">
                          {team.members?.[0]?.count || 0} member{(team.members?.[0]?.count || 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
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
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTeamDialog({ open: true, team });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedTeam ? selectedTeam.name : "Team Members"}
              </CardTitle>
              {selectedTeam && (
                <Button size="sm" onClick={() => setAddMemberDialog(true)}>
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </Button>
              )}
            </div>
            {/* Invite Link Section */}
            {selectedTeam?.invite_token && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Invite Link</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/teams/join/${selectedTeam.invite_token}`}
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !selectedTeam ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">Select a team to view members</p>
              </div>
            ) : selectedTeam.members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserPlus className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No members yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Add team members to this team</p>
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
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={() => {
                          setMemberForm({
                            first_name: member.first_name,
                            last_name: member.last_name,
                            email: member.email ?? "",
                          });
                          setEditMemberDialog({ open: true, member });
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => setDeleteMemberDialog({ open: true, member })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={createTeamDialog} onOpenChange={setCreateTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>Create a new team to organize testers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g., QA Team, Beta Testers"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTeam();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateTeamDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={submitting || !newTeamName.trim()}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editTeamDialog.open} onOpenChange={(o) => setEditTeamDialog({ open: o, team: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update the team name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditTeam();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTeamDialog({ open: false, team: null })}>
              Cancel
            </Button>
            <Button onClick={handleEditTeam} disabled={submitting || !editTeamName.trim()}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <Dialog open={deleteTeamDialog.open} onOpenChange={(o) => setDeleteTeamDialog({ open: o, team: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTeamDialog.team?.name}&quot;? This will also remove all team members.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTeamDialog({ open: false, team: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialog} onOpenChange={setAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a new member to {selectedTeam?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name *</Label>
                <Input
                  id="first-name"
                  value={memberForm.first_name}
                  onChange={(e) => setMemberForm({ ...memberForm, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name *</Label>
                <Input
                  id="last-name"
                  value={memberForm.last_name}
                  onChange={(e) => setMemberForm({ ...memberForm, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="email"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="john.doe@example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddMember();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setAddMemberDialog(false);
                setMemberForm({ first_name: "", last_name: "", email: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={submitting || !memberForm.first_name.trim() || !memberForm.last_name.trim()}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editMemberDialog.open} onOpenChange={(o) => setEditMemberDialog({ open: o, member: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update member details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">First Name *</Label>
                <Input
                  id="edit-first-name"
                  value={memberForm.first_name}
                  onChange={(e) => setMemberForm({ ...memberForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Last Name *</Label>
                <Input
                  id="edit-last-name"
                  value={memberForm.last_name}
                  onChange={(e) => setMemberForm({ ...memberForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="edit-email"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditMember();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setEditMemberDialog({ open: false, member: null });
                setMemberForm({ first_name: "", last_name: "", email: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditMember}
              disabled={submitting || !memberForm.first_name.trim() || !memberForm.last_name.trim()}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Dialog */}
      <Dialog open={deleteMemberDialog.open} onOpenChange={(o) => setDeleteMemberDialog({ open: o, member: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {deleteMemberDialog.member?.first_name} {deleteMemberDialog.member?.last_name} from the team?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteMemberDialog({ open: false, member: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
