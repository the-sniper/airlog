"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, Loader2, Users, Upload } from "lucide-react";
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

import { ImageUpload } from "@/components/ui/image-upload";

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
  description: string | null;
  contact_email: string | null;
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
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const res = await fetch("/api/company/auth/me");
        if (res.ok) {
          const companyData = await res.json();
          setData(companyData);
          setCompanyName(companyData.company.name || "");
          setLogoUrl(companyData.company.logo_url || "");
          setDescription(companyData.company.description || "");
          setContactEmail(companyData.company.contact_email || "");
        } else {
          router.push("/company/login");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCompanyData();
  }, [router]);

  async function onUpload(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/company/upload-logo", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Upload failed");
    }

    const data = await res.json();
    toast({
      title: "Logo uploaded",
      description: "Remember to save your changes.",
    });
    return data.url;
  }

  async function handleSave() {
    if (!companyName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          logo_url: logoUrl || null,
          description: description || null,
          contact_email: contactEmail || null,
        }),
      });

      if (!res.ok) {
        toast({
          title: "Update failed",
          description: "Could not save settings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Settings saved",
        description: "Company settings have been updated.",
        variant: "default",
        className: "bg-green-500 text-white border-none",
      });

      // Refresh local data to match
      const newData = { ...data! };
      newData.company.name = companyName;
      newData.company.logo_url = logoUrl || null;
      // Note: description/contact_email might not be in the initial 'Company' interface if I don't update it in this file,
      // but they are just for display in inputs here.
      // However, to be type safe I should update the interface too.
      setData(newData);
    } catch {
      toast({
        title: "Update failed",
        description: "Something went wrong.",
        variant: "destructive",
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
          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label>Company Logo</Label>
              <ImageUpload
                value={logoUrl}
                onChange={setLogoUrl}
                onUpload={onUpload}
                disabled={!isOwner}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isOwner}
                placeholder="Briefly describe your company..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={!isOwner}
                placeholder="contact@company.com"
              />
            </div>
          </div>

          {isOwner && (
            <Button onClick={handleSave} disabled={saving} className="mt-4">
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
