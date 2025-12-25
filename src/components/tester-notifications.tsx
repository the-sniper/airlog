"use client";

import { useState } from "react";
import Link from "next/link";
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
import { useTesterNotifications, NotificationKind } from "@/hooks/use-tester-notifications";

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
  const [open, setOpenState] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    clearNotifications, 
    setOpen: markRead 
  } = useTesterNotifications({
    session,
    tester,
    userId,
    onRealtimeUpdate
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpenState(isOpen);
    markRead(isOpen);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
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
                  className="flex items-start gap-3 px-4 py-3 cursor-default data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
                >
                  <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-muted/50 flex items-center justify-center">
                    {meta.icon}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold leading-tight">
                        {notification.title}
                      </p>
                      {notification.kind === "report_sent" &&
                        notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            className="text-[11px] font-semibold text-primary hover:underline ml-auto"
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
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
