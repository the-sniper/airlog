"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TesterNotifications } from "@/components/tester-notifications";
import { Menu, X, LayoutGrid, ChevronRight, Settings, Users2, LogOut } from "lucide-react";
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
import { ChevronDown } from "lucide-react";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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
      <header className="h-16 border-b border-border/50 bg-card/80 glass flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="AirLog" width={110} height={28} className="dark:hidden" />
            <Image src="/logo-dark.svg" alt="AirLog" width={110} height={28} className="hidden dark:block" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <nav className="hidden md:flex items-center gap-3 mr-4">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/sessions" className="text-sm text-muted-foreground hover:text-foreground">
              Sessions
            </Link>
          </nav>
          <TesterNotifications userId={user?.id} />
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <span>{user?.first_name ? `Hey ${user.first_name}` : "Account"}</span>
                  <ChevronDown className="w-4 h-4 transition-transform data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="flex h-10 items-center justify-between gap-2 px-3 py-2 data-[highlighted]:bg-muted data-[highlighted]:text-foreground">
                  <span className="text-sm">Theme</span>
                  <ThemeToggle />
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex h-10 items-center px-3 py-2 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
                  onClick={async () => {
                    setShowLogoutDialog(true);
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          </Button>
          {/* <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() => setShowLogoutDialog(true)}
          >
            Logout
          </Button> */}
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 sm:hidden ${
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-background/70 backdrop-blur-md transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          className={`absolute inset-y-0 right-0 w-[86%] max-w-sm bg-card shadow-2xl border-l border-border/60 rounded-l-3xl flex flex-col transition-transform duration-300 ease-in-out ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="AirLog" width={96} height={24} className="dark:hidden" />
              <Image src="/logo-dark.svg" alt="AirLog" width={96} height={24} className="hidden dark:block" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setDrawerOpen(false)}
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          <div className="px-5 py-6 space-y-6 flex-1 overflow-y-auto flex flex-col">
            <div className="space-y-3">
              <div className="rounded-xl">
                <p className="text-xs text-muted-foreground">You are logged in as</p>
                <p className="font-semibold">{fullName || "User"}</p>
              </div>

              <Link
                href="/dashboard"
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors border-border/60 bg-muted/20 hover:border-border"
                onClick={() => setDrawerOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <LayoutGrid className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Dashboard</p>
                    <p className="text-xs text-muted-foreground">Your workspace</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                href="/sessions"
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors border-border/60 bg-muted/20 hover:border-border"
                onClick={() => setDrawerOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted/40 text-muted-foreground flex items-center justify-center">
                    <Users2 className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Sessions</p>
                    <p className="text-xs text-muted-foreground">Browse and manage sessions</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>

            <div className="flex-1" />

            <div className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border/60 flex items-center justify-center text-muted-foreground">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-xs text-muted-foreground">Light or dark mode</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  await fetch("/api/users/logout", { method: "POST" });
                  setDrawerOpen(false);
                  router.push("/login");
                }}
              >
                <LogOut className="w-5 h-5" strokeWidth={1.75} />
                <div className="text-left">
                  <p className="font-medium">Sign Out</p>
                  <p className="text-xs text-muted-foreground">End this session securely</p>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await fetch("/api/users/logout", { method: "POST" });
                setShowLogoutDialog(false);
                router.push("/login");
                router.refresh();
              }}
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
