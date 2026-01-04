"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users2,
  FolderKanban,
  Shield,
  Crown,
  UserPlus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Settings,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import { TeamsManager } from "@/components/admin/teams-manager";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface CompanyAdmin {
  id: string;
  role: string;
  created_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface CompanyTeam {
  id: string;
  name: string;
  invite_token: string;
  created_at: string;
  members: { count: number }[];
}

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_tier: string;
  max_teams: number;
  max_sessions_per_month: number;
  is_active: boolean;
  created_at: string;
  admins: CompanyAdmin[];
  teams: CompanyTeam[];
  sessions: { count: number }[];
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    company_admin: { role: string }[];
  }[];
}

export default function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    is_active: true,
    subscription_tier: "free",
    max_teams: 3,
    max_sessions_per_month: 10,
  });

  // Add admin state
  const [addAdminDialog, setAddAdminDialog] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "admin" as "owner" | "admin",
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminError, setAdminError] = useState("");

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/companies/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
        setSettingsForm({
          name: data.name,
          is_active: data.is_active,
          subscription_tier: data.subscription_tier,
          max_teams: data.max_teams,
          max_sessions_per_month: data.max_sessions_per_month,
        });
      } else {
        router.push("/admin/companies");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchCompany();
    setRefreshing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/companies/${params.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast({ title: "Company deleted", variant: "success" });
      router.push("/admin/companies");
    } else {
      toast({ title: "Failed to delete company", variant: "destructive" });
    }
    setDeleting(false);
  }

  async function handleSaveSettings() {
    setSaving(true);
    const res = await fetch(`/api/admin/companies/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsForm),
    });
    if (res.ok) {
      toast({ title: "Settings saved", variant: "success" });
      setSettingsDialog(false);
      fetchCompany();
    } else {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleAddAdmin() {
    if (
      !adminForm.email.trim() ||
      !adminForm.first_name.trim() ||
      !adminForm.last_name.trim() ||
      !adminForm.password
    ) {
      setAdminError("All fields are required");
      return;
    }
    if (adminForm.password.length < 8) {
      setAdminError("Password must be at least 8 characters");
      return;
    }
    setAdminError("");
    setAddingAdmin(true);
    try {
      const res = await fetch(`/api/admin/companies/${params.id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });
      if (res.ok) {
        toast({ title: "Admin added!", variant: "success" });
        setAddAdminDialog(false);
        setAdminForm({
          email: "",
          first_name: "",
          last_name: "",
          password: "",
          role: "admin",
        });
        setShowAdminPassword(false);
        fetchCompany();
      } else {
        const data = await res.json();
        setAdminError(data.error || "Failed to add admin");
      }
    } finally {
      setAddingAdmin(false);
    }
  }

  async function handleRemoveAdmin(adminId: string) {
    const res = await fetch(
      `/api/admin/companies/${params.id}/admins?adminId=${adminId}`,
      {
        method: "DELETE",
      }
    );
    if (res.ok) {
      toast({ title: "Admin removed", variant: "success" });
      fetchCompany();
    } else {
      const data = await res.json();
      toast({
        title: data.error || "Failed to remove admin",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-64 rounded-lg bg-secondary/30" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-secondary/30" />
          ))}
        </div>
        <div className="h-96 rounded-xl bg-secondary/30" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold mb-2">Company not found</h2>
        <Link href="/admin/companies">
          <Button>Back to Companies</Button>
        </Link>
      </div>
    );
  }

  const adminCount = company.admins?.length || 0;
  const teamCount = company.teams?.length || 0;
  const sessionCount = company.sessions?.[0]?.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/companies">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{company.name}</h1>
                <Badge variant={company.is_active ? "active" : "secondary"}>
                  {company.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                /{company.slug}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="outline" onClick={() => setSettingsDialog(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamCount}</p>
                <p className="text-sm text-muted-foreground">Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessionCount}</p>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Badge
                  variant="outline"
                  className="text-amber-500 border-amber-500/30 capitalize"
                >
                  {company.subscription_tier}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Plan Limits</p>
                <p className="text-xs text-muted-foreground">
                  {company.max_teams} teams, {company.max_sessions_per_month}/mo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams ({teamCount})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({adminCount})</TabsTrigger>
          <TabsTrigger value="users">
            Users ({company.users?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDate(company.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {company.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subscription</p>
                  <p className="font-medium capitalize">
                    {company.subscription_tier}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Team Limit</p>
                  <p className="font-medium">{company.max_teams}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Deleting a company will remove all associated admins, teams, and
                sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Company
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TeamsManager companyId={company.id} />
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Company Admins</h3>
            <Button onClick={() => setAddAdminDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </div>

          {company.admins.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  No admins in this company
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {company.admins.map((admin) => (
                <Card key={admin.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {admin.user.first_name?.[0]}
                          {admin.user.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {admin.user.first_name} {admin.user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {admin.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-auto">
                        <Badge
                          variant="secondary"
                          className={
                            admin.role === "owner"
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                              : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/25"
                          }
                        >
                          {admin.role === "owner" ? (
                            <Crown className="w-3 h-3 mr-1" />
                          ) : (
                            <Shield className="w-3 h-3 mr-1" />
                          )}
                          {admin.role === "owner" ? "Owner" : "Admin"}
                        </Badge>
                        {admin.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveAdmin(admin.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Users</h3>
          </div>

          <Card>
            {company.users && company.users.length > 0 ? (
              <div className="space-y-2">
                {company.users.map((user) => {
                  const userRole = user.company_admin?.[0]?.role;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                          {user.first_name?.[0]}
                          {user.last_name?.[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            {userRole && (
                              <Badge
                                variant="secondary"
                                className={
                                  userRole === "owner"
                                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                                    : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/25"
                                }
                              >
                                {userRole === "owner" ? (
                                  <Crown className="w-3 h-3 mr-1" />
                                ) : (
                                  <Shield className="w-3 h-3 mr-1" />
                                )}
                                {userRole === "owner" ? "Owner" : "Admin"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users2 className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No users found</h3>
                <p className="text-sm text-muted-foreground">
                  No users have joined this company yet
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{company.name}&quot;? This
              will permanently remove all associated admins, teams, and
              sessions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Company Settings</DialogTitle>
            <DialogDescription>
              Update company details and subscription limits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={settingsForm.name}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, name: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={settingsForm.is_active}
                onCheckedChange={(checked) =>
                  setSettingsForm({ ...settingsForm, is_active: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Subscription Tier</Label>
              <Select
                value={settingsForm.subscription_tier}
                onValueChange={(value) =>
                  setSettingsForm({ ...settingsForm, subscription_tier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_teams">Max Teams</Label>
                <Input
                  id="max_teams"
                  type="number"
                  value={settingsForm.max_teams}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      max_teams: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_sessions">Sessions/Month</Label>
                <Input
                  id="max_sessions"
                  type="number"
                  value={settingsForm.max_sessions_per_month}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      max_sessions_per_month: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog
        open={addAdminDialog}
        onOpenChange={(open) => {
          setAddAdminDialog(open);
          if (!open) {
            setAdminError("");
            setShowAdminPassword(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company Admin</DialogTitle>
            <DialogDescription>
              Create a new admin account for {company.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-first-name">First Name</Label>
                <Input
                  id="admin-first-name"
                  value={adminForm.first_name}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, first_name: e.target.value })
                  }
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-last-name">Last Name</Label>
                <Input
                  id="admin-last-name"
                  value={adminForm.last_name}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, last_name: e.target.value })
                  }
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminForm.email}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, email: e.target.value })
                }
                placeholder="admin@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showAdminPassword ? "text" : "password"}
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showAdminPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={adminForm.role}
                onValueChange={(value: "owner" | "admin") =>
                  setAdminForm({ ...adminForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">
                    Owner (Full access + manage managers)
                  </SelectItem>
                  <SelectItem value="admin">
                    Manager (Manage sessions & teams)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {adminError && (
              <p className="text-sm text-destructive">{adminError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddAdminDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={addingAdmin}>
              {addingAdmin && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
