"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileCheck2,
  Play,
  X,
  Ban,
  ShieldCheck,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { SessionWithScenes, Tester } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  useTesterNotifications,
  NotificationKind,
} from "@/hooks/use-tester-notifications";

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
  }
> = {
  session_added: {
    label: "New Session",
    icon: <Play className="w-4 h-4 text-primary" strokeWidth={1.75} />,
    badgeVariant: "outline",
  },
  session_started: {
    label: "Live",
    icon: (
      <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.75} />
    ),
    badgeVariant: "active",
  },
  report_sent: {
    label: "Report",
    icon: <FileCheck2 className="w-4 h-4 text-blue-500" strokeWidth={1.75} />,
    badgeVariant: "secondary",
  },
  session_completed: {
    label: "Ended",
    icon: (
      <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
    ),
    badgeVariant: "destructive",
  },
  session_restarted: {
    label: "Restarted",
    icon: <Activity className="w-4 h-4 text-sky-500" strokeWidth={1.75} />,
    badgeVariant: "default",
  },
  join_request_approved: {
    label: "Approved",
    icon: (
      <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.75} />
    ),
    badgeVariant: "active",
  },
  join_request_rejected: {
    label: "Declined",
    icon: <X className="w-4 h-4 text-red-500" strokeWidth={1.75} />,
    badgeVariant: "destructive",
  },
  account_disabled: {
    label: "Disabled",
    icon: <Ban className="w-4 h-4 text-red-500" strokeWidth={1.75} />,
    badgeVariant: "destructive",
  },
  account_enabled: {
    label: "Restored",
    icon: (
      <ShieldCheck className="w-4 h-4 text-emerald-500" strokeWidth={1.75} />
    ),
    badgeVariant: "active",
  },
  team_added: {
    label: "Team Added",
    icon: <UserPlus className="w-4 h-4 text-blue-500" strokeWidth={1.75} />,
    badgeVariant: "secondary",
  },
  team_removed: {
    label: "Team Removed",
    icon: <UserMinus className="w-4 h-4 text-amber-500" strokeWidth={1.75} />,
    badgeVariant: "outline",
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
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const {
    notifications,
    unreadCount,
    clearNotifications,
    setOpen: markRead,
  } = useTesterNotifications({
    session,
    tester,
    userId,
    onRealtimeUpdate,
  });

  // Client-side only: detect mobile and mark as mounted
  useEffect(() => {
    setHasMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.setAttribute("data-scroll-locked", "");
    } else {
      document.body.removeAttribute("data-scroll-locked");
    }
    return () => {
      document.body.removeAttribute("data-scroll-locked");
    };
  }, [isMobile, isOpen]);

  const openNotifications = () => {
    setIsOpen(true);
    markRead(true);
  };

  const closeNotifications = () => {
    setIsOpen(false);
  };

  // Notification content - reused for both mobile and desktop
  const renderNotificationContent = () => (
    <>
      <div className="px-4 sm:px-3 py-3 sm:py-2 border-b border-border/60 flex items-center justify-between bg-muted/30">
        <div>
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">Updates and alerts</p>
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
      <div className="max-h-[50vh] sm:max-h-72 overflow-y-auto overscroll-contain">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 sm:py-6 text-sm text-muted-foreground text-center">
            You&apos;re all caught up!
          </div>
        ) : (
          notifications.map((notification) => {
            const meta = kindMeta[notification.kind] || kindMeta.session_added; // Fallback to avoid crash
            return (
              <div
                key={notification.id}
                className="flex items-start gap-3 px-4 py-4 sm:py-3 border-b last:border-b-0 border-border/40 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  {meta.icon}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold leading-tight">
                      {notification.title}
                    </p>
                    {notification.kind === "report_sent" &&
                      notification.actionUrl && (
                        <Link
                          href={notification.actionUrl}
                          className="text-[11px] font-semibold text-primary hover:underline ml-auto"
                          onClick={closeNotifications}
                        >
                          {notification.actionLabel || "View"}
                        </Link>
                      )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                    {notification.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">
                    {formatTimestamp(notification.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );

  // Before mounting, show a simple non-interactive button
  if (!hasMounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-primary-foreground flex items-center justify-center leading-none shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    );
  }

  // MOBILE VIEW
  if (isMobile) {
    return (
      <>
        {/* Bell Button */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Open notifications"
          onClick={openNotifications}
        >
          <Bell className="w-5 h-5" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-primary-foreground flex items-center justify-center leading-none shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        {/* Bottom Sheet Portal */}
        {createPortal(
          <div
            className={`fixed inset-0 z-[9999] transition-all duration-300 ${
              isOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeNotifications}
            />
            {/* Sheet */}
            <div
              role="dialog"
              aria-modal="true"
              className={`absolute bottom-0 left-0 right-0 bg-card shadow-2xl border-t border-border/60 rounded-t-3xl flex flex-col max-h-[85vh] overflow-hidden transition-transform duration-300 ease-out ${
                isOpen ? "translate-y-0" : "translate-y-full"
              }`}
            >
              {/* Drag handle */}
              <div
                className="flex items-center justify-center py-3 cursor-pointer"
                onClick={closeNotifications}
              >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2">
                <h2 className="text-lg font-semibold">Notifications</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeNotifications}
                >
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </Button>
              </div>
              {renderNotificationContent()}
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // DESKTOP VIEW
  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        markRead(open);
      }}
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-primary-foreground flex items-center justify-center leading-none shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[320px] p-0 overflow-hidden rounded-xl border-border/60"
        sideOffset={8}
      >
        {renderNotificationContent()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
