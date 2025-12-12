"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, LayoutGrid, Users2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AdminSidebar() {
  const pathname = usePathname();
  
  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === "/admin") {
      // Sessions is active for /admin and /admin/sessions/*
      return pathname === "/admin" || pathname.startsWith("/admin/sessions");
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-border/50 bg-card/30 hidden md:block">
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3">
            {/* <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Mic className="w-4 h-4 text-white" strokeWidth={2} />
            </div> */}
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
        <div className="p-4 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

export function AdminMobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border/50 bg-card/50 glass z-50">
      <div className="flex items-center justify-between h-full px-4">
        <Link href="/" className="flex items-center gap-3">
          {/* <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Mic className="w-4 h-4 text-white" strokeWidth={2} />
          </div> */}
          <span className="font-semibold tracking-tight">Echo Test</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
