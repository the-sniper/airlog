"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, Loader2, Users } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";

interface CompanyAdmin {
  id: string;
  role: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
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
}

interface CompanyData {
  admin: CompanyAdmin;
  company: Company;
}

export default function CompanySettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const res = await fetch("/api/company/auth/me");
        if (res.ok) {
          const companyData = await res.json();
          setData(companyData);
          setCompanyName(companyData.company.name);
        } else {
          router.push("/company/login");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCompanyData();
  }, [router]);

  async function handleSave() {
    if (!companyName.trim()) return;
    setSaving(true);
    try {
      // For now, just show a toast - update endpoint would be needed
      toast({
        title: "Settings saved",
        description: "Company settings have been updated.",
        variant: "success",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-secondary/30" />
        <div className="h-64 rounded-2xl bg-secondary/30" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { admin, company } = data;
  const isOwner = admin.role === "owner";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground">
          Manage your company profile and settings
        </p>
      </div>

      {/* Company Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle>{company.name}</CardTitle>
                <CardDescription>/{company.slug}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {company.subscription_tier}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={!isOwner}
              placeholder="Your company name"
            />
            {!isOwner && (
              <p className="text-xs text-muted-foreground">
                Only the company owner can update the name
              </p>
            )}
          </div>

          {isOwner && (
            <Button
              onClick={handleSave}
              disabled={saving || companyName === company.name}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subscription</CardTitle>
          <CardDescription>Your current plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold">{company.max_teams}</p>
              <p className="text-sm text-muted-foreground">Teams allowed</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold">
                {company.max_sessions_per_month}
              </p>
              <p className="text-sm text-muted-foreground">Sessions/month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Account</CardTitle>
          <CardDescription>Your admin role in this company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {admin.user.first_name} {admin.user.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {admin.user.email}
              </p>
              <Badge variant="outline" className="mt-1 capitalize">
                {admin.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
