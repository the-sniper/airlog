"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DashboardWelcome,
  StatsCards,
  ActivityChart,
  SessionCards,
} from "@/components/tester/dashboard";
import { Loader2 } from "lucide-react";

interface DashboardData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sessions: {
    total: number;
    active: number;
    completed: number;
    pending: number;
  };
  notes: {
    total: number;
    byCategory: {
      bug: number;
      feature: number;
      ux: number;
      performance: number;
      other: number;
    };
  };
  recentActivity: {
    date: string;
    count: number;
  }[];
  recentSessions: {
    id: string;
    name: string;
    status: string;
    joinCode: string;
    createdAt: string;
    startedAt: string | null;
    endedAt: string | null;
    shareToken: string | null;
    notesCount: number;
  }[];
}

interface MeResponse {
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome skeleton */}
      <div className="h-40 rounded-2xl bg-muted/30" />

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted/30" />
        ))}
      </div>

      {/* Chart and sessions skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-xl bg-muted/30" />
        <div className="h-72 rounded-xl bg-muted/30" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        // First check auth
        const meRes = await fetch("/api/users/me", { cache: "no-store" });
        const meData: MeResponse = await meRes.json();

        if (!mounted) return;

        if (!meRes.ok || !meData.user) {
          router.push("/login");
          return;
        }

        setUser(meData.user);

        // Then fetch dashboard data
        const dashRes = await fetch("/api/users/dashboard", {
          cache: "no-store",
        });

        if (!mounted) return;

        if (dashRes.ok) {
          const data = await dashRes.json();
          setDashboardData(data);
        } else {
          setError("Failed to load dashboard data");
        }
      } catch (err) {
        if (mounted) {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex flex-col">
        <div className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm" />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 gradient-mesh">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary underline"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full gradient-mesh">
      <div className="space-y-6">
        {/* Welcome Section */}
        {dashboardData && (
          <DashboardWelcome
            firstName={dashboardData.user.firstName}
            lastName={dashboardData.user.lastName}
          />
        )}

        {/* Stats Cards */}
        {dashboardData && (
          <StatsCards
            sessions={dashboardData.sessions}
            notes={dashboardData.notes}
          />
        )}

        {/* Activity Chart & Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardData && (
            <>
              <ActivityChart data={dashboardData.recentActivity} />
              <SessionCards sessions={dashboardData.recentSessions} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
