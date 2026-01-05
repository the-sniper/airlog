"use client";

import { ChevronDown, Crown, Shield, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminRole, AdminViewRole } from "@/contexts/admin-role-context";

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

export function RoleSelector() {
  const router = useRouter();
  const { viewingRole, setViewingRole } = useAdminRole();
  const currentRole = roleConfig[viewingRole];
  const CurrentIcon = currentRole.icon;

  const handleRoleChange = (role: AdminViewRole) => {
    setViewingRole(role);

    // Hard reload to appropriate dashboard
    if (role === "super_admin") {
      window.location.href = "/admin";
    } else if (role === "owner" || role === "manager") {
      window.location.href = "/company";
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors outline-none">
        <CurrentIcon className={`w-3 h-3 ${currentRole.color}`} />
        <span>{currentRole.label}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
