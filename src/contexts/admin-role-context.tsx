"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type AdminViewRole = "super_admin" | "owner" | "manager" | "user";

interface AdminRoleContextType {
  viewingRole: AdminViewRole;
  setViewingRole: (role: AdminViewRole) => void;
}

const AdminRoleContext = createContext<AdminRoleContextType | undefined>(
  undefined
);

const STORAGE_KEY = "admin_viewing_role";
const COOKIE_NAME = "admin_viewing_role";

// Helper to set a cookie
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Helper to get a cookie
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export function AdminRoleProvider({ children }: { children: React.ReactNode }) {
  const [viewingRole, setViewingRoleState] =
    useState<AdminViewRole>("super_admin");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from cookie on mount
  useEffect(() => {
    const stored = getCookie(COOKIE_NAME);
    if (
      stored &&
      ["super_admin", "owner", "manager", "user"].includes(stored)
    ) {
      setViewingRoleState(stored as AdminViewRole);
    }
    setIsHydrated(true);
  }, []);

  // Persist to cookie on change
  const setViewingRole = (role: AdminViewRole) => {
    setViewingRoleState(role);
    setCookie(COOKIE_NAME, role, 7);
    // Also store in localStorage as backup
    localStorage.setItem(STORAGE_KEY, role);
  };

  // Prevent hydration mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <AdminRoleContext.Provider value={{ viewingRole, setViewingRole }}>
      {children}
    </AdminRoleContext.Provider>
  );
}

export function useAdminRole() {
  const context = useContext(AdminRoleContext);
  if (context === undefined) {
    throw new Error("useAdminRole must be used within an AdminRoleProvider");
  }
  return context;
}
