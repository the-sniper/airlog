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
  } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // API returns { user: {...} }, extract the user object
          setUser(data.user || data);
        }
      } catch {
        // Ignore - user not logged in
      }
    }
    fetchUser();
  }, []);

  return (
    <>
      <TesterHeader user={user} />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </>
  );
}
