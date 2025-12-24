"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TesterNotifications } from "@/components/tester-notifications";

interface MeResponse {
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        const data: MeResponse = await res.json();
        if (!mounted) return;
        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch {
        if (mounted) router.push("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchUser();
    return () => {
      mounted = false;
    };
  }, [router]);

  const fullName = user ? `${user.first_name} ${user.last_name}` : "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <header className="h-16 border-b border-border/50 bg-card/80 glass flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="AirLog" width={110} height={28} className="dark:hidden" />
          <Image src="/logo-dark.svg" alt="AirLog" width={110} height={28} className="hidden dark:block" />
        </div>
        <div className="flex items-center gap-2">
          <TesterNotifications userId={user?.id} />
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={async () => { await fetch("/api/users/logout", { method: "POST" }); router.push("/login"); }}>
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg glass border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Welcome{fullName ? `, ${fullName}` : ""}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is your dashboard. We&apos;ll add more here soon.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
