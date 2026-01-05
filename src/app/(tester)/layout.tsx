"use client";

import { TesterHeader } from "@/components/tester/tester-header";
import { useState, useEffect } from "react";

export default function TesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company?: {
      id: string;
      name: string;
      logo_url: string | null;
    } | null;
  } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const userData = data.user || data;

          if (
            (userData.deleted_at || userData.banned) &&
            typeof window !== "undefined"
          ) {
            window.location.href = "/account-disabled";
            return;
          }

          setUser(userData);
        }
      } catch {
        // Ignore - user not logged in
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Topographic contour lines pattern */}
      <div
        className="fixed inset-0 -z-30 opacity-[0.05] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%2364748b' stroke-width='1'%3E%3Ccircle cx='400' cy='400' r='200'/%3E%3Ccircle cx='400' cy='400' r='150'/%3E%3Ccircle cx='400' cy='400' r='100'/%3E%3Ccircle cx='400' cy='400' r='50'/%3E%3Ccircle cx='400' cy='400' r='250'/%3E%3Ccircle cx='400' cy='400' r='300'/%3E%3Ccircle cx='400' cy='400' r='350'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "400px 400px",
        }}
      />

      {/* Gradient orbs */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{
            background:
              "radial-gradient(circle, rgba(20, 184, 166, 0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 -left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      <TesterHeader user={user} />
      <main className="min-h-screen relative z-10 pwa-main-offset">
        {children}
      </main>
    </div>
  );
}
