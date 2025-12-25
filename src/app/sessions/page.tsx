"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TesterHeader } from "@/components/tester-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Play,
    CheckCircle2,
    Clock,
    ChevronRight,
    Mic,
    ExternalLink,
    Clipboard,
    Filter,
    Loader2
} from "lucide-react";

interface Session {
    id: string;
    name: string;
    status: string;
    inviteToken: string;
    createdAt: string;
    startedAt: string | null;
    endedAt: string | null;
    shareToken: string | null;
    notesCount: number;
}

interface MeResponse {
    user?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
    };
}

interface DashboardResponse {
    recentSessions: Session[];
    sessions: {
        total: number;
        active: number;
        completed: number;
        pending: number;
    };
}

type FilterType = "all" | "active" | "completed" | "pending";

function getStatusConfig(status: string) {
    switch (status) {
        case "active":
            return {
                label: "Active",
                icon: Play,
                className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
                pulse: true,
            };
        case "completed":
            return {
                label: "Completed",
                icon: CheckCircle2,
                className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                pulse: false,
            };
        default:
            return {
                label: "Pending",
                icon: Clock,
                className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                pulse: false,
            };
    }
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
    { key: "pending", label: "Pending" },
];

export default function SessionsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<MeResponse["user"] | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [filter, setFilter] = useState<FilterType>("all");
    const [counts, setCounts] = useState({ total: 0, active: 0, completed: 0, pending: 0 });

    useEffect(() => {
        let mounted = true;

        async function fetchData() {
            try {
                const meRes = await fetch("/api/users/me", { cache: "no-store" });
                const meData: MeResponse = await meRes.json();

                if (!mounted) return;

                if (!meRes.ok || !meData.user) {
                    router.push("/login");
                    return;
                }

                setUser(meData.user);

                // Fetch all sessions (we'll need to update the API to return all, not just 5)
                const dashRes = await fetch("/api/users/dashboard", { cache: "no-store" });

                if (dashRes.ok) {
                    const data: DashboardResponse = await dashRes.json();
                    setSessions(data.recentSessions || []);
                    setCounts(data.sessions);
                }
            } catch (err) {
                console.error("Failed to load sessions:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchData();

        return () => { mounted = false; };
    }, [router]);

    const filteredSessions = sessions.filter(s => {
        if (filter === "all") return true;
        if (filter === "pending") return s.status === "draft";
        return s.status === filter;
    });

    if (loading) {
        return (
            <div className="min-h-screen gradient-mesh flex flex-col">
                <div className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm" />
                <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
                    <div className="space-y-6 animate-pulse">
                        {/* Header skeleton */}
                        <div className="h-16 rounded-lg bg-muted/30" />
                        {/* Filter tabs skeleton */}
                        <div className="h-12 rounded-lg bg-muted/30" />
                        {/* Sessions list skeleton */}
                        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-20 rounded-xl bg-secondary/30" />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-mesh flex flex-col">
            <TesterHeader user={user} />

            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Your Sessions</h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                Manage and access all your testing sessions
                            </p>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {FILTER_OPTIONS.map(({ key, label }) => {
                            const count = key === "all" ? counts.total :
                                key === "pending" ? counts.pending :
                                    counts[key as keyof typeof counts];
                            return (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    flex items-center gap-2 whitespace-nowrap
                    ${filter === key
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        }
                  `}
                                >
                                    {label}
                                    <span className={`
                    text-xs px-1.5 py-0.5 rounded-full
                    ${filter === key
                                            ? "bg-primary-foreground/20 text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                        }
                  `}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Sessions List */}
                    <Card className="glass border-border/50">
                        <CardContent className="pt-6">
                            {filteredSessions.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                        <Clipboard className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold mb-2">No {filter !== "all" ? filter : ""} sessions</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                        {filter === "active"
                                            ? "You don't have any active sessions right now."
                                            : filter === "completed"
                                                ? "You haven't completed any sessions yet."
                                                : filter === "pending"
                                                    ? "No pending sessions waiting to start."
                                                    : "You haven't been invited to any sessions yet."
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredSessions.map((session) => {
                                        const statusConfig = getStatusConfig(session.status);
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <div
                                                key={session.id}
                                                className="group p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 border border-transparent hover:border-border/50"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h4 className="font-medium truncate">{session.name}</h4>
                                                            <Badge
                                                                className={`${statusConfig.className} text-xs flex items-center gap-1`}
                                                            >
                                                                {statusConfig.pulse && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                                )}
                                                                {statusConfig.label}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                            <span>Added {formatDate(session.createdAt)}</span>
                                                            {session.notesCount > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mic className="w-3 h-3" />
                                                                    {session.notesCount} note{session.notesCount !== 1 ? "s" : ""}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {session.status === "active" && (
                                                            <Link href={`/join/${session.inviteToken}`}>
                                                                <Button size="sm" className="gap-1.5">
                                                                    Join Session
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {session.status === "completed" && session.shareToken && (
                                                            <Link href={`/report/${session.shareToken}`}>
                                                                <Button size="sm" variant="outline" className="gap-1.5">
                                                                    View Report
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {session.status === "draft" && (
                                                            <span className="text-xs text-muted-foreground px-2">
                                                                Waiting to start
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
