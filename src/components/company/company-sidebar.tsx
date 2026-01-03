"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users2,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  Settings,
  Building2,
  Plus,
  Shield,
  Crown,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useTheme } from "@/components/common/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CompanyAuthData {
  admin: {
    role: string;
  };
  company: {
    name: string;
    logo_url: string | null;
  };
}

export function CompanySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [company, setCompany] = useState<CompanyAuthData["company"] | null>(
    null
  );

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/company/auth/me");
        if (res.ok) {
          const data: CompanyAuthData = await res.json();
          setIsOwner(data.admin.role === "owner");
          setCompany(data.company);
        }
      } catch {}
    }
    checkRole();
  }, []);

  const isActive = (href: string) => {
    if (href === "/company") {
      return pathname === "/company";
    }
    if (href === "/company/sessions") {
      return pathname.startsWith("/company/sessions");
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch("/api/company/auth/logout", { method: "POST" });
    router.push("/company/login");
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-border/50 bg-card/30 hidden md:block">
      <div className="flex flex-col h-full">
        <div className="py-7 flex flex-col gap-6 px-6 border-b border-border/50">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="AirLog"
              width={100}
              height={28}
              className="dark:hidden"
            />
            <Image
              src="/logo-dark.svg"
              alt="AirLog"
              width={100}
              height={28}
              className="hidden dark:block"
            />
          </Link>
          {company && (
            <div className="flex flex-col gap-3">
              <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-border/50 bg-muted/10 shadow-sm">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <Building2 className="w-6 h-6 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-foreground leading-none tracking-tight truncate">
                  {company.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-primary/60" />
                  <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">
                    Organization
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/company"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/company")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" strokeWidth={1.75} />
            Dashboard
          </Link>
          <Link
            href="/company/sessions"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/company/sessions")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <FolderKanban className="w-4 h-4" strokeWidth={1.75} />
            Sessions
          </Link>
          <Link
            href="/company/users"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/company/users")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.75} />
            Users
          </Link>
          <Link
            href="/company/teams"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/company/teams")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Users2 className="w-4 h-4" strokeWidth={1.75} />
            Teams
          </Link>

          <Link
            href="/company/join-requests"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/company/join-requests")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <UserCheck className="w-4 h-4" strokeWidth={1.75} />
            Join Requests
          </Link>
          <Link
            href="/company/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/company/settings")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" strokeWidth={1.75} />
            Company Settings
          </Link>
          {isOwner && (
            <Link
              href="/company/admins"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive("/company/admins")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Shield className="w-4 h-4" strokeWidth={1.75} />
              Manage Managers
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {isOwner ? (
                <Crown className="w-3 h-3 text-amber-500" />
              ) : (
                <Shield className="w-3 h-3 text-blue-500" />
              )}
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                {isOwner ? "Owner" : "Manager"}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="w-4 h-4 mr-2" strokeWidth={1.75} />
            Sign Out
          </Button>
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
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

export function CompanyMobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isOwner, setIsOwner] = useState(false);
  const [company, setCompany] = useState<CompanyAuthData["company"] | null>(
    null
  );

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/company/auth/me");
        if (res.ok) {
          const data: CompanyAuthData = await res.json();
          setIsOwner(data.admin.role === "owner");
          setCompany(data.company);
        }
      } catch {}
    }
    checkRole();
  }, []);

  const isActive = (href: string) => {
    if (href === "/company") {
      return pathname === "/company";
    }
    if (href === "/company/sessions") {
      return pathname.startsWith("/company/sessions");
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch("/api/company/auth/logout", { method: "POST" });
    router.push("/company/login");
    router.refresh();
  };

  const cycleTheme = () => {
    if (theme === "auto") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("auto");
    }
  };

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border/50 bg-card/80 glass z-50">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="AirLog"
              width={80}
              height={22}
              className="dark:hidden"
            />
            <Image
              src="/logo-dark.svg"
              alt="AirLog"
              width={80}
              height={22}
              className="hidden dark:block"
            />
            {company?.logo_url && (
              <>
                <div className="h-5 w-px bg-border/50 mx-1" />
                <div className="relative w-6 h-6 rounded-md overflow-hidden border border-border/50 bg-muted/20">
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          </Button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!drawerOpen}
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
          <div className="flex flex-col gap-6 px-5 py-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.svg"
                  alt="AirLog"
                  width={90}
                  height={24}
                  className="dark:hidden"
                />
                <Image
                  src="/logo-dark.svg"
                  alt="AirLog"
                  width={90}
                  height={24}
                  className="hidden dark:block"
                />
              </Link>
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
            {company && (
              <div className="flex flex-col gap-3">
                <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-border/50 bg-muted/10">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <Building2 className="w-5 h-5 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground leading-tight truncate">
                    {company.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">
                    Organization
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            <div className="space-y-2">
              <Link
                href="/company"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/company")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/company")
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/60 text-muted-foreground"
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Dashboard</p>
                    <p className="text-xs text-muted-foreground">
                      Overview and analytics
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                href="/company/sessions"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/company/sessions")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/company/sessions")
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/60 text-muted-foreground"
                    }`}
                  >
                    <FolderKanban className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Sessions</p>
                    <p className="text-xs text-muted-foreground">
                      Manage test sessions
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                href="/company/users"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/company/users")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/company/users")
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/60 text-muted-foreground"
                    }`}
                  >
                    <UserPlus className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Users</p>
                    <p className="text-xs text-muted-foreground">
                      Invite and manage users
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                href="/company/teams"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/company/teams")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/company/teams")
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/60 text-muted-foreground"
                    }`}
                  >
                    <Users2 className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Teams</p>
                    <p className="text-xs text-muted-foreground">
                      Manage your testing teams
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                href="/company/join-requests"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/company/join-requests")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/company/join-requests")
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/60 text-muted-foreground"
                    }`}
                  >
                    <UserCheck className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Join Requests</p>
                    <p className="text-xs text-muted-foreground">
                      Approve new members
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                href="/company/settings"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/company/settings")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/company/settings")
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/60 text-muted-foreground"
                    }`}
                  >
                    <Building2 className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Company Settings</p>
                    <p className="text-xs text-muted-foreground">
                      Update company profile
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              {isOwner && (
                <Link
                  href="/company/admins"
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                    isActive("/company/admins")
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-transparent bg-muted/30 text-foreground hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isActive("/company/admins")
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border/60 text-muted-foreground"
                      }`}
                    >
                      <Shield className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="font-medium">Manage Managers</p>
                      <p className="text-xs text-muted-foreground">
                        Add or remove team managers
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}
            </div>
          </div>

          <div className="px-5 pb-6 space-y-3">
            <div className="rounded-xl border border-border/60 bg-muted/10">
              <button
                type="button"
                onClick={cycleTheme}
                className="flex w-full items-center justify-between text-left px-4 py-3 hover:bg-background/60 transition-colors rounded-xl"
                aria-label="Toggle theme"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border/60 flex items-center justify-center text-muted-foreground">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-xs text-muted-foreground">
                      Light or dark mode
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-background border border-border/60 flex items-center justify-center text-muted-foreground">
                  {theme === "auto" && (
                    <Clock className="w-4 h-4" strokeWidth={1.75} />
                  )}
                  {theme === "light" && (
                    <Sun className="w-4 h-4" strokeWidth={1.75} />
                  )}
                  {theme === "dark" && (
                    <Moon className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </div>
              </button>
            </div>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                setDrawerOpen(false);
                setShowLogoutDialog(true);
              }}
            >
              <LogOut className="w-5 h-5" strokeWidth={1.75} />
              <div className="text-left">
                <p className="font-medium">Sign Out</p>
                <p className="text-xs text-muted-foreground">
                  End this session securely
                </p>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 z-40">
        <div className="absolute inset-0 bg-card/95 backdrop-blur-xl border-t border-border/50" />

        <div className="relative grid grid-cols-5 items-end h-full w-full">
          <Link
            href="/company"
            className={`flex flex-col items-center justify-center gap-1 pb-2 h-full transition-all ${
              isActive("/company")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>

          <Link
            href="/company/sessions"
            className={`flex flex-col items-center justify-center gap-1 pb-2 h-full transition-all ${
              isActive("/company/sessions")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderKanban className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Sessions</span>
          </Link>

          {/* Create Button */}
          <div className="relative flex flex-col items-center justify-center gap-1 pb-2 h-full w-full">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <Link
                href="/company/sessions/new"
                className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all border-4 border-background"
              >
                <Plus className="w-7 h-7" strokeWidth={2} />
              </Link>
            </div>
            <div className="w-6 h-6" aria-hidden="true" />
            <span className="text-[10px] font-medium text-primary">Create</span>
          </div>

          <Link
            href="/company/teams"
            className={`flex flex-col items-center justify-center gap-1 pb-2 h-full transition-all ${
              isActive("/company/teams")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users2 className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Teams</span>
          </Link>

          <Link
            href="/company/settings"
            className={`flex flex-col items-center justify-center gap-1 pb-2 h-full transition-all ${
              isActive("/company/settings")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
