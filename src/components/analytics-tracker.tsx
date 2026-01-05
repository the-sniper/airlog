"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Construct full path with query params if needed, mostly path is enough
    const fullPath =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Avoid double tracking in strict mode or rapid changes
    if (lastPathRef.current === fullPath) return;
    lastPathRef.current = fullPath;

    const trackView = async () => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname, // We track path (grouping query params might be noisy)
            referrer: document.referrer,
          }),
        });
      } catch (err) {
        console.error("Failed to track view", err);
      }
    };

    trackView();
  }, [pathname, searchParams]);

  return null;
}
