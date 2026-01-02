"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  X,
  RefreshCw,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  email_sent: boolean;
  created_at: string;
  resolved: boolean;
}

interface NotificationCounts {
  critical: number;
  warning: number;
  info: number;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    critical: 0,
    warning: 0,
    info: 0,
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications?unreadOnly=true");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setCounts(data.counts || { critical: 0, warning: 0, info: 0 });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
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

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read" }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setCounts((prev) => {
          const notification = notifications.find((n) => n.id === id);
          if (!notification) return prev;
          return {
            ...prev,
            [notification.severity]: Math.max(
              0,
              prev[notification.severity] - 1
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", resolvedBy: "admin" }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setCounts((prev) => {
          const notification = notifications.find((n) => n.id === id);
          if (!notification) return prev;
          return {
            ...prev,
            [notification.severity]: Math.max(
              0,
              prev[notification.severity] - 1
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error resolving notification:", error);
    }
  };

  const handleClearAll = async () => {
    for (const notification of notifications) {
      await handleMarkAsRead(notification.id);
    }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check" }),
      });

      if (res.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    } finally {
      setChecking(false);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          iconBg: "bg-red-500/10 text-red-500",
          border: "border-l-red-500",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          iconBg: "bg-amber-500/10 text-amber-500",
          border: "border-l-amber-500",
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          iconBg: "bg-blue-500/10 text-blue-500",
          border: "border-l-blue-500",
        };
    }
  };

  const totalUnread = counts.critical + counts.warning + counts.info;

  const openNotifications = () => setIsOpen(true);
  const closeNotifications = () => setIsOpen(false);

  // Notification content - reused for both mobile and desktop
  const renderNotificationContent = () => (
    <>
      {/* Summary Pills */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-wrap">
          {counts.critical > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {counts.critical} Critical
            </div>
          )}
          {counts.warning > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {counts.warning} Warning
            </div>
          )}
          {counts.info > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {counts.info} Info
            </div>
          )}
          {totalUnread === 0 && (
            <div className="text-xs text-muted-foreground">No new alerts</div>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleCheckNow}
            disabled={checking}
          >
            <RefreshCw
              className={cn("h-3 w-3 mr-1", checking && "animate-spin")}
            />
            {checking ? "..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[50vh] sm:max-h-80 overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Bell className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">
              All caught up!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No new notifications
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const styles = getSeverityStyles(notification.severity);
            return (
              <div
                key={notification.id}
                className={cn(
                  "flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-l-2 border-b last:border-b-0",
                  styles.border
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    styles.iconBg
                  )}
                >
                  {styles.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleResolve(notification.id)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Resolve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
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
        className="relative h-8 w-8"
        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </Button>
    );
  }

  // MOBILE VIEW - Bottom Sheet
  if (isMobile) {
    return (
      <>
        {/* Bell Button */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Open notifications"
          onClick={openNotifications}
        >
          <Bell className="h-4 w-4" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {totalUnread > 9 ? "9+" : totalUnread}
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
                <h2 className="text-lg font-semibold">Admin Notifications</h2>
                <div className="flex items-center gap-2">
                  {totalUnread > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={handleClearAll}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={closeNotifications}
                  >
                    <X className="w-5 h-5" strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
              {renderNotificationContent()}
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // DESKTOP VIEW - Dropdown
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 overflow-hidden rounded-xl border-border/60"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-muted/30">
          <div>
            <p className="text-sm font-semibold">Admin Notifications</p>
            <p className="text-xs text-muted-foreground">System alerts</p>
          </div>
          {totalUnread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleClearAll}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>
        {renderNotificationContent()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
