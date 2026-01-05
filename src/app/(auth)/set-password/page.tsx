"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
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

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");

  // Password validation rules
  const passwordRules = [
    { check: password.length >= 8, label: "At least 8 characters" },
    { check: /[A-Z]/.test(password), label: "One uppercase letter" },
    { check: /[a-z]/.test(password), label: "One lowercase letter" },
    { check: /[0-9]/.test(password), label: "One number" },
  ];

  const allRulesPassed = passwordRules.every((rule) => rule.check);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    // Check if user is already logged in
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

    if (!token) {
      setError(
        "Invalid or missing token. Please request a new password setup link."
      );
      return;
    }

    if (!allRulesPassed) {
      setError("Please ensure your password meets all requirements.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to set password. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast({
        title: "Password set successfully!",
        description: "You can now log in with your new password.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (!token) {
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

          <Card className="glass border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-3 shadow-lg shadow-red-500/20">
                <XCircle className="w-7 h-7 text-white" strokeWidth={1.75} />
              </div>
              <CardTitle className="text-2xl font-bold">Invalid Link</CardTitle>
              <CardDescription className="text-muted-foreground">
                This password setup link is invalid or has expired.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-5">
              <p className="text-sm text-center text-muted-foreground">
                Please request a new password reset link or contact support for
                assistance.
              </p>
              <Button
                className="w-full h-11"
                onClick={() => router.push("/reset-password")}
              >
                Request New Link
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have a password?{" "}
                <Button
                  variant="link"
                  className="px-1"
                  onClick={() => router.push("/login")}
                >
                  Log in
                </Button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
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

          <Card className="glass border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 shadow-lg shadow-green-500/20">
                <CheckCircle2
                  className="w-7 h-7 text-white"
                  strokeWidth={1.75}
                />
              </div>
              <CardTitle className="text-2xl font-bold">
                Password Set!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your password has been set successfully.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-5">
              <p className="text-sm text-center text-muted-foreground">
                Redirecting you to the login page...
              </p>
              <Button
                className="w-full h-11"
                onClick={() => router.push("/login")}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

        <Card className="glass border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
              <Lock
                className="w-7 h-7 text-primary-foreground"
                strokeWidth={1.75}
              />
            </div>
            <CardTitle className="text-2xl font-bold">
              Set Your Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Create a secure password for your AirLog account.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-5">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-9 pr-10 h-11"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password requirements */}
              <div className="space-y-1.5 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Password requirements:
                </p>
                {passwordRules.map((rule, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-xs ${
                      rule.check
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {rule.check ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-current" />
                    )}
                    {rule.label}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-9 pr-10 h-11"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      passwordsMatch
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-500"
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Passwords match
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Passwords do not match
                      </>
                    )}
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || !allRulesPassed || !passwordsMatch}
              >
                {loading ? "Setting password..." : "Set Password"}
              </Button>
            </form>

            <p className="text-sm text-center text-muted-foreground">
              Already have a password?{" "}
              <Button
                variant="link"
                className="px-1"
                onClick={() => router.push("/login")}
              >
                Log in
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}
