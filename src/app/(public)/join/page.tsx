"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AdminMobileHeader } from "@/components/admin/admin-sidebar";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          setIsAdmin(true);
        }
      } catch {
        // Not logged in
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAdmin();
  }, []);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) return;
    setLoading(true);
    setError("");
    try {
      // Validate session code
      const res = await fetch(`/api/sessions/join/${trimmedCode}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid session code");
        return;
      }
      // Navigate to session join page
      router.push(`/join/${trimmedCode}`);
    } catch {
      setError("Failed to validate code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Show admin mobile header/nav when logged in */}
      {isAdmin && <AdminMobileHeader />}

      <div
        className={`min-h-screen gradient-mesh flex items-center justify-center p-4 ${isAdmin ? "pt-20 pb-20 md:pt-4 md:pb-4" : ""}`}
      >
        {/* Only show theme toggle when not admin (admin has it in header) */}
        {!isAdmin && (
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
        )}
        <div className="w-full max-w-md space-y-8">
          {/* Hide logo on mobile when admin (already in header) */}
          <div className={`text-center ${isAdmin ? "hidden md:block" : ""}`}>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="AirLog"
                width={90}
                height={24}
                className="dark:hidden md:w-[150px] md:h-[40px]"
              />
              <Image
                src="/logo-dark.svg"
                alt="AirLog"
                width={90}
                height={24}
                className="hidden dark:block md:w-[150px] md:h-[40px]"
              />
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Join Test Session</CardTitle>
              <CardDescription>
                Enter the session code to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="code">Session Code</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="text-center text-lg tracking-wider h-12 font-mono uppercase"
                    maxLength={6}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || !code.trim()}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Join Session
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Show login prompt - hidden on mobile when logged in as admin */}
          <p
            className={`text-center text-sm text-muted-foreground ${isAdmin ? "hidden md:block" : ""}`}
          >
            Managing a session?{" "}
            <Link href="/admin/login" className="text-primary hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
