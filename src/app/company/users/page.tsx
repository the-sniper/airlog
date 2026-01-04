"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  Mail,
  Search,
  Loader2,
  RefreshCw,
  Clock,
  Check,
  X,
  Send,
  Trash2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  join_method?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export default function CompanyMembersPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("members");

  // Dialog states
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });
  const [cancelInviteDialog, setCancelInviteDialog] = useState<{
    open: boolean;
    invite: PendingInvite | null;
  }>({ open: false, invite: null });

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/company/users");
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  }, []);

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/company/users/invite");
      if (res.ok) {
        setPendingInvites(await res.json());
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchMembers(), fetchInvites()]);
      setLoading(false);
    }
    loadData();
  }, [fetchMembers, fetchInvites]);

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.first_name.toLowerCase().includes(query) ||
      member.last_name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteError("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    setInviteError(null);

    try {
      const res = await fetch("/api/company/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      const result = await res.json();

      if (result.already_member) {
        toast({
          title: "Already a member",
          description: `${result.user.first_name} ${result.user.last_name} is already in your company.`,
        });
      } else if (result.already_registered) {
        toast({
          title: "User added!",
          description: `${result.user.first_name} ${result.user.last_name} has been added to your company.`,
          variant: "success",
        });
        fetchMembers();
      } else if (res.status === 409) {
        setInviteError(
          result.error || "An invite is already pending for this email"
        );
        return;
      } else if (res.ok) {
        if (result.emailSent === false) {
          toast({
            title: "Invite created",
            description: `Invite created but email failed. Share the link manually: /invite/${result.invite?.token}`,
          });
        } else {
          toast({
            title: "Invite sent!",
            description: `Signup invitation sent to ${inviteEmail.trim()}`,
            variant: "success",
          });
        }
        fetchInvites();
      } else {
        setInviteError(result.error || "Failed to send invite");
        return;
      }

      setInviteDialog(false);
      setInviteEmail("");
    } catch (error) {
      console.error("Error inviting user:", error);
      setInviteError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember() {
    if (!removeDialog.user) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/company/users/${removeDialog.user.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "User removed",
          description: `${removeDialog.user.first_name} ${removeDialog.user.last_name} has been removed from your company.`,
          variant: "success",
        });
        fetchMembers();
        setRemoveDialog({ open: false, user: null });
      } else {
        const result = await res.json();
        toast({
          title: "Error",
          description: result.error || "Failed to remove member",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelInvite() {
    if (!cancelInviteDialog.invite) return;
    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/company/users/invite?id=${cancelInviteDialog.invite.id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        toast({
          title: "Invite cancelled",
          description: `Invite to ${cancelInviteDialog.invite.email} has been cancelled.`,
          variant: "success",
        });
        fetchInvites();
        setCancelInviteDialog({ open: false, invite: null });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendInvite(invite: PendingInvite) {
    try {
      const res = await fetch("/api/company/users/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invite.id }),
      });

      const result = await res.json();

      if (res.ok) {
        if (result.emailSent === false) {
          toast({
            title: "Invite refreshed",
            description: "New link generated but email failed to send.",
          });
        } else {
          toast({
            title: "Invite resent!",
            description: `A new invite email has been sent to ${invite.email}`,
            variant: "success",
          });
        }
        fetchInvites();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to resend invite",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resending invite:", error);
    }
  }

  function isExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date();
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-16 rounded-lg bg-muted/30" />
        <div className="h-96 rounded-xl bg-secondary/30" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Company Users</h1>
            <p className="text-muted-foreground">
              Manage users in your company
            </p>
          </div>
        </div>
        <Button onClick={() => setInviteDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="members" className="gap-2">
            <Users className="w-4 h-4" />
            Users ({members.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingInvites.length})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Active Users</CardTitle>
                  <CardDescription>
                    Users who are part of your company
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">
                    {searchQuery ? "No users found" : "No users yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery
                      ? "Try a different search term"
                      : "Invite users to join your company"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setInviteDialog(true)} size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite User
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.first_name[0]}
                            {member.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {member.first_name} {member.last_name}
                            </p>
                            {member.join_method && (
                              <Badge
                                variant="secondary"
                                className={`text-[10px] h-5 px-1.5 font-normal ${
                                  member.join_method === "invite"
                                    ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                    : member.join_method === "admin_add"
                                    ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {member.join_method === "invite"
                                  ? "Invited"
                                  : member.join_method === "admin_add"
                                  ? "Added by Admin"
                                  : "Self Signup"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        onClick={() =>
                          setRemoveDialog({ open: true, user: member })
                        }
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Invites Tab */}
        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Pending Invites</CardTitle>
                  <CardDescription>
                    Users who have been invited but haven&apos;t registered yet
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchInvites}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingInvites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No pending invites</h3>
                  <p className="text-sm text-muted-foreground">
                    Invited users will appear here until they register
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingInvites.map((invite) => {
                    const expired = isExpired(invite.expires_at);
                    return (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{invite.email}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>
                                Invited {formatDate(invite.created_at)}
                              </span>
                              {expired ? (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Expired
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Expires {formatDate(invite.expires_at)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvite(invite)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            {expired ? "Resend" : "Refresh"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              setCancelInviteDialog({ open: true, invite })
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Invite a user to join your company. They&apos;ll receive a link to
              register.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                }}
                placeholder="someone@example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInvite();
                  }
                }}
              />
            </div>
            {inviteError && (
              <p className="text-sm text-destructive">{inviteError}</p>
            )}
            <div className="rounded-lg bg-secondary/30 p-4 text-sm text-muted-foreground">
              <p>
                If the user is already registered, they&apos;ll be added to your
                company immediately. Otherwise, they&apos;ll receive a signup
                link.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog
        open={removeDialog.open}
        onOpenChange={(o) => setRemoveDialog({ open: o, user: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {removeDialog.user?.first_name} {removeDialog.user?.last_name}
              </strong>{" "}
              from your company? They will no longer have access to company
              resources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRemoveDialog({ open: false, user: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Invite Dialog */}
      <Dialog
        open={cancelInviteDialog.open}
        onOpenChange={(o) => setCancelInviteDialog({ open: o, invite: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invite</DialogTitle>
            <DialogDescription>
              Cancel the pending invite for{" "}
              <strong>{cancelInviteDialog.invite?.email}</strong>? They will no
              longer be able to use the invite link.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() =>
                setCancelInviteDialog({ open: false, invite: null })
              }
            >
              Keep Invite
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelInvite}
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Cancel Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
