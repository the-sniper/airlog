"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  UserX,
} from "lucide-react";
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

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const inviteEmail = searchParams.get("inviteEmail");
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(inviteEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if this is an invite flow
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
          router.replace(callbackUrl);
        }
      } catch {
        // ignore
      }
    }
    checkSession();
  }, [router, callbackUrl]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error || "Signup is not available yet. Please try again later.",
        );
        setLoading(false);
        return;
      }

      toast({ title: "Account created", description: "Welcome to AirLog!" });
      // Auto-login is handled by the API - redirect to callback URL
      window.location.href = callbackUrl;
    } catch {
      setError("Signup is not available yet. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <Card className="glass border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
          <ShieldCheck
            className="w-7 h-7 text-primary-foreground"
            strokeWidth={1.75}
          />
        </div>
        <CardTitle className="text-2xl font-bold">
          Create your account
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Join AirLog with your work email.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Areef"
                  className="pl-9 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Syed"
                  className="pl-9 h-11"
                  required
                />
              </div>
            </div>
          </div>

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
                className={`pl-9 h-11 ${isInviteFlow ? "bg-secondary/50 cursor-not-allowed" : ""}`}
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
                autoComplete="new-password"
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
            <p className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11"
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        {isInviteFlow ? (
          <div className="space-y-2 text-sm text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                className="px-1"
                onClick={() =>
                  router.push(
                    `/login?callbackUrl=${encodeURIComponent(callbackUrl)}&inviteEmail=${encodeURIComponent(inviteEmail || "")}`,
                  )
                }
              >
                Log in
              </Button>
            </p>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">
                Want to use a different account?
              </p>
              <Link href={"/signup"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Leave invite & signup differently
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Button
              variant="link"
              className="px-1"
              onClick={() =>
                router.push(
                  `/login${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`,
                )
              }
            >
              Log in
            </Button>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SignupFormFallback() {
  return (
    <Card className="glass border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
          <ShieldCheck
            className="w-7 h-7 text-primary-foreground"
            strokeWidth={1.75}
          />
        </div>
        <CardTitle className="text-2xl font-bold">
          Create your account
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Join AirLog with your work email.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-60 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-mesh relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
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
        </div>

        <Suspense fallback={<SignupFormFallback />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
