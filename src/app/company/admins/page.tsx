"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Crown,
  Lock,
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
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/components/ui/use-toast";

interface CompanyAdmin {
  id: string;
  role: "owner" | "admin";
  created_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface CurrentAdmin {
  id: string;
  role: "owner" | "admin";
  company: {
    name: string;
  };
}

export default function CompanyAdminsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<CompanyAdmin[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add admin dialog
  const [addDialog, setAddDialog] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "admin" as "owner" | "admin",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    admin: CompanyAdmin | null;
  }>({ open: false, admin: null });
  const [deleting, setDeleting] = useState(false);

  const fetchCurrentAdmin = useCallback(async () => {
    try {
      const res = await fetch("/api/company/auth/me");
      if (res.ok) {
        const data = await res.json();
        // Transform API response to CurrentAdmin shape
        const adminData = {
          id: data.admin.id,
          role: data.admin.role,
          company: data.company,
        };
        setCurrentAdmin(adminData);

        // If not owner, redirect to dashboard
        if (data.admin.role !== "owner") {
          router.push("/company");
        }
      } else {
        router.push("/company/login");
      }
    } catch {
      router.push("/company/login");
    }
  }, [router]);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/company/admins");
      if (res.ok) {
        setAdmins(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentAdmin();
    fetchAdmins();
  }, [fetchCurrentAdmin, fetchAdmins]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAdmins();
    setRefreshing(false);
  }

  async function handleAddAdmin() {
    if (
      !adminForm.email.trim() ||
      !adminForm.first_name.trim() ||
      !adminForm.last_name.trim() ||
      !adminForm.password
    ) {
      setFormError("All fields are required");
      return;
    }
    if (adminForm.password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    setFormError("");
    setAdding(true);
    try {
      const res = await fetch("/api/company/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });
      if (res.ok) {
        toast({ title: "Manager added!", variant: "success" });
        setAddDialog(false);
        setAdminForm({
          email: "",
          first_name: "",
          last_name: "",
          password: "",
          role: "admin",
        });
        setShowPassword(false);
        fetchAdmins();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to add manager");
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteAdmin() {
    if (!deleteDialog.admin) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/company/admins?adminId=${deleteDialog.admin.id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        toast({ title: "Manager removed", variant: "success" });
        setDeleteDialog({ open: false, admin: null });
        fetchAdmins();
      } else {
        const data = await res.json();
        toast({
          title: data.error || "Failed to remove manager",
          variant: "destructive",
        });
      }
    } finally {
      setDeleting(false);
    }
  }

  // Only owners can view this page
  if (loading || !currentAdmin) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 rounded-lg bg-secondary/30" />
        <div className="h-64 rounded-xl bg-secondary/30" />
      </div>
    );
  }

  if (currentAdmin.role !== "owner") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-4">
          Only company owners can manage managers.
        </p>
        <Button onClick={() => router.push("/company")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const ownerCount = admins.filter((a) => a.role === "owner").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manager Management</h1>
            <p className="text-muted-foreground">
              Manage who can access {currentAdmin.company.name}
            </p>
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
          <Button onClick={() => setAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Manager
          </Button>
        </div>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Crown className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">
                Owner
              </p>
              <p className="text-xs text-muted-foreground">
                Full access + manage managers, company settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-medium text-blue-600 dark:text-blue-400">
                Manager
              </p>
              <p className="text-xs text-muted-foreground">
                Manage sessions, teams, and testers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle>Company Managers</CardTitle>
          <CardDescription>
            {admins.length} manager{admins.length !== 1 ? "s" : ""} in your
            company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {admin.user.first_name?.[0]}
                  {admin.user.last_name?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {admin.user.first_name} {admin.user.last_name}
                    </p>
                    {admin.id === currentAdmin.id && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {admin.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  {admin.role === "owner" ? "Owner" : "Manager"}
                </Badge>
                {admin.id !== currentAdmin.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteDialog({ open: true, admin })}
                    disabled={admin.role === "owner" && ownerCount <= 1}
                    title={
                      admin.role === "owner" && ownerCount <= 1
                        ? "Cannot remove the only owner"
                        : "Remove admin"
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog
        open={addDialog}
        onOpenChange={(open) => {
          setAddDialog(open);
          if (!open) {
            setFormError("");
            setShowPassword(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manager</DialogTitle>
            <DialogDescription>
              Create a new manager account for {currentAdmin.company.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={adminForm.first_name}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, first_name: e.target.value })
                  }
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={adminForm.last_name}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, last_name: e.target.value })
                  }
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={adminForm.email}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, email: e.target.value })
                }
                placeholder="admin@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
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
                  <SelectItem value="admin">
                    Manager (Manage sessions & teams)
                  </SelectItem>
                  <SelectItem value="owner">
                    Owner (Full access + manage managers)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={adding}>
              {adding && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, admin: open ? deleteDialog.admin : null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Manager</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              {deleteDialog.admin?.user.first_name}{" "}
              {deleteDialog.admin?.user.last_name} from the management team?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialog({ open: false, admin: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAdmin}
              disabled={deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Remove Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
