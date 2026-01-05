"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Crown,
  Shield,
  ShieldCheck,
  User,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
type AdminViewRole = "super_admin" | "owner" | "manager" | "user";

// Cookie helpers
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

const roleConfig: Record<
  AdminViewRole,
  { label: string; icon: React.ElementType; color: string }
> = {
  super_admin: {
    label: "Super Admin",
    icon: ShieldCheck,
    color: "text-purple-500",
  },
  owner: {
    label: "Owner",
    icon: Crown,
    color: "text-amber-500",
  },
  manager: {
    label: "Manager",
    icon: Shield,
    color: "text-blue-500",
  },
  user: {
    label: "User",
    icon: User,
    color: "text-muted-foreground",
  },
};

export function FloatingRoleSelector() {
  const router = useRouter();
  const [viewingRole, setViewingRole] = useState<AdminViewRole | null>(null);
  const [mounted, setMounted] = useState(false);

  // Read cookie on mount
  useEffect(() => {
    setMounted(true);
    const role = getCookie("admin_viewing_role") as AdminViewRole | null;
    setViewingRole(role);
  }, []);

  // Don't render during SSR
  if (!mounted) return null;

  // Only show when impersonating (role is set and not super_admin)
  if (!viewingRole || viewingRole === "super_admin") return null;

  const currentRole = roleConfig[viewingRole];
  const CurrentIcon = currentRole.icon;

  const handleRoleChange = (role: AdminViewRole) => {
    setCookie("admin_viewing_role", role, 7);
    localStorage.setItem("admin_viewing_role", role);

    // Hard reload to appropriate dashboard
    if (role === "super_admin") {
      window.location.href = "/admin";
    } else if (role === "owner" || role === "manager") {
      window.location.href = "/company";
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleBackToAdmin = () => {
    setCookie("admin_viewing_role", "super_admin", 7);
    localStorage.setItem("admin_viewing_role", "super_admin");
    window.location.href = "/admin";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border/50 shadow-lg rounded-full px-3 py-2">
        <button
          onClick={handleBackToAdmin}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Back to Admin"
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="hidden sm:inline">Admin</span>
        </button>
        <div className="w-px h-4 bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors outline-none">
            <CurrentIcon className={`w-3 h-3 ${currentRole.color}`} />
            <span>Viewing as {currentRole.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {(Object.keys(roleConfig) as AdminViewRole[]).map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;
              const isSelected = viewingRole === role;
              return (
                <DropdownMenuItem
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isSelected ? "bg-accent" : ""
                  }`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="flex-1">{config.label}</span>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleBackToAdmin}
              className="flex items-center gap-2 cursor-pointer text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Impersonation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
