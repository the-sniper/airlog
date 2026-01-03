"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Save,
  Loader2,
  Users,
  Upload,
  Info,
  Crown,
  Shield,
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
import { Tooltip } from "@/components/ui/tooltip";
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-white/5 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-neutral-800 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-inner group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-10 h-10 text-primary/40 group-hover:text-primary/60 transition-colors" />
              )}
            </div>
            {isOwner && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg border border-black/10"
                onClick={() => document.getElementById("logo-upload")?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                {company.name}
              </h1>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 capitalize font-semibold tracking-wide"
              >
                {company.subscription_tier} Plan
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                <span className="text-neutral-500 font-medium">
                  Internal ID:
                </span>
                <span className="font-mono text-xs text-neutral-300 tracking-wider uppercase">
                  {company.slug}
                </span>
              </div>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{admin.role === "owner" ? "Owner" : "Manager"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {isOwner && (
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all active:scale-95"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Details */}
          <Card className="border-white/5 bg-neutral-900/40 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-xl font-bold">
                General Information
              </CardTitle>
              <CardDescription>
                Core details about your company&apos;s digital identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-8">
                <div className="space-y-3">
                  <Label
                    htmlFor="company-name"
                    className="text-neutral-400 font-semibold uppercase text-[10px] tracking-widest ml-1"
                  >
                    Company Display Name
                  </Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={!isOwner}
                    className="h-12 bg-black/20 border-white/10 focus:border-primary/50 transition-all rounded-xl"
                    placeholder="Enter full company name"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="description"
                      className="text-neutral-400 font-semibold uppercase text-[10px] tracking-widest ml-1"
                    >
                      About the Company
                    </Label>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      Visible on your public profile
                    </span>
                  </div>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isOwner}
                    placeholder="Tell users what your company does..."
                    className="flex min-h-[140px] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm focus:border-primary/50 transition-all focus-visible:outline-none disabled:opacity-50 resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="contact-email"
                    className="text-neutral-400 font-semibold uppercase text-[10px] tracking-widest ml-1"
                  >
                    Primary Contact Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={!isOwner}
                    className="h-12 bg-black/20 border-white/10 focus:border-primary/50 transition-all rounded-xl"
                    placeholder="hello@world.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hidden UI for Image Upload Logic (controlled by button in header) */}
          <div className="hidden">
            <ImageUpload
              value={logoUrl}
              onChange={setLogoUrl}
              onUpload={onUpload}
              disabled={!isOwner}
            />
          </div>
        </div>

        <div className="space-y-8">
          {/* Usage & Limits */}
          <Card className="border-white/5 bg-neutral-900/40 backdrop-blur-xl shadow-xl overflow-hidden h-fit">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold">
                  Usage Limits
                </CardTitle>
                <Tooltip content="Limits are based on your current subscription tier.">
                  <Info className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors cursor-help" />
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/[0.07] transition-all">
                  <div>
                    <p className="text-neutral-400 text-xs font-medium mb-1">
                      Max Teams
                    </p>
                    <p className="text-3xl font-black text-white">
                      {company.max_teams}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/[0.07] transition-all">
                  <div>
                    <p className="text-neutral-400 text-xs font-medium mb-1">
                      Monthly Sessions
                    </p>
                    <p className="text-3xl font-black text-white">
                      {company.max_sessions_per_month}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Snapshot */}
          <Card className="border-white/5 bg-neutral-900 shadow-xl overflow-hidden border-2 border-primary/20">
            <div className="p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-xl font-black text-primary">
                {admin.user.first_name?.[0]}
                {admin.user.last_name?.[0]}
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-white text-lg leading-tight">
                  {admin.user.first_name} {admin.user.last_name}
                </p>
                <p className="text-sm text-neutral-400">{admin.user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className={
                      admin.role === "owner"
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold tracking-tight px-2 py-0.5"
                        : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold tracking-tight px-2 py-0.5"
                    }
                  >
                    {admin.role === "owner" ? (
                      <Crown className="w-3 h-3 mr-1.5" />
                    ) : (
                      <Shield className="w-3 h-3 mr-1.5" />
                    )}
                    {admin.role === "owner" ? "Owner" : "Manager"}
                  </Badge>
                  <div className="flex items-center gap-1.5 ml-1">
                    <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] uppercase font-black tracking-tighter text-neutral-500">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
