import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePollRealtime({
  sessionId,
  onPollChange,
}: {
  sessionId: string;
  onPollChange: () => void;
}) {
  const callbackRef = useRef(onPollChange);
  callbackRef.current = onPollChange;

  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    const channel = supabase.channel("poll-questions");
    const sub = channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_questions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          // Debug log
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.log("[PollRealtime] Change detected:", payload);
          }
          callbackRef.current();
        },
      )
      .subscribe();
    return () => {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[PollRealtime] Cleaning up subscription");
      }
      supabase.removeChannel(channel);
    };
  }, [sessionId]);
}
