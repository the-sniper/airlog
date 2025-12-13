"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Users2, LogOut, UserPlus, Menu, Bell, Settings, Moon, Sun } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
            <Image src="/logo.svg" alt="AirLog" width={120} height={32} className="dark:hidden" />
            <Image src="/logo-dark.svg" alt="AirLog" width={120} height={32} className="hidden dark:block" />
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
            <Image src="/logo.svg" alt="AirLog" width={90} height={24} className="dark:hidden" />
            <Image src="/logo-dark.svg" alt="AirLog" width={90} height={24} className="hidden dark:block" />
          </Link>
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
            >
              <Bell className="w-5 h-5" strokeWidth={1.75} />
            </Button>
            
            {/* Hamburger Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Menu className="w-5 h-5" strokeWidth={1.75} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                    <LayoutGrid className="w-4 h-4" />
                    <span>Sessions</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/teams" className="flex items-center gap-2 cursor-pointer">
                    <Users2 className="w-4 h-4" />
                    <span>Teams</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span>Theme</span>
                    </div>
                    <ThemeToggle />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 z-40">
        {/* Background with notch cutout effect */}
        <div className="absolute inset-0 bg-card/95 backdrop-blur-xl border-t border-border/50" />
        
        <div className="relative flex items-center justify-around h-full px-6">
          <Link 
            href="/admin" 
            className={`flex flex-col items-center gap-1 py-2 transition-all ${
              isActive("/admin") 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Sessions</span>
          </Link>
          
          {/* Prominent Join Button */}
          <Link 
            href="/join" 
            className="flex flex-col items-center -mt-8"
          >
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/40 rounded-full blur-xl group-hover:blur-2xl transition-all" />
              {/* Outer ring */}
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-primary to-primary/80 p-[3px] shadow-xl shadow-primary/25">
                {/* Inner button */}
                <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
                  <UserPlus className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-primary mt-1">Join</span>
          </Link>
          
          <Link 
            href="/admin/teams" 
            className={`flex flex-col items-center gap-1 py-2 transition-all ${
              isActive("/admin/teams") 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users2 className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Teams</span>
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
