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
  UserPlus,
  Menu,
  Bell,
  Settings,
  X,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  Gauge,
  Plus,
  User,
  Building2,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useTheme } from "@/components/common/theme-provider";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/admin/notification-center";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === "/admin") {
      // Dashboard is only active for exactly /admin
      return pathname === "/admin";
    }
    if (href === "/admin/sessions") {
      // Sessions is active for /admin/sessions/*
      return pathname.startsWith("/admin/sessions");
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-border/50 bg-card/30 hidden md:block">
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="AirLog"
              width={120}
              height={32}
              className="dark:hidden"
            />
            <Image
              src="/logo-dark.svg"
              alt="AirLog"
              width={120}
              height={32}
              className="hidden dark:block"
            />
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/admin")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" strokeWidth={1.75} />
            Dashboard
          </Link>
          <Link
            href="/admin/companies"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/admin/companies")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" strokeWidth={1.75} />
            Companies
          </Link>
          {/* <Link
            href="/admin/sessions"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/admin/sessions")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <FolderKanban className="w-4 h-4" strokeWidth={1.75} />
            Sessions
          </Link> */}

          {/* <Link
            href="/admin/teams"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/admin/teams")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Users2 className="w-4 h-4" strokeWidth={1.75} />
            Teams
          </Link> */}

          <Link
            href="/admin/users"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/admin/users")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" strokeWidth={1.75} />
            Users
          </Link>
          <Link
            href="/admin/usage"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/admin/usage")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Gauge className="w-4 h-4" strokeWidth={1.75} />
            Usage
          </Link>
        </nav>
        <div className="p-4 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            <div className="flex items-center gap-1">
              <NotificationCenter />
              <ThemeToggle />
            </div>
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

export function AdminMobileHeader({
  hideBottomNav = false,
  hideTopHeader = false,
}: { hideBottomNav?: boolean; hideTopHeader?: boolean } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const isActive = (href: string) => {
    if (href === "/admin") {
      // Dashboard is only active for exactly /admin
      return pathname === "/admin";
    }
    if (href === "/admin/sessions") {
      // Sessions is active for /admin/sessions/*
      return pathname.startsWith("/admin/sessions");
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
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

  // Lock body scroll when drawer is open - iOS compatible
  useEffect(() => {
    if (drawerOpen) {
      const scrollY = window.scrollY;
      document.body.setAttribute("data-scroll-locked", "");
      document.body.style.top = `-${scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.removeAttribute("data-scroll-locked");
      document.body.style.top = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.removeAttribute("data-scroll-locked");
      document.body.style.top = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    };
  }, [drawerOpen]);

  return (
    <>
      {/* Top Header - hidden when hideTopHeader is true (e.g., on tester pages where TesterHeader is shown) */}
      {!hideTopHeader && (
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border/50 bg-card/80 glass z-50 pwa-fixed-header">
          <div className="flex items-center justify-between h-full px-4">
            <Link href="/" className="flex items-center gap-3">
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
            <div className="flex items-center gap-1">
              {/* Notifications */}
              <NotificationCenter />

              {/* Hamburger Menu */}
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
          </div>
        </header>
      )}

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
          <div
            className="flex items-center justify-between px-5 border-b border-border/50"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
              paddingBottom: "16px",
            }}
          >
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="AirLog"
                width={96}
                height={24}
                className="dark:hidden"
              />
              <Image
                src="/logo-dark.svg"
                alt="AirLog"
                width={96}
                height={24}
                className="hidden dark:block"
              />
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

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            <div className="space-y-2">
              <Link
                href="/admin"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/admin")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/admin")
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

              {/* <Link
                href="/admin/sessions"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/admin/sessions")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/admin/sessions")
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/60 text-muted-foreground"
                    }`}
                  >
                    <FolderKanban className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Sessions</p>
                    <p className="text-xs text-muted-foreground">
                      Browse and manage sessions
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link> */}

              {/* <Link
                href="/admin/teams"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/admin/teams")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/admin/teams")
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/60 text-muted-foreground"
                    }`}
                  >
                    <Users2 className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Teams</p>
                    <p className="text-xs text-muted-foreground">
                      Manage teams and assignments
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link> */}

              <Link
                href="/admin/users"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/admin/users")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/admin/users")
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/60 text-muted-foreground"
                    }`}
                  >
                    <User className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Users</p>
                    <p className="text-xs text-muted-foreground">
                      Manage all system users
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                href="/admin/usage"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  isActive("/admin/usage")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/30 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive("/admin/usage")
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/60 text-muted-foreground"
                    }`}
                  >
                    <Gauge className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">Usage</p>
                    <p className="text-xs text-muted-foreground">
                      Monitor API costs
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>
            <div className="flex-1" />
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
      {!hideBottomNav && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 z-40">
          {/* Background with notch cutout effect */}
          <div className="absolute inset-0 bg-card/95 backdrop-blur-xl border-t border-border/50" />

          <div className="relative grid grid-cols-3 items-end h-full w-full">
            <Link
              href="/admin"
              className={`flex flex-col items-center justify-center gap-1 pb-2 h-full transition-all ${
                isActive("/admin")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">Dashboard</span>
            </Link>

            <Link
              href="/admin/companies"
              className={`flex flex-col items-center justify-center gap-1 pb-2 h-full transition-all ${
                isActive("/admin/companies")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">Companies</span>
            </Link>

            <Link
              href="/admin/users"
              className={`flex flex-col items-center justify-center gap-1 pb-2 h-full transition-all ${
                isActive("/admin/users")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">Users</span>
            </Link>
          </div>
        </nav>
      )}

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
