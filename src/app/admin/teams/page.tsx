"use client";

import { TeamsManager } from "@/components/admin/teams-manager";

export default function AdminTeamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Teams Management</h1>
        <p className="text-muted-foreground">
          Manage all teams across the platform. Assign orphan teams to
          companies.
        </p>
      </div>

      <TeamsManager />
    </div>
  );
}
