"use client";

import { useTheme } from "@/components/common/theme-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LockIcon, MailIcon, ArrowLeftIcon } from "lucide-react";

export default function AccountDisabledPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [contacts, setContacts] = useState<{
    companyOwnerEmail: string | null;
    superAdminEmail: string;
  } | null>(null);

  useEffect(() => {
    async function checkAccountStatus() {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const user = data.user || data;

          // If logged in and NOT disabled, go to dashboard
          if (user && !user.deleted_at && !user.banned) {
            console.log("User enabled, redirecting to dashboard");
            window.location.href = "/dashboard";
          }
        }
      } catch (e) {
        // ignore error
      }
    }

    checkAccountStatus();

    async function fetchContacts() {
      try {
        const res = await fetch("/api/users/support-contact");
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (e) {
        console.error("Failed to fetch support contacts");
      }
    }
    fetchContacts();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/users/logout", { method: "POST" });
      router.push("/login");
    } catch {
      // If logout fails, direct to login anyway
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 text-center bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-red-500/10 shadow-2xl">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6 ring-4 ring-red-50 dark:ring-red-900/10">
          <LockIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Account Disabled
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your account has been disabled by an administrator. You no longer
            have access to the platform.
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-secondary/50 rounded-lg p-4 text-left space-y-4 border border-border/50">
          <div className="flex items-start gap-3">
            <MailIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-3 w-full">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Contact Support
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Please contact your administrators to resolve this issue.
                </p>
              </div>

              {contacts && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {contacts.companyOwnerEmail && (
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Company Owner
                      </span>
                      <a
                        href={`mailto:${contacts.companyOwnerEmail}`}
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {contacts.companyOwnerEmail}
                      </a>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Platform Admin
                    </span>
                    <a
                      href={`mailto:${contacts.superAdminEmail}`}
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {contacts.superAdminEmail}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col gap-3">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 text-xs text-muted-foreground/60">
        airlog-pro.vercel.app &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
