"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Users2, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
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
      // Sessions is active for /admin and /admin/sessions/*
      return pathname === "/admin" || pathname.startsWith("/admin/sessions");
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
            <span className="font-semibold tracking-tight">Echo Test</span>
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
            <LayoutGrid className="w-4 h-4" strokeWidth={1.75} />
            Sessions
          </Link>
          <Link 
            href="/admin/teams" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/admin/teams") 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Users2 className="w-4 h-4" strokeWidth={1.75} />
            Teams
          </Link>
        </nav>
        <div className="p-4 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
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
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
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

export function AdminMobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname.startsWith("/admin/sessions");
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <>
      {/* Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border/50 bg-card/80 glass z-50">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-semibold tracking-tight">Echo Test</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="w-5 h-5" strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border/50 bg-card/80 glass z-40">
        <div className="flex items-center justify-around h-full">
          <Link 
            href="/admin" 
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
              isActive("/admin") 
                ? "text-primary" 
                : "text-muted-foreground"
            }`}
          >
            <LayoutGrid className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-xs font-medium">Sessions</span>
          </Link>
          <Link 
            href="/admin/teams" 
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
              isActive("/admin/teams") 
                ? "text-primary" 
                : "text-muted-foreground"
            }`}
          >
            <Users2 className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-xs font-medium">Teams</span>
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
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
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
