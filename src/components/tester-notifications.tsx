"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileCheck2,
  Play,
} from "lucide-react";
import { SessionWithScenes, Tester } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";

type NotificationKind =
  | "session_added"
  | "session_started"
  | "report_sent"
  | "session_completed"
  | "session_restarted";

type Notification = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  kind: NotificationKind;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
};

const MAX_NOTIFICATIONS = 20;
const storageKeyForUser = (userId?: string | null) =>
  userId ? `tester-notifications-state-${userId}` : null;
const notificationsKeyForUser = (userId?: string | null) =>
  userId ? `tester-notifications-list-${userId}` : null;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeTimestamp(
  explicit: string | null | undefined,
  fallback: string
) {
  return explicit ?? fallback;
}

function toMs(value: string) {
  const n = new Date(value).getTime();
  return Number.isNaN(n) ? 0 : n;
}

const kindMeta: Record<
  NotificationKind,
  {
    label: string;
    icon: JSX.Element;
    badgeVariant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "active"
      | "completed";
    toastVariant?: "default" | "success" | "warning" | "destructive";
  }
> = {
  session_added: {
    label: "New Session",
    icon: <Play className="w-4 h-4 text-primary" strokeWidth={1.75} />,
    badgeVariant: "outline",
    toastVariant: "default",
  },
  session_started: {
    label: "Live",
    icon: (
      <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.75} />
    ),
    badgeVariant: "active",
    toastVariant: "success",
  },
  report_sent: {
    label: "Report",
    icon: <FileCheck2 className="w-4 h-4 text-blue-500" strokeWidth={1.75} />,
    badgeVariant: "secondary",
    toastVariant: "default",
  },
  session_completed: {
    label: "Ended",
    icon: (
      <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
    ),
    badgeVariant: "destructive",
    toastVariant: "warning",
  },
  session_restarted: {
    label: "Restarted",
    icon: <Activity className="w-4 h-4 text-sky-500" strokeWidth={1.75} />,
    badgeVariant: "default",
    toastVariant: "default",
  },
};

