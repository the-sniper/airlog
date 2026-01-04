"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users2,
  FolderKanban,
  Shield,
  Plus,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  admins: { count: number }[];
  teams: { count: number }[];
  sessions: { count: number }[];
}

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      const res = await fetch("/api/admin/companies");
      if (res.ok) {
        setCompanies(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchCompanies();
    setRefreshing(false);
  }

  async function handleCreateCompany() {
    if (!newCompanyName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName.trim() }),
      });

      if (res.ok) {
        const company = await res.json();
        toast({
          title: "Company created!",
          description: `"${company.name}" has been created.`,
          variant: "success",
        });
        setCreateDialog(false);
        setNewCompanyName("");
        fetchCompanies();
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Failed to create company",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 rounded-lg bg-secondary/30" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-secondary/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Companies</h1>
            <p className="text-muted-foreground">
              Manage all registered companies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies.length}</p>
                <p className="text-sm text-muted-foreground">Total Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {companies.filter((c) => c.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {companies.reduce(
                    (sum, c) => sum + (c.admins?.[0]?.count || 0),
                    0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Total Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search companies..."
          className="pl-9"
        />
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold mb-2">
              {searchQuery ? "No companies found" : "No companies yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Create your first company to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Link key={company.id} href={`/admin/companies/${company.id}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {company.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-mono">
                          /{company.slug}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={company.is_active ? "active" : "secondary"}
                      className="capitalize"
                    >
                      {company.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-secondary/30">
                      <p className="text-lg font-bold">
                        {company.admins?.[0]?.count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Managers</p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/30">
                      <p className="text-lg font-bold">
                        {company.teams?.[0]?.count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Teams</p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/30">
                      <p className="text-lg font-bold">
                        {company.sessions?.[0]?.count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className="capitalize">
                      {company.subscription_tier}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Created {formatDate(company.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Company Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
            <DialogDescription>
              Create a new company account. The company owner can be assigned
              afterward.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Acme Studios"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCompany();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCompany}
              disabled={submitting || !newCompanyName.trim()}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
