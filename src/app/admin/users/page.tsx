"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  Shield,
  Building2,
  RefreshCw,
  Crown,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Ban,
  CheckCircle2,
  UserMinus,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  deleted_at?: string;
  company?: {
    id: string;
    name: string;
  };
  company_admins?: {
    role: string;
  }[];
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  // Action states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [isEditLoading, setIsEditLoading] = useState(false);

  const [disablingUser, setDisablingUser] = useState<User | null>(null);
  const [isDisableLoading, setIsDisableLoading] = useState(false);

  const [restoringUser, setRestoringUser] = useState<User | null>(null);
  const [isRestoreLoading, setIsRestoreLoading] = useState(false);

  // Assign Company states
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const [assignUser, setAssignUser] = useState<User | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [isAssignLoading, setIsAssignLoading] = useState(false);

  const [removingUser, setRemovingUser] = useState<User | null>(null);
  const [isRemoveLoading, setIsRemoveLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "100");

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const admins = users.filter(
    (u) => u.company_admins && u.company_admins.length > 0
  );

  // Edit Handlers
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
    });
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;
    setIsEditLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        toast({
          title: "User updated",
          description: "User details have been successfully updated.",
          variant: "success",
        });
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to update user");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEditLoading(false);
    }
  };

  // Delete/Disable Handlers
  const handleDisableClick = (user: User) => {
    setDisablingUser(user);
  };

  const handleDisableSubmit = async () => {
    if (!disablingUser) return;
    setIsDisableLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${disablingUser.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "User disabled",
          description: "The user has been disabled and cannot login.",
          variant: "success",
        });
        setDisablingUser(null);
        // Optimistically update UI to avoid waiting for fetch or if column is missing
        setUsers((prev) =>
          prev.map((u) =>
            u.id === disablingUser.id
              ? { ...u, deleted_at: new Date().toISOString() }
              : u
          )
        );
        fetchUsers();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to disable user");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDisableLoading(false);
    }
  };

  // Restore Handlers
  const handleRestoreClick = (user: User) => {
    setRestoringUser(user);
  };

  const handleRestoreSubmit = async () => {
    if (!restoringUser) return;
    setIsRestoreLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${restoringUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });

      if (res.ok) {
        toast({
          title: "User restored",
          description: "Access has been restored for this user.",
          variant: "success",
        });
        setRestoringUser(null);
        // Optimistically update
        setUsers((prev) =>
          prev.map((u) =>
            u.id === restoringUser.id ? { ...u, deleted_at: undefined } : u
          )
        );
        fetchUsers();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to restore user");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRestoreLoading(false);
    }
  };

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/companies");
      if (res.ok) {
        setCompanies(await res.json());
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleAssignClick = (user: User) => {
    setAssignUser(user);
    setSelectedCompanyId("");
  };

  const handleAssignSubmit = async () => {
    if (!assignUser || !selectedCompanyId) return;
    setIsAssignLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${assignUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: selectedCompanyId }),
      });

      if (res.ok) {
        toast({
          title: "User assigned",
          description: `User assigned to company successfully.`,
          variant: "success",
        });
        setAssignUser(null);
        fetchUsers();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to assign user");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAssignLoading(false);
    }
  };

  const handleRemoveCompanyClick = (user: User) => {
    setRemovingUser(user);
  };

  const handleRemoveCompanySubmit = async () => {
    if (!removingUser) return;
    setIsRemoveLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${removingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: null }),
      });

      if (res.ok) {
        toast({
          title: "User removed from company",
          description: "User has been removed from the company.",
          variant: "success",
        });
        setRemovingUser(null);
        fetchUsers();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove user from company");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRemoveLoading(false);
    }
  };

  const UserCard = ({
    user,
    variant = "default",
  }: {
    user: User;
    variant?: "default" | "manager";
  }) => {
    // If deleted_at is missing from API but we know it's disabled via some other way, we can't tell easily.
    // But we are manually adding it in optimistic update.
    const isDisabled = !!user.deleted_at;

    return (
      <div
        className={`flex items-center justify-between p-4 rounded-lg bg-secondary/30 group ${
          isDisabled ? "opacity-60 grayscale" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          {variant === "manager" ? (
            // Admin tab: Regular avatar without overlay
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </div>
          ) : (
            // Users tab: Avatar with overlay icon
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </div>
              {user.company_admins && user.company_admins.length > 0 && (
                <div
                  className={`absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center border-2 border-background ${
                    user.company_admins[0].role === "owner"
                      ? "bg-amber-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                  title={
                    user.company_admins[0].role === "owner"
                      ? "Owner"
                      : "Manager"
                  }
                >
                  {user.company_admins[0].role === "owner" ? (
                    <Crown className="w-2.5 h-2.5" />
                  ) : (
                    <Shield className="w-2.5 h-2.5" />
                  )}
                </div>
              )}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {user.first_name} {user.last_name}
              </p>
              {variant === "manager" &&
                user.company_admins &&
                user.company_admins.length > 0 && (
                  <Badge
                    variant="secondary"
                    className={
                      user.company_admins[0].role === "owner"
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                        : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/25"
                    }
                  >
                    {user.company_admins[0].role === "owner" ? (
                      <Crown className="w-3 h-3 mr-1" />
                    ) : (
                      <Shield className="w-3 h-3 mr-1" />
                    )}
                    {user.company_admins[0].role === "owner"
                      ? "Owner"
                      : "Manager"}
                  </Badge>
                )}
              {isDisabled && (
                <Badge
                  variant="destructive"
                  className="h-5 px-1.5 text-[10px] font-normal"
                >
                  Disabled
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user.company ? (
            <Link href={`/admin/companies/${user.company.id}`}>
              <Badge
                variant="outline"
                className="hover:bg-secondary cursor-pointer gap-1 hidden sm:inline-flex"
              >
                <Building2 className="w-3 h-3" />
                {user.company.name}
              </Badge>
            </Link>
          ) : (
            <span className="text-muted-foreground text-sm max-w-[150px] truncate text-right hidden sm:block">
              No Company
            </span>
          )}
          <span className="text-sm text-muted-foreground whitespace-nowrap hidden md:block">
            {formatDate(user.created_at)}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Details
              </DropdownMenuItem>

              {isDisabled ? (
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-600"
                  onClick={() => handleRestoreClick(user)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Restore Access
                </DropdownMenuItem>
              ) : (
                <>
                  {!user.company && (
                    <DropdownMenuItem onClick={() => handleAssignClick(user)}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Assign to Company
                    </DropdownMenuItem>
                  )}
                  {user.company && (
                    <DropdownMenuItem
                      onClick={() => handleRemoveCompanyClick(user)}
                      className="text-amber-600 focus:text-amber-700 dark:text-amber-500 dark:focus:text-amber-400"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove from Company
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300"
                    onClick={() => handleDisableClick(user)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Disable User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (loading && users.length === 0) {
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
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">
              Manage all registered users across companies
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <Shield className="w-4 h-4" />
            Admins ({admins.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">All Users</CardTitle>
                  <CardDescription>
                    List of all registered users. Disabled users appear greyed
                    out.
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
              {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No users found</h3>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Company Admins</CardTitle>
                  <CardDescription>
                    Users with administrative privileges in their companies
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search admins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No admins found</h3>
                </div>
              ) : (
                <div className="space-y-2">
                  {admins.map((user) => (
                    <UserCard key={user.id} user={user} variant="manager" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details. Changes to email will require confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, last_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditingUser(null)}
              disabled={isEditLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isEditLoading}>
              {isEditLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog
        open={!!disablingUser}
        onOpenChange={(open) => !open && setDisablingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable User Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable{" "}
              <strong>
                {disablingUser?.first_name} {disablingUser?.last_name}
              </strong>
              ?
              <br />
              <br />
              This will <strong>prevent them from logging in</strong>{" "}
              immediately.
              <br />
              Their data (notes, sessions, etc.) will remain intact and can be
              restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDisablingUser(null)}
              disabled={isDisableLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableSubmit}
              disabled={isDisableLoading}
            >
              {isDisableLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Disable User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={!!restoringUser}
        onOpenChange={(open) => !open && setRestoringUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore User Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore access for{" "}
              <strong>
                {restoringUser?.first_name} {restoringUser?.last_name}
              </strong>
              ?
              <br />
              <br />
              They will be able to log in again immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRestoringUser(null)}
              disabled={isRestoreLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreSubmit}
              disabled={isRestoreLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isRestoreLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Restore Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Company Dialog */}
      <Dialog
        open={!!assignUser}
        onOpenChange={(open) => !open && setAssignUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to Company</DialogTitle>
            <DialogDescription className="pt-2">
              Assign{" "}
              <strong>
                {assignUser?.first_name} {assignUser?.last_name}
              </strong>{" "}
              to a company.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 pt-0">
            <div className="space-y-2">
              <Label>Select Company</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company..." />
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
              onClick={() => setAssignUser(null)}
              disabled={isAssignLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignSubmit}
              disabled={isAssignLoading || !selectedCompanyId}
            >
              {isAssignLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Assign User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Company Confirmation Dialog */}
      <Dialog
        open={!!removingUser}
        onOpenChange={(open) => !open && setRemovingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User from Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {removingUser?.first_name} {removingUser?.last_name}
              </strong>{" "}
              from <strong>{removingUser?.company?.name}</strong>?
              <br />
              <br />
              They will no longer be part of this company and will lose access
              to any company-specific resources.
              {removingUser?.company_admins &&
                removingUser.company_admins.length > 0 && (
                  <>
                    <br />
                    <br />
                    <strong className="text-amber-600">
                      Warning: This user is an admin/owner of the company. Their
                      admin privileges will also be revoked.
                    </strong>
                  </>
                )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRemovingUser(null)}
              disabled={isRemoveLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveCompanySubmit}
              disabled={isRemoveLoading}
            >
              {isRemoveLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Remove from Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