export function TesterNotifications({
  session,
  tester,
  userId,
  onRealtimeUpdate,
}: {
  session?: SessionWithScenes;
  tester?: Tester;
  userId?: string | null;
  onRealtimeUpdate?: () => void;
}) {
  const { toast } = useToast();
  const initialNotifications = useCallback((): Notification[] => {
    if (typeof window === "undefined") return [];
    const key = notificationsKeyForUser(userId);
    if (!key) return [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as Notification[];
      }
    } catch {
      // ignore
    }
    return [];
  }, [userId]);

  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [open, setOpen] = useState(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const sessionChannelsRef = useRef<
    Map<string, ReturnType<ReturnType<typeof createClient>["channel"]>>
  >(new Map());
  const sessionStateRef = useRef<
    Map<
      string,
      {
        started_at: string | null;
        ended_at: string | null;
        restart_count: number;
        last_restarted_at: string | null;
        status?: string | null;
        first_ended_at?: string | null;
      }
    >
  >(new Map());
  const testerStateRef = useRef<Map<string, { report_sent_at: string | null }>>(
    new Map()
  );
  const [userTesters, setUserTesters] = useState<
    Array<{ tester: Tester; session: Partial<SessionWithScenes> }>
  >([]);
  const userEmailRef = useRef<string | null>(null);
  const hydratedNotificationsRef = useRef(false);
  const persistState = useCallback(() => {
    if (!userId) return;
    const key = storageKeyForUser(userId);
    if (!key) return;
    try {
      const sessions: Record<string, any> = {};
      sessionStateRef.current.forEach((v, k) => {
        sessions[k] = v;
      });
      const testers: Record<string, any> = {};
      testerStateRef.current.forEach((v, k) => {
        testers[k] = v;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify({ sessions, testers }));
      }
    } catch {
      // ignore storage errors
    }
  }, [userId]);

  const prevSessionIdRef = useRef<string | null>(null);
  const prevStartedAtRef = useRef<string | null>(null);
  const prevReportSentAtRef = useRef<string | null>(null);
  const prevCompletedRef = useRef<boolean>(false);
  const prevRestartCountRef = useRef<number>(0);
  const recentIdsRef = useRef<Set<string>>(new Set());

  const addNotification = useCallback(
    (payload: Omit<Notification, "id" | "read">) => {
      const dedupeKey = `${payload.kind}-${payload.createdAt}`;
      if (recentIdsRef.current.has(dedupeKey)) return;
      recentIdsRef.current.add(dedupeKey);
      if (recentIdsRef.current.size > 100) {
        // Keep dedupe set bounded
        const [first] = recentIdsRef.current;
        if (first) recentIdsRef.current.delete(first);
      }

      setNotifications((prev) => {
        const next: Notification = {
          ...payload,
          id: createId(),
          read: false,
        };
        return [next, ...prev]
          .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
          .slice(0, MAX_NOTIFICATIONS);
      });

      const meta = kindMeta[payload.kind];
      const isReport = payload.kind === "report_sent";
      toast({
        title: payload.title,
        description: payload.description,
        variant: meta.toastVariant,
        action:
          isReport && payload.actionUrl ? (
            <a
              href={payload.actionUrl}
              className="text-primary underline underline-offset-2"
            >
              View report
            </a>
          ) : undefined,
      });
    },
    [toast]
  );

  // Single-session/tester mode (used on tester page)
  useEffect(() => {
    if (!session || !tester || userId) return;

    const nowIso = new Date().toISOString();
    const isNewSession = session.id !== prevSessionIdRef.current;
    const isCompleted = session.status === "completed" || !!session.ended_at;
    const restartCount = session.restart_count ?? 0;

    if (isNewSession) {
      addNotification({
        title: "Added to a new session",
        description: `You've been added to ${session.name}.`,
        createdAt: normalizeTimestamp(tester.invite_sent_at, nowIso),
        kind: "session_added",
      });
      prevSessionIdRef.current = session.id;
      prevStartedAtRef.current = null;
      prevReportSentAtRef.current = null;
      prevCompletedRef.current = false;
      prevRestartCountRef.current = restartCount;
    }

    const startedNow =
      !!session.started_at && session.started_at !== prevStartedAtRef.current;
    if (startedNow) {
      addNotification({
        title: "Session started",
        description: `${session.name} is live. You can begin testing.`,
        createdAt: normalizeTimestamp(session.started_at, nowIso),
        kind: "session_started",
      });
    }

    const reportSentNow =
      !!tester.report_sent_at &&
      tester.report_sent_at !== prevReportSentAtRef.current;
    if (reportSentNow) {
      addNotification({
        title: "Report sent",
        description: "A session report was sent to your inbox.",
        createdAt: normalizeTimestamp(tester.report_sent_at, nowIso),
        kind: "report_sent",
      });
    }

    const endedNow = isCompleted && !prevCompletedRef.current;
    if (endedNow) {
      addNotification({
        title: "Session ended",
        description:
          "This session has been closed. You can still review notes.",
        createdAt: normalizeTimestamp(session.ended_at, nowIso),
        kind: "session_completed",
      });
    }

    const restartedNow = restartCount > prevRestartCountRef.current;
    if (restartedNow) {
      addNotification({
        title: "Session restarted",
        description:
          "The facilitator restarted this session. Continue testing.",
        createdAt: normalizeTimestamp(session.last_restarted_at, nowIso),
        kind: "session_restarted",
      });
    }

    prevStartedAtRef.current = session.started_at;
    prevReportSentAtRef.current = tester.report_sent_at;
    prevCompletedRef.current = isCompleted;
    prevRestartCountRef.current = restartCount;
  }, [session, tester, addNotification, userId]);

  useEffect(() => {
    if (!session?.id || !tester?.id || userId) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;
    const channel = supabase.channel(
      `tester-notifications-${tester.id}-${session.id}`
    );

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updated = payload.new as Partial<SessionWithScenes> & {
            restart_count?: number;
          };
          const nowIso = new Date().toISOString();

          if (
            updated.started_at &&
            updated.started_at !== prevStartedAtRef.current
          ) {
            addNotification({
              title: "Session started",
              description: `${session.name} is live. You can begin testing.`,
              createdAt: normalizeTimestamp(updated.started_at, nowIso),
              kind: "session_started",
            });
            prevStartedAtRef.current = updated.started_at;
          }

          const restartCount =
            updated.restart_count ?? prevRestartCountRef.current ?? 0;
          if (restartCount > prevRestartCountRef.current) {
            addNotification({
              title: "Session restarted",
              description:
                "The facilitator restarted this session. Continue testing.",
              createdAt: normalizeTimestamp(updated.last_restarted_at, nowIso),
              kind: "session_restarted",
            });
            prevRestartCountRef.current = restartCount;
          }

          const ended =
            updated.status === "completed" ||
            !!updated.ended_at ||
            !!updated.first_ended_at;
          if (ended && !prevCompletedRef.current) {
            addNotification({
              title: "Session ended",
              description:
                "This session has been closed. You can still review notes.",
              createdAt: normalizeTimestamp(updated.ended_at, nowIso),
              kind: "session_completed",
            });
            prevCompletedRef.current = true;
          }

          onRealtimeUpdate?.();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "testers",
          filter: `id=eq.${tester.id}`,
        },
        (payload) => {
          const updated = payload.new as Partial<Tester>;
          const nowIso = new Date().toISOString();

          if (
            updated.report_sent_at &&
            updated.report_sent_at !== prevReportSentAtRef.current
          ) {
            addNotification({
              title: "Report sent",
              description: "A session report was sent to your inbox.",
              createdAt: normalizeTimestamp(updated.report_sent_at, nowIso),
              kind: "report_sent",
            });
            prevReportSentAtRef.current = updated.report_sent_at;
          }

          onRealtimeUpdate?.();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          onRealtimeUpdate?.();
        }
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[TesterNotifications] Realtime status:", status, {
            testerId: tester.id,
            sessionId: session.id,
          });
        }
      });

    return () => {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[TesterNotifications] Cleaning up realtime channel", {
          testerId: tester.id,
          sessionId: session.id,
        });
      }
      supabase.removeChannel(channel);
    };
  }, [
    session?.id,
    tester?.id,
    session?.name,
    addNotification,
    onRealtimeUpdate,
    userId,
  ]);

  useEffect(() => {
    if (!tester?.email || userId) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;
    const channel = supabase.channel(`tester-invite-watch-${tester.email}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "insert",
          schema: "public",
          table: "testers",
          filter: `email=eq.${tester.email}`,
        },
        async (payload) => {
          const newTester = payload.new as Tester;
          if (!newTester?.invite_token) return;
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.log(
              "[TesterNotifications] New tester invite detected",
              newTester
            );
          }

          let sessionName = "a new session";
          try {
            const res = await fetch(
              `/api/join/${newTester.invite_token}?t=${Date.now()}`,
              { cache: "no-store" }
            );
            if (res.ok) {
              const details = await res.json();
              sessionName = details?.session?.name || sessionName;
            }
          } catch (err) {
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.log(
                "[TesterNotifications] Failed to fetch new session details",
                err
              );
            }
          }

          addNotification({
            title: "Added to a new session",
            description: `You've been added to ${sessionName}.`,
            createdAt: normalizeTimestamp(
              newTester.invite_sent_at,
              newTester.created_at || new Date().toISOString()
            ),
            kind: "session_added",
          });
        }
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[TesterNotifications] Invite watch status:", status, {
            email: tester.email,
          });
        }
      });

    return () => {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[TesterNotifications] Cleaning up invite watch", {
          email: tester.email,
        });
      }
      supabase.removeChannel(channel);
    };
  }, [tester?.email, addNotification, userId]);

  useEffect(() => {
    const stableUserId = userId ?? tester?.user_id ?? null;
    if (!stableUserId) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;
    const channel = supabase.channel(`tester-user-watch-${stableUserId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "insert",
          schema: "public",
          table: "testers",
          filter: `user_id=eq.${stableUserId}`,
        },
        async (payload) => {
          const newTester = payload.new as Tester;
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.log(
              "[TesterNotifications] User-linked tester inserted",
              newTester
            );
          }

          let sessionName = "a new session";
          try {
            const res = await fetch(
              `/api/join/${newTester.invite_token}?t=${Date.now()}`,
              { cache: "no-store" }
            );
            if (res.ok) {
              const details = await res.json();
              sessionName = details?.session?.name || sessionName;
            }
          } catch (err) {
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.log(
                "[TesterNotifications] Failed to fetch session for user-linked tester",
                err
              );
            }
          }

          addNotification({
            title: "Added to a new session",
            description: `You've been added to ${sessionName}.`,
            createdAt: normalizeTimestamp(
              newTester.invite_sent_at,
              newTester.created_at || new Date().toISOString()
            ),
            kind: "session_added",
          });
        }
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[TesterNotifications] User watch status:", status, {
            userId: stableUserId,
          });
        }
      });

    return () => {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[TesterNotifications] Cleaning up user watch", {
          userId: stableUserId,
        });
      }
      supabase.removeChannel(channel);
    };
  }, [userId, tester?.user_id, addNotification]);

  useEffect(() => {
    if (open && notifications.some((n) => !n.read)) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [open, notifications]);

  // Hydrate last notifications to avoid clearing list on refresh
  useEffect(() => {
    if (!userId) return;
    const key = notificationsKeyForUser(userId);
    if (!key) return;
    if (notifications.length > 0) {
      hydratedNotificationsRef.current = true;
      return;
    }
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Notification[];
        setNotifications(parsed);
        hydratedNotificationsRef.current = true;
      }
    } catch {
      // ignore bad cache
    }
  }, [userId, notifications.length]);

  // Persist notifications list for user
  useEffect(() => {
    if (!userId) return;
    if (!hydratedNotificationsRef.current && notifications.length === 0) return;
    const key = notificationsKeyForUser(userId);
    if (!key) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          key,
          JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS))
        );
      }
    } catch {
      // ignore storage errors
    }
  }, [notifications, userId]);

  // Hydrate last seen state to avoid re-firing notifications on refresh
  useEffect(() => {
    if (!userId) return;
    const key = storageKeyForUser(userId);
    if (!key) return;
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as {
          sessions?: Record<
            string,
            {
              started_at: string | null;
              ended_at: string | null;
              restart_count: number;
              last_restarted_at: string | null;
              status?: string | null;
              first_ended_at?: string | null;
            }
          >;
          testers?: Record<string, { report_sent_at: string | null }>;
        };
        if (parsed.sessions) {
          Object.entries(parsed.sessions).forEach(([sid, state]) => {
            sessionStateRef.current.set(sid, state);
          });
        }
        if (parsed.testers) {
          Object.entries(parsed.testers).forEach(([tid, state]) => {
            testerStateRef.current.set(tid, state);
          });
        }
      }
    } catch {
      // ignore corrupt cache
    }
  }, [userId]);

  useEffect(() => {
    if (!onRealtimeUpdate) return;
    const interval = setInterval(() => onRealtimeUpdate(), 8000);
    return () => clearInterval(interval);
  }, [onRealtimeUpdate]);

  // User-level mode: subscribe to all testers for this user and per-session changes
  useEffect(() => {
    if (!userId) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;
    let pollTimer: NodeJS.Timeout | null = null;
    let mounted = true;

    const processTesterSnapshot = (testerRecord: any) => {
      const testerObj = testerRecord as Tester;
      const sessionObj = (testerRecord.session ||
        {}) as Partial<SessionWithScenes> & { id?: string };
      const sessionId = sessionObj.id || testerObj.session_id;
      const nowIso = new Date().toISOString();

      // Session added
      const prevSessionState = sessionStateRef.current.get(sessionId || "");
      if (!prevSessionState) {
        addNotification({
          title: "Added to a new session",
          description: `You've been added to ${
            sessionObj.name || "a new session"
          }.`,
          createdAt: normalizeTimestamp(
            testerObj.invite_sent_at,
            testerObj.created_at || nowIso
          ),
          kind: "session_added",
        });
      }

      // Session started
      if (
        sessionId &&
        sessionObj.started_at &&
        sessionObj.started_at !== prevSessionState?.started_at
      ) {
        addNotification({
          title: "Session started",
          description: `${
            sessionObj.name || "Session"
          } is live. You can begin testing.`,
          createdAt: normalizeTimestamp(sessionObj.started_at, nowIso),
          kind: "session_started",
        });
      }

      // Session restarted
      const restartCount = sessionObj.restart_count ?? 0;
      if (
        sessionId &&
        prevSessionState &&
        restartCount > (prevSessionState.restart_count ?? 0)
      ) {
        addNotification({
          title: "Session restarted",
          description:
            "The facilitator restarted this session. Continue testing.",
          createdAt: normalizeTimestamp(sessionObj.last_restarted_at, nowIso),
          kind: "session_restarted",
        });
      }

      // Session ended
      const ended =
        !!sessionObj.ended_at ||
        sessionObj.status === "completed" ||
        !!sessionObj.first_ended_at;
      const wasEnded =
        !!prevSessionState?.ended_at ||
        prevSessionState?.status === "completed" ||
        !!prevSessionState?.first_ended_at;
      const endedChanged =
        (sessionObj.ended_at &&
          sessionObj.ended_at !== prevSessionState?.ended_at) ||
        (sessionObj.first_ended_at &&
          sessionObj.first_ended_at !== prevSessionState?.first_ended_at) ||
        (sessionObj.status === "completed" &&
          prevSessionState?.status !== "completed");
      if (sessionId && ended && (!wasEnded || endedChanged)) {
        addNotification({
          title: "Session ended",
          description:
            "This session has been closed. You can still review notes.",
          createdAt: normalizeTimestamp(sessionObj.ended_at, nowIso),
          kind: "session_completed",
        });
      }

      // Report sent
      const prevTester = testerStateRef.current.get(testerObj.id);
      if (
        testerObj.report_sent_at &&
        testerObj.report_sent_at !== prevTester?.report_sent_at
      ) {
        addNotification({
          title: "Report sent",
          description: "A session report was sent to your inbox.",
          createdAt: normalizeTimestamp(testerObj.report_sent_at, nowIso),
          kind: "report_sent",
          actionUrl: `/report/${sessionId || testerObj.session_id}`,
          actionLabel: "View report",
        });
      }

      // Update state trackers
      if (sessionId) {
        sessionStateRef.current.set(sessionId, {
          started_at: sessionObj.started_at ?? null,
          ended_at: sessionObj.ended_at ?? null,
          restart_count: restartCount,
          last_restarted_at: sessionObj.last_restarted_at ?? null,
          status: sessionObj.status ?? null,
          first_ended_at: sessionObj.first_ended_at ?? null,
        });
      }
      testerStateRef.current.set(testerObj.id, {
        report_sent_at: testerObj.report_sent_at ?? null,
      });
      persistState();
    };

    const loadTesters = async () => {
      if (!mounted) return;
      try {
        const res = await fetch("/api/users/testers", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data.testers)) {
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.log("[TesterNotifications] Loaded testers for user", {
              count: data.testers.length,
            });
          }
          const firstWithEmail = data.testers.find((t: any) => t.email);
          if (firstWithEmail?.email) {
            userEmailRef.current = (firstWithEmail.email as string).toLowerCase();
          }
          setUserTesters(
            data.testers.map((t: any) => ({
              tester: t as Tester,
              session: (t.session || {}) as Partial<SessionWithScenes>,
            }))
          );
          data.testers.forEach(processTesterSnapshot);
          persistState();
        } else if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[TesterNotifications] Failed to load testers", {
            status: res.status,
            data,
          });
        }
      } catch {
        // ignore
      }
    };

    loadTesters();
    pollTimer = setInterval(loadTesters, 5000);

    const onFocus = () => loadTesters();
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadTesters();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    let emailChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    if (userEmailRef.current) {
      emailChannel = supabase.channel(`tester-email-watch-${userEmailRef.current}`);
      emailChannel
        .on(
          "postgres_changes",
          { event: "insert", schema: "public", table: "testers", filter: `email=eq.${userEmailRef.current}` },
          async (payload) => {
            const newTester = payload.new as Tester;
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.log("[TesterNotifications] Email watcher invite", newTester);
            }
            let sessionName = "a new session";
            try {
              if ((newTester as any).invite_token) {
                const res = await fetch(`/api/join/${(newTester as any).invite_token}?t=${Date.now()}`, { cache: "no-store" });
                if (res.ok) {
                  const details = await res.json();
                  sessionName = details?.session?.name || sessionName;
                }
              }
            } catch {}

            addNotification({
              title: "Added to a new session",
              description: `You've been added to ${sessionName}.`,
              createdAt: normalizeTimestamp((payload.new as any).invite_sent_at, (payload.new as any).created_at || new Date().toISOString()),
              kind: "session_added",
            });

            await loadTesters();
          }
        )
        .subscribe();
    }

    const userChannel = supabase.channel(`tester-user-watch-${userId}-any`);
    userChannel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "testers",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newTester = payload.new as Tester & {
            session_id?: string;
            invite_token?: string;
          };
          if (payload.eventType === "INSERT") {
            let sessionName = "a new session";
            try {
              if ((newTester as any).invite_token) {
                const res = await fetch(
                  `/api/join/${
                    (newTester as any).invite_token
                  }?t=${Date.now()}`,
                  { cache: "no-store" }
                );
                if (res.ok) {
                  const details = await res.json();
                  sessionName = details?.session?.name || sessionName;
                }
              }
            } catch {}

            addNotification({
              title: "Added to a new session",
              description: `You've been added to ${sessionName}.`,
              createdAt: normalizeTimestamp(
                (payload.new as any).invite_sent_at,
                (payload.new as any).created_at || new Date().toISOString()
              ),
              kind: "session_added",
            });
            await loadTesters();
          }

          if (payload.eventType === "UPDATE") {
            // refetch the session state and process diff
            await loadTesters();
          }
        }
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(
            "[TesterNotifications] User aggregate watch status:",
            status,
            { userId }
          );
        }
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          // Force a reload to avoid missed events
          loadTesters();
        }
      });

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (emailChannel) supabase.removeChannel(emailChannel);
      supabase.removeChannel(userChannel);
    };
  }, [userId, addNotification, persistState]);

  // Manage per-session subscriptions for user-level mode
  useEffect(() => {
    if (!userId) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;
    const sessionIds = Array.from(
      new Set(
        userTesters
          .map((t) => t.session?.id || t.tester.session_id)
          .filter(Boolean) as string[]
      )
    );

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[TesterNotifications] Session subscriptions", {
        sessionIds,
      });
    }

    sessionIds.forEach((sessionId) => {
      if (sessionChannelsRef.current.has(sessionId)) return;
      const channel = supabase.channel(`tester-session-watch-${sessionId}`);
      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sessions",
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            const updated = payload.new as Partial<SessionWithScenes> & {
              restart_count?: number;
              id: string;
            };
            const prev = sessionStateRef.current.get(sessionId) || {
              started_at: null,
              ended_at: null,
              restart_count: 0,
              last_restarted_at: null,
              status: null,
              first_ended_at: null,
            };
            const nowIso = new Date().toISOString();

            if (updated.started_at && updated.started_at !== prev.started_at) {
              addNotification({
                title: "Session started",
                description: `${
                  updated.name || "Session"
                } is live. You can begin testing.`,
                createdAt: normalizeTimestamp(updated.started_at, nowIso),
                kind: "session_started",
              });
            }

            const restartCount =
              updated.restart_count ?? prev.restart_count ?? 0;
            if (restartCount > (prev.restart_count ?? 0)) {
              addNotification({
                title: "Session restarted",
                description:
                  "The facilitator restarted this session. Continue testing.",
                createdAt: normalizeTimestamp(
                  updated.last_restarted_at,
                  nowIso
                ),
                kind: "session_restarted",
              });
            }

            const ended =
              updated.status === "completed" ||
              !!updated.ended_at ||
              !!updated.first_ended_at;
            if (
              ended &&
              !(
                prev.ended_at ||
                prev.status === "completed" ||
                prev.first_ended_at
              )
            ) {
              addNotification({
                title: "Session ended",
                description:
                  "This session has been closed. You can still review notes.",
                createdAt: normalizeTimestamp(updated.ended_at, nowIso),
                kind: "session_completed",
              });
            }

            sessionStateRef.current.set(sessionId, {
              started_at: updated.started_at ?? null,
              ended_at: updated.ended_at ?? null,
              restart_count: restartCount,
              last_restarted_at: updated.last_restarted_at ?? null,
              status: updated.status ?? null,
              first_ended_at: updated.first_ended_at ?? null,
            });
            persistState();
          }
        )
        .subscribe();

      sessionChannelsRef.current.set(sessionId, channel);
    });

    sessionChannelsRef.current.forEach((channel, sessionId) => {
      if (!sessionIds.includes(sessionId)) {
        supabase.removeChannel(channel);
        sessionChannelsRef.current.delete(sessionId);
      }
    });

    return () => {
      sessionChannelsRef.current.forEach((channel) =>
        supabase.removeChannel(channel)
      );
      sessionChannelsRef.current.clear();
    };
  }, [userId, userTesters, addNotification]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (userId) {
      const key = notificationsKeyForUser(userId);
      if (key && typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify([]));
      }
    }
  }, [userId]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground flex items-center justify-center leading-none shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[320px] p-0 overflow-hidden rounded-xl border-border/60"
      >
        <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between bg-muted/30">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              Tester updates and critical alerts
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary">Unread {unreadCount}</Badge>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={clearNotifications}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">
              You&apos;re all caught up!
            </div>
          ) : (
            notifications.map((notification) => {
              const meta = kindMeta[notification.kind];
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 px-4 py-3 cursor-default"
                >
                  <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-muted/50 flex items-center justify-center">
                    {meta.icon}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold leading-tight">
                        {notification.title}
                      </p>
                      {/* <Badge variant={meta.badgeVariant}>{meta.label}</Badge> */}
                      {notification.kind === "report_sent" &&
                        notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="text-[11px] font-semibold text-primary hover:underline ml-auto"
                          >
                            {notification.actionLabel || "View"}
                          </a>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                      {notification.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {formatTimestamp(notification.createdAt)}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
