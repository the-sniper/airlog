import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban,
  Users2,
  Plus,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";
import { createAdminClient } from "@/lib/supabase/server";

export default async function CompanyDashboardPage() {
  const admin = await getCurrentCompanyAdmin();

  if (!admin) {
    redirect("/company/login");
  }

  const supabase = createAdminClient();

  // Get company stats
  const [teamsResult, sessionsResult] = await Promise.all([
    supabase
      .from("teams")
      .select("id", { count: "exact" })
      .eq("company_id", admin.company_id),
    supabase
      .from("sessions")
      .select("id", { count: "exact" })
      .eq("company_id", admin.company_id),
  ]);

  const teamCount = teamsResult.count || 0;
  const sessionCount = sessionsResult.count || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {admin.user.first_name}
        </h1>
        <p className="text-muted-foreground">
          Manage your testing teams and sessions for{" "}
          <span className="font-medium text-foreground">
            {admin.company.name}
          </span>
        </p>
      </div>

      {/* Company Info Card */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{admin.company.name}</h2>
            <p className="text-sm text-muted-foreground">
              {admin.company.subscription_tier === "free"
                ? "Free Plan"
                : admin.company.subscription_tier}
              {" · "}
              {admin.role === "owner"
                ? "Owner"
                : admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/company/teams" className="group">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users2 className="w-6 h-6 text-primary" />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-3xl font-bold">{teamCount}</div>
            <div className="text-muted-foreground">
              {teamCount === 1 ? "Team" : "Teams"}
            </div>
          </div>
        </Link>

        <Link href="/company/sessions" className="group">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-primary" />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-3xl font-bold">{sessionCount}</div>
            <div className="text-muted-foreground">
              {sessionCount === 1 ? "Session" : "Sessions"}
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button asChild size="lg" className="h-14 justify-start gap-3">
            <Link href="/company/sessions/new">
              <Plus className="w-5 h-5" />
              Create New Session
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 justify-start gap-3"
          >
            <Link href="/company/teams">
              <Users2 className="w-5 h-5" />
              Manage Teams
            </Link>
          </Button>
        </div>
      </div>

      {/* Getting Started (for new companies) */}
      {teamCount === 0 && (
        <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent p-6">
          <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
          <p className="text-muted-foreground mb-4">
            Create your first team to start inviting testers and running
            sessions.
          </p>
          <Button asChild>
            <Link href="/company/teams">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Team
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
