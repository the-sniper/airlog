"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SessionWithScenes, Tester } from "@/types";
import { useToast } from "@/components/ui/use-toast";

export type NotificationKind =
  | "session_added"
  | "session_started"
  | "report_sent"
  | "session_completed"
  | "session_restarted"
  | "join_request_approved"
  | "join_request_rejected";

const toastVariantMap: Record<
  NotificationKind,
  "default" | "success" | "warning" | "destructive"
> = {
  session_added: "default",
  session_started: "success",
  report_sent: "default",
  session_completed: "warning",
  session_restarted: "default",
  join_request_approved: "success",
  join_request_rejected: "destructive",
};

export type Notification = {
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
// Revert to faster polling to ensure new invites (which require API backfill of user_id) are detected quickly.
const POLLING_INTERVAL = 5000;
const PARENT_POLL_INTERVAL = 10000;

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

function normalizeTimestamp(
  explicit: string | null | undefined,
  fallback: string,
) {
  return explicit ?? fallback;
}

function toMs(value: string) {
  const n = new Date(value).getTime();
  return Number.isNaN(n) ? 0 : n;
}

interface UseTesterNotificationsProps {
  session?: SessionWithScenes;
  tester?: Tester;
  userId?: string | null;
  onRealtimeUpdate?: () => void;
}

export function useTesterNotifications({
  session,
  tester,
  userId,
  onRealtimeUpdate,
}: UseTesterNotificationsProps) {
  // CRITICAL DEBUG: Log hook initialization
  console.log("[TesterNotifications] ========== HOOK CALLED ==========", {
    userId,
    hasSession: !!session,
    hasTester: !!tester,
  });

  const { toast } = useToast();

  // -- State Initialization --
  const initialNotifications = useCallback((): Notification[] => {
    if (typeof window === "undefined") return [];
    const key = notificationsKeyForUser(userId);
    if (!key) return [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as Notification[];
    } catch {}
    return [];
  }, [userId]);

  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  // Tracked State for Diffing
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

  const testerStateRef = useRef<
    Map<
      string,
      { report_sent_at: string | null; invite_sent_at: string | null }
    >
  >(new Map());

  const [userTesters, setUserTesters] = useState<
    Array<{ tester: Tester; session: Partial<SessionWithScenes> }>
  >([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const hydratedNotificationsRef = useRef(false);

  const recentIdsRef = useRef<Set<string>>(new Set());
  const sessionChannelsRef = useRef<
    Map<string, ReturnType<ReturnType<typeof createClient>["channel"]>>
  >(new Map());

  // -- Helpers --

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
    } catch {}
  }, [userId]);

  const addNotification = useCallback(
    (payload: Omit<Notification, "id" | "read">) => {
      const dedupeKey = `${payload.kind}-${payload.createdAt}`;
      if (recentIdsRef.current.has(dedupeKey)) return;
      recentIdsRef.current.add(dedupeKey);

      if (recentIdsRef.current.size > 100) {
        // Fix Set iteration lint by avoiding destructuring
        const first = recentIdsRef.current.values().next().value;
        if (first) recentIdsRef.current.delete(first);
      }

      setNotifications((prev) => {
        const next: Notification = { ...payload, id: createId(), read: false };
        return [next, ...prev]
          .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
          .slice(0, MAX_NOTIFICATIONS);
      });

      const variant = toastVariantMap[payload.kind];
      toast({
        title: payload.title,
        description: payload.description,
        variant: variant,
      });
    },
    [],
  );

  // -- Persistence & Hydration Effects --

  // Hydrate notifications on mount/userId change
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
        setNotifications(JSON.parse(raw));
        hydratedNotificationsRef.current = true;
      }
    } catch {}
  }, [userId, notifications.length]);

  // Persist notifications list
  useEffect(() => {
    if (!userId) return;
    if (!hydratedNotificationsRef.current && notifications.length === 0) return;
    const key = notificationsKeyForUser(userId);
    if (!key) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          key,
          JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)),
        );
      }
    } catch {}
  }, [notifications, userId]);

  // Hydrate diffing state
  useEffect(() => {
    if (!userId) return;
    const key = storageKeyForUser(userId);
    if (!key) return;
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.sessions) {
          Object.entries(parsed.sessions).forEach(([sid, state]) => {
            sessionStateRef.current.set(sid, state as any);
          });
        }
        if (parsed.testers) {
          Object.entries(parsed.testers).forEach(([tid, state]) => {
            testerStateRef.current.set(tid, state as any);
          });
        }
      }
    } catch {}
  }, [userId]);

  // -- Single Session Mode Logic --
  // (Preserved from original but cleaned up)
  const prevSessionIdRef = useRef<string | null>(null);
  const prevStartedAtRef = useRef<string | null>(null);
  const prevReportSentAtRef = useRef<string | null>(null);
  const prevCompletedRef = useRef<boolean>(false);
  const prevRestartCountRef = useRef<number>(0);

  useEffect(() => {
    // Only run if in single session mode (userId is null)
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
        actionUrl: session.share_token
          ? `/report/${session.share_token}`
          : `/report/${session.id}`,
        actionLabel: "View report",
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

  // -- User Level Mode Logic --

  // 1. Polling & Data Fetching
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

      // Check session added
      const prevSessionState = sessionStateRef.current.get(sessionId || "");

      if (!prevSessionState) {
        // Only notify if we haven't seen this session before in our state
        addNotification({
          title: "Added to a new session",
          description: `You've been added to ${sessionObj.name || "a new session"}.`,
          createdAt: normalizeTimestamp(
            testerObj.invite_sent_at,
            testerObj.created_at || nowIso,
          ),
          kind: "session_added",
        });
      }

      // Check session started
      if (
        sessionId &&
        sessionObj.started_at &&
        sessionObj.started_at !== prevSessionState?.started_at
      ) {
        addNotification({
          title: "Session started",
          description: `${sessionObj.name || "Session"} is live. You can begin testing.`,
          createdAt: normalizeTimestamp(sessionObj.started_at, nowIso),
          kind: "session_started",
        });
      }

      // Check session restarted
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

      // Check session ended
      // Logic for ended is complex, checking ended_at, status='completed', first_ended_at
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

      // Check report sent
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
          actionUrl: `/report/${sessionObj.share_token || sessionId || testerObj.session_id}`,
          actionLabel: "View report",
        });
      }

      // Check invite sent (email invite received)
      // Only notify if we already knew about this tester (not first time seeing them)
      // AND invite_sent_at just got set/changed
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[TesterNotifications] Checking invite for tester ${testerObj.id}:`,
          {
            hasPrevTester: !!prevTester,
            prevInviteSentAt: prevTester?.invite_sent_at,
            currentInviteSentAt: testerObj.invite_sent_at,
            changed:
              prevTester &&
              testerObj.invite_sent_at !== prevTester.invite_sent_at,
          },
        );
      }
      if (
        prevTester &&
        testerObj.invite_sent_at &&
        testerObj.invite_sent_at !== prevTester.invite_sent_at
      ) {
        if (process.env.NODE_ENV !== "production") {
          console.log("[TesterNotifications] TRIGGERING invite notification!");
        }
        addNotification({
          title: "Invite received",
          description: `You've received an invite for ${sessionObj.name || "a testing session"}.`,
          createdAt: normalizeTimestamp(testerObj.invite_sent_at, nowIso),
          kind: "session_added",
        });
      }

      // Update State
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
        invite_sent_at: testerObj.invite_sent_at ?? null,
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
            console.log(
              "[TesterNotifications] Loaded testers:",
              data.testers.length,
              "testers",
            );
            data.testers.forEach((t: any) => {
              console.log(
                `[TesterNotifications] Tester ${t.id}: invite_sent_at=${t.invite_sent_at}, email=${t.email}`,
              );
            });
          }
          const firstWithEmail = data.testers.find((t: any) => t.email);
          if (firstWithEmail?.email) {
            const email = (firstWithEmail.email as string).toLowerCase();
            if (process.env.NODE_ENV !== "production" && email) {
              console.log(
                "[TesterNotifications] User email for realtime:",
                email,
              );
            }
            setUserEmail((prev) => (prev !== email ? email : prev));
          }
          setUserTesters(
            data.testers.map((t: any) => ({
              tester: t as Tester,
              session: (t.session || {}) as Partial<SessionWithScenes>,
            })),
          );
          data.testers.forEach(processTesterSnapshot);
        }
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[TesterNotifications] Error loading testers:", e);
        }
      }
    };

    loadTesters();
    // OPTIMIZATION: Increased polling interval
    pollTimer = setInterval(loadTesters, POLLING_INTERVAL);

    const onFocus = () => loadTesters();
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadTesters();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // Watch for User's testers changes (global watch)

    const userChannel = supabase.channel(`tester-user-watch-${userId}-global`);
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
          if (payload.eventType === "INSERT") {
            // Handle new invite notification immediately
            const newTester = payload.new as any;
            let sessionName = "a new session";
            // fetch session name optimistically
            try {
              if (newTester.invite_token) {
                const res = await fetch(
                  `/api/join/${newTester.invite_token}?t=${Date.now()}`,
                  { cache: "no-store" },
                );
                if (res.ok)
                  sessionName =
                    (await res.json())?.session?.name || sessionName;
              }
            } catch {}
            addNotification({
              title: "Added to a new session",
              description: `You've been added to ${sessionName}.`,
              createdAt: normalizeTimestamp(
                newTester.invite_sent_at,
                newTester.created_at || new Date().toISOString(),
              ),
              kind: "session_added",
            });
          } else if (payload.eventType === "UPDATE") {
            // Handle email invite being sent to existing tester
            const oldTester = payload.old as any;
            const newTester = payload.new as any;

            // Check if invite_sent_at was just set/updated
            if (
              newTester.invite_sent_at &&
              newTester.invite_sent_at !== oldTester.invite_sent_at
            ) {
              let sessionName = "a testing session";
              try {
                if (newTester.invite_token) {
                  const res = await fetch(
                    `/api/join/${newTester.invite_token}?t=${Date.now()}`,
                    { cache: "no-store" },
                  );
                  if (res.ok) {
                    const data = await res.json();
                    sessionName = data?.session?.name || sessionName;
                  }
                }
              } catch {}

              addNotification({
                title: "Invite received",
                description: `You've received an invite for ${sessionName}.`,
                createdAt: normalizeTimestamp(
                  newTester.invite_sent_at,
                  new Date().toISOString(),
                ),
                kind: "session_added",
              });
            }
          }
          // Reload all to sync state
          await loadTesters();
        },
      )
      .subscribe();

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      supabase.removeChannel(userChannel);
    };
  }, [userId, addNotification, persistState]);

  // 1.5. Email Watcher (Isolated Effect)
  useEffect(() => {
    if (!userEmail) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;
    const sanitizedEmail = userEmail.trim();

    const channelName = `tester-email-watch-${sanitizedEmail.replace(/[^a-zA-Z0-9]/g, "")}`;
    const emailChannel = supabase.channel(channelName);

    emailChannel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "testers",
          filter: `email=eq.${sanitizedEmail}`,
        } as any,
        async (payload: any) => {
          if (process.env.NODE_ENV !== "production") {
            console.log("[TesterNotifications] Email invite event:", payload);
          }

          if (payload.eventType === "INSERT") {
            const newTester = payload.new;
            let sessionName = "a new session";
            try {
              if (newTester.invite_token) {
                const res = await fetch(
                  `/api/join/${newTester.invite_token}?t=${Date.now()}`,
                  { cache: "no-store" },
                );
                if (res.ok) {
                  const data = await res.json();
                  sessionName = data?.session?.name || sessionName;
                }
              }
            } catch {}

            addNotification({
              title: "Added to a new session",
              description: `You've been added to ${sessionName}.`,
              createdAt: normalizeTimestamp(
                newTester.invite_sent_at,
                newTester.created_at || new Date().toISOString(),
              ),
              kind: "session_added",
            });
          } else if (payload.eventType === "UPDATE") {
            // Handle email invite being sent to existing tester
            const oldTester = payload.old;
            const newTester = payload.new;

            // Check if invite_sent_at was just set/updated
            if (
              newTester.invite_sent_at &&
              newTester.invite_sent_at !== oldTester.invite_sent_at
            ) {
              let sessionName = "a testing session";
              try {
                if (newTester.invite_token) {
                  const res = await fetch(
                    `/api/join/${newTester.invite_token}?t=${Date.now()}`,
                    { cache: "no-store" },
                  );
                  if (res.ok) {
                    const data = await res.json();
                    sessionName = data?.session?.name || sessionName;
                  }
                }
              } catch {}

              addNotification({
                title: "Invite received",
                description: `You've received an invite for ${sessionName}.`,
                createdAt: normalizeTimestamp(
                  newTester.invite_sent_at,
                  new Date().toISOString(),
                ),
                kind: "session_added",
              });
            }
          }

          // Always reload data to ensure state is consistent
          if (onRealtimeUpdate) onRealtimeUpdate(); // Trigger parent update if needed
        },
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV !== "production")
          console.log(
            `[TesterNotifications] Email watch (${sanitizedEmail}) status:`,
            status,
          );
      });

    return () => {
      supabase.removeChannel(emailChannel);
    };
  }, [userEmail, addNotification, onRealtimeUpdate]);

  // 1.6. User Notifications from Database + Real-time
  // Fetches unread notifications on load, and listens for new ones
  useEffect(() => {
    if (!userId) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;

    // Fetch unread notifications from database on mount
    const loadNotifications = async () => {
      try {
        const res = await fetch("/api/users/notifications?unread=true", {
          cache: "no-store",
        });
        if (res.ok) {
          const dbNotifications = await res.json();
          
          dbNotifications.forEach((dbNotif: any) => {
            const dedupeKey = `db-${dbNotif.id}`;
            if (recentIdsRef.current.has(dedupeKey)) return;
            recentIdsRef.current.add(dedupeKey);
            
            addNotification({
              title: dbNotif.title,
              description: dbNotif.message,
              createdAt: dbNotif.created_at,
              kind: dbNotif.type as NotificationKind,
              actionUrl: dbNotif.link || undefined,
            });

            // Mark as read in database after showing
            fetch("/api/users/notifications", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notificationIds: [dbNotif.id] }),
            }).catch(() => {});
          });
        }
      } catch (e) {
        console.error("[TesterNotifications] Error loading notifications:", e);
      }
    };

    loadNotifications();

    // Listen for real-time inserts to user_notifications table
    const notificationChannel = supabase.channel(`user-notifications-${userId}`);

    notificationChannel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          const dedupeKey = `db-${newNotif.id}`;
          if (recentIdsRef.current.has(dedupeKey)) return;
          recentIdsRef.current.add(dedupeKey);

          addNotification({
            title: newNotif.title,
            description: newNotif.message,
            createdAt: newNotif.created_at,
            kind: newNotif.type as NotificationKind,
            actionUrl: newNotif.link || undefined,
          });

          // Mark as read
          fetch("/api/users/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationIds: [newNotif.id] }),
          }).catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [userId, addNotification]);

  // 2. Optimized Session Subscriptions
  useEffect(() => {
    if (!userId) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;

    // OPTIMIZATION: Only subscribe to ACTVE sessions
    const activeSessionIds = Array.from(
      new Set(
        userTesters
          .filter((t) => {
            // Active = Not completed AND not ended
            // Or if it was restarted recently?
            const s = t.session;
            if (!s) return false;
            const isCompleted = s.status === "completed" || !!s.ended_at;
            return !isCompleted;
          })
          .map((t) => t.session.id || t.tester.session_id)
          .filter(Boolean) as string[],
      ),
    );

    // Cleanup old channels that are no longer in active list
    sessionChannelsRef.current.forEach((channel, sessionId) => {
      if (!activeSessionIds.includes(sessionId)) {
        supabase.removeChannel(channel);
        sessionChannelsRef.current.delete(sessionId);
      }
    });

    // Add new channels
    activeSessionIds.forEach((sessionId) => {
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
            // On any change, simpler to just trigger loadTesters?
            // But we want instant notifications. Use the payload directly.
            const updated = payload.new as any;
            const nowIso = new Date().toISOString();
            const prev = sessionStateRef.current.get(sessionId) || {
              started_at: null,
              ended_at: null,
              restart_count: 0,
              last_restarted_at: null,
              status: null,
              first_ended_at: null,
            };

            if (updated.started_at && updated.started_at !== prev.started_at) {
              addNotification({
                title: "Session started",
                description: `${updated.name || "Session"} is live. You can begin testing.`,
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
                  nowIso,
                ),
                kind: "session_restarted",
              });
            }

            const ended =
              updated.status === "completed" ||
              !!updated.ended_at ||
              !!updated.first_ended_at;
            const wasEnded =
              prev.status === "completed" ||
              !!prev.ended_at ||
              !!prev.first_ended_at;
            if (ended && !wasEnded) {
              addNotification({
                title: "Session ended",
                description:
                  "This session has been closed. You can still review notes.",
                createdAt: normalizeTimestamp(updated.ended_at, nowIso),
                kind: "session_completed",
              });
            }

            // Update local ref
            sessionStateRef.current.set(sessionId, {
              started_at: updated.started_at ?? null,
              ended_at: updated.ended_at ?? null,
              restart_count: restartCount,
              last_restarted_at: updated.last_restarted_at ?? null,
              status: updated.status ?? null,
              first_ended_at: updated.first_ended_at ?? null,
            });
            persistState();
          },
        )
        .subscribe();
      sessionChannelsRef.current.set(sessionId, channel);
    });

    return () => {
      // We generally don't want to clear all on unmount of effect, only on unmount of component
      // But since userTesters changes, this effect re-runs.
      // We are handling cleanup inside the loop (removing unused).
      // On strict unmount (e.g. logout), we should clear.
      // The pattern here is tricky.
      // Best to leave cleanup for the final unmount really, but React effects expect cleanup.
    };
  }, [userId, userTesters, addNotification]); // Re-run when userTesters list updates

  // Cleanup all channels on unmount
  useEffect(() => {
    return () => {
      sessionChannelsRef.current.forEach((c) =>
        supabaseRef.current?.removeChannel(c),
      );
      sessionChannelsRef.current.clear();
    };
  }, []);

  // Parent Polling (kept as requested but optimized)
  useEffect(() => {
    if (!onRealtimeUpdate) return;
    const interval = setInterval(
      () => onRealtimeUpdate(),
      PARENT_POLL_INTERVAL,
    );
    return () => clearInterval(interval);
  }, [onRealtimeUpdate]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (userId) {
      const key = notificationsKeyForUser(userId);
      if (key && typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify([]));
      }
    }
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const setOpen = useCallback(
    (open: boolean) => {
      // Logic to mark as read when opened?
      if (open && notifications.some((n) => !n.read)) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    },
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    clearNotifications,
    setOpen,
    addNotification, // exposed if needed
  };
}
