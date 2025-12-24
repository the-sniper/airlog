"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setError(data.error || "Login is not available yet. Please try again later.");
        setLoading(false);
        return;
      }

      toast({ title: "Logged in", description: "Welcome back to AirLog." });
      router.push(callbackUrl || "/dashboard");
      router.refresh();
    } catch {
      setError("Login is not available yet. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-mesh relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
          <Image src="/logo.svg" alt="AirLog" width={120} height={32} className="dark:hidden" />
          <Image src="/logo-dark.svg" alt="AirLog" width={120} height={32} className="hidden dark:block" />
        </div>

        <Card className="glass border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
              <LogIn className="w-7 h-7 text-primary-foreground" strokeWidth={1.75} />
            </div>
            <CardTitle className="text-2xl font-bold">Log in</CardTitle>
            <CardDescription className="text-muted-foreground">
              Access your tester workspace.
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9 h-11"
                    required
                    autoComplete="email"
                  />
                </div>
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              <span>
                Don&apos;t have an account?{" "}
                <Button variant="link" className="px-1" onClick={() => router.push("/signup")}>
                  Sign up
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
