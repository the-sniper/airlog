"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Team {
  id: string;
  name: string;
  created_at: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface LoggedInUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function TeamJoinPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState<{
    member: Member;
    alreadyRegistered: boolean;
  } | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [showAuthLanding, setShowAuthLanding] = useState(false);

  useEffect(() => {
    async function initialize() {
      // First check if user is logged in
      let user: LoggedInUser | null = null;
      try {
        const userRes = await fetch("/api/users/me", { cache: "no-store" });
        if (userRes.ok) {
          user = await userRes.json();
          setLoggedInUser(user);
        }
      } catch {
        // Not logged in
      }

      // Validate the team invite
      try {
        const res = await fetch(`/api/teams/join/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Invalid invite link");
          setLoading(false);
          return;
        }

        setTeam(data.team);

        // If user is logged in, show loading and auto-join
        if (user) {
          setLoading(false);
          // Automatically join the team
          handleAutoJoin(user, data.team);
        } else {
          // Show auth landing page
          setShowAuthLanding(true);
          setLoading(false);
        }
      } catch {
        setError("Failed to validate invite link");
        setLoading(false);
      }
    }

    initialize();
  }, [token]);

  async function handleAutoJoin(user: LoggedInUser, teamData: Team) {
    setJoining(true);
    try {
      const res = await fetch(`/api/teams/join/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          user_id: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join team");
        setJoining(false);
        return;
      }

      setSuccess({
        member: data.member,
        alreadyRegistered: data.alreadyRegistered,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  if (loading || joining) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div className="h-4 w-32 bg-secondary/50 rounded" />
          <p className="text-sm text-muted-foreground">
            {joining ? "Joining team..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-mesh">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Join</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-mesh">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {success.alreadyRegistered ? "Welcome Back!" : "You're In!"}
            </h2>
            <p className="text-muted-foreground mb-2">
              {success.alreadyRegistered
                ? `You're already a member of ${team?.name}.`
                : `You've successfully joined ${team?.name}.`}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Hi {success.member.first_name}! The admin will add you to testing
              sessions when needed.
            </p>
            <Link href="/dashboard">
              <Button>
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Auth Landing Screen - shown when user is not logged in
  if (showAuthLanding && team) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-mesh relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative">
          <Card className="glass border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
                <Users
                  className="w-8 h-8 text-primary-foreground"
                  strokeWidth={1.75}
                />
              </div>
              <CardTitle className="text-2xl font-bold">
                Join {team.name}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                You&apos;ve been invited to join this team
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Team Info */}
              <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                <p className="text-sm text-muted-foreground">
                  As a team member, you&apos;ll be able to participate in
                  testing sessions organized by this team.
                </p>
              </div>

              {/* Auth Options */}
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  Sign in or create an account to join
                </p>

                <div className="grid gap-3">
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(`/teams/join/${token}`)}`}
                  >
                    <Button className="w-full h-12" size="lg">
                      <LogIn className="w-5 h-5 mr-2" />
                      Log in
                    </Button>
                  </Link>

                  <Link
                    href={`/signup?callbackUrl=${encodeURIComponent(`/teams/join/${token}`)}`}
                  >
                    <Button variant="outline" className="w-full h-12" size="lg">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            You&apos;ll be added to testing sessions by the admin
          </p>
        </div>
      </div>
    );
  }

  return null;
}
