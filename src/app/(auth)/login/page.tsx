"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, LogIn, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const inviteEmail = searchParams.get("inviteEmail");
  const { toast } = useToast();

  const [email, setEmail] = useState(inviteEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if this is an invite flow (has both callbackUrl with /join/ and inviteEmail)
  const isInviteFlow = inviteEmail && callbackUrl.includes("/join/");

  // Sync email state with inviteEmail param (for client-side navigation)
  useEffect(() => {
    setEmail(inviteEmail || "");
  }, [inviteEmail]);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (res.ok) {
          router.replace("/dashboard");
        }
      } catch {
        // ignore
      }
    }
    checkSession();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error || "Login is not available yet. Please try again later."
        );
        setLoading(false);
        return;
      }

      toast({ title: "Logged in", description: "Welcome back to AirLog." });
      // Use window.location for full page navigation to ensure cookie is read
      window.location.href = callbackUrl || "/dashboard";
    } catch {
      setError("Login is not available yet. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <Card className="glass border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
          <LogIn
            className="w-7 h-7 text-primary-foreground"
            strokeWidth={1.75}
          />
        </div>
        <CardTitle className="text-2xl font-bold">Log in</CardTitle>
        <CardDescription className="text-muted-foreground">
          {isInviteFlow
            ? "Sign in to access your invite"
            : "Access your tester workspace."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => !isInviteFlow && setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`pl-9 h-11 ${
                  isInviteFlow ? "bg-secondary/50 cursor-not-allowed" : ""
                }`}
                required
                autoComplete="email"
                readOnly={!!isInviteFlow}
              />
            </div>
            {isInviteFlow && (
              <p className="text-xs text-muted-foreground">
                This email matches your invite
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-10 h-11"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <div className="flex flex-col gap-2 text-sm text-center text-muted-foreground">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => router.push("/reset-password")}
          >
            Forgot password?
          </button>

          {isInviteFlow ? (
            <>
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  Want to use a different account?
                </p>
                <Link href={"/login"}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Leave invite & login differently
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <span>
                Don&apos;t have an account?{" "}
                <Button
                  variant="link"
                  className="px-1"
                  onClick={() => router.push("/signup")}
                >
                  Sign up
                </Button>
              </span>
              <p className="text-center text-xs text-muted-foreground/60 mt-6">
                <Link
                  href="/admin/login"
                  className="hover:text-primary transition-colors underline underline-offset-4"
                >
                  Login as an admin
                </Link>
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoginFormFallback() {
  return (
    <Card className="glass border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
          <LogIn
            className="w-7 h-7 text-primary-foreground"
            strokeWidth={1.75}
          />
        </div>
        <CardTitle className="text-2xl font-bold">Log in</CardTitle>
        <CardDescription className="text-muted-foreground">
          Access your tester workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-mesh relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <Link
          href="/"
          className="absolute -top-16 left-1/2 -translate-x-1/2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Image
            src="/logo.svg"
            alt="AirLog"
            width={120}
            height={32}
            className="dark:hidden"
          />
          <Image
            src="/logo-dark.svg"
            alt="AirLog"
            width={120}
            height={32}
            className="hidden dark:block"
          />
        </Link>

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
