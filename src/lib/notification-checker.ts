import { createAdminClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

/**
 * Check all notification triggers and create notifications as needed
 */
export async function checkNotificationTriggers(): Promise<void> {
  console.log("[Notification Checker] Starting notification checks...");

  await Promise.all([
    checkDatabaseStorage(),
    checkServiceHealth(),
    checkPendingInvites(),
    checkActiveSessionIssues(),
    checkFailedTranscriptions(),
    checkInactiveTeams(),
    checkErrorRates(),
  ]);

  console.log("[Notification Checker] Completed notification checks");
}

/**
 * Check database storage usage
 */
async function checkDatabaseStorage(): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("get_database_size");

    if (error || !data) {
      console.error("Error checking database size:", error);
      return;
    }

    const sizeInMB = data / (1024 * 1024);
    const limitMB = 500; // Supabase free tier limit
    const usagePercent = (sizeInMB / limitMB) * 100;

    if (usagePercent >= 90) {
      await createNotification({
        type: "resource_usage",
        severity: "critical",
        title: "Database Storage Critical",
        message: `Database storage is at ${usagePercent.toFixed(1)}% capacity (${sizeInMB.toFixed(2)} MB / ${limitMB} MB). Immediate action required.`,
        metadata: {
          current_size_mb: sizeInMB.toFixed(2),
          limit_mb: limitMB,
          usage_percent: usagePercent.toFixed(1),
        },
      });
    } else if (usagePercent >= 80) {
      await createNotification({
        type: "resource_usage",
        severity: "warning",
        title: "Database Storage Warning",
        message: `Database storage is at ${usagePercent.toFixed(1)}% capacity (${sizeInMB.toFixed(2)} MB / ${limitMB} MB). Consider cleanup or upgrade.`,
        metadata: {
          current_size_mb: sizeInMB.toFixed(2),
          limit_mb: limitMB,
          usage_percent: usagePercent.toFixed(1),
        },
      });
    }
  } catch (error) {
    console.error("Error in checkDatabaseStorage:", error);
  }
}

/**
 * Check service health (OpenAI, SMTP, etc.)
 */
async function checkServiceHealth(): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Check recent service usage for failures
    const { data: recentUsage } = await supabase
      .from("service_usage")
      .select("*")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString()) // Last hour
      .order("created_at", { ascending: false });

    if (!recentUsage || recentUsage.length === 0) return;

    // Group by service and check error rates
    const serviceStats: Record<
      string,
      { total: number; errors: number; lastError?: string }
    > = {};

    recentUsage.forEach((usage) => {
      const service = usage.service_name;
      if (!serviceStats[service]) {
        serviceStats[service] = { total: 0, errors: 0 };
      }
      serviceStats[service].total++;
      if (!usage.success) {
        serviceStats[service].errors++;
        serviceStats[service].lastError = usage.error_message || "Unknown error";
      }
    });

    // Alert on high error rates
    for (const [service, stats] of Object.entries(serviceStats)) {
      const errorRate = (stats.errors / stats.total) * 100;

      if (errorRate >= 50 && stats.total >= 5) {
        await createNotification({
          type: "service_health",
          severity: "critical",
          title: `${service} Service Failure`,
          message: `${service} is experiencing a high failure rate: ${errorRate.toFixed(1)}% (${stats.errors}/${stats.total} requests failed in the last hour).`,
          metadata: {
            service,
            error_rate: errorRate.toFixed(1),
            total_requests: stats.total,
            failed_requests: stats.errors,
            last_error: stats.lastError,
          },
        });
      } else if (errorRate >= 25 && stats.total >= 5) {
        await createNotification({
          type: "service_health",
          severity: "warning",
          title: `${service} Service Degraded`,
          message: `${service} is experiencing elevated errors: ${errorRate.toFixed(1)}% (${stats.errors}/${stats.total} requests failed in the last hour).`,
          metadata: {
            service,
            error_rate: errorRate.toFixed(1),
            total_requests: stats.total,
            failed_requests: stats.errors,
            last_error: stats.lastError,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error in checkServiceHealth:", error);
  }
}

/**
 * Check for old pending invites
 */
async function checkPendingInvites(): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Check for invites older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { data: oldInvites } = await supabase
      .from("pending_invites")
      .select("*")
      .lt("created_at", sevenDaysAgo.toISOString());

    if (oldInvites && oldInvites.length > 0) {
      await createNotification({
        type: "user_management",
        severity: "info",
        title: "Pending Invitations",
        message: `${oldInvites.length} tester invitation${oldInvites.length > 1 ? "s" : ""} have been pending for more than 7 days.`,
        metadata: {
          count: oldInvites.length,
          oldest_invite: oldInvites[0]?.created_at,
        },
      });
    }
  } catch (error) {
    console.error("Error in checkPendingInvites:", error);
  }
}

/**
 * Check for active sessions with issues
 */
async function checkActiveSessionIssues(): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Get active sessions
    const { data: activeSessions } = await supabase
      .from("sessions")
      .select("id, name, created_at")
      .eq("status", "active");

    if (!activeSessions || activeSessions.length === 0) return;

    // Check for sessions active for more than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const longRunningSessions = activeSessions.filter(
      (session) => new Date(session.created_at) < oneDayAgo,
    );

    if (longRunningSessions.length > 0) {
      await createNotification({
        type: "session_activity",
        severity: "warning",
        title: "Long-Running Sessions",
        message: `${longRunningSessions.length} session${longRunningSessions.length > 1 ? "s have" : " has"} been active for more than 24 hours. Consider completing or reviewing.`,
        metadata: {
          count: longRunningSessions.length,
          sessions: longRunningSessions.map((s) => ({
            id: s.id,
            name: s.name,
            started: s.created_at,
          })),
        },
      });
    }
  } catch (error) {
    console.error("Error in checkActiveSessionIssues:", error);
  }
}

/**
 * Check for failed transcriptions
 */
async function checkFailedTranscriptions(): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Check for notes with audio but no transcript in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data: failedNotes } = await supabase
      .from("notes")
      .select("id, session_id")
      .not("audio_url", "is", null)
      .is("transcript", null)
      .gte("created_at", oneDayAgo.toISOString());

    if (failedNotes && failedNotes.length >= 5) {
      await createNotification({
        type: "data_quality",
        severity: "warning",
        title: "Transcription Failures",
        message: `${failedNotes.length} audio notes failed to transcribe in the last 24 hours. Check Whisper service status.`,
        metadata: {
          count: failedNotes.length,
          affected_sessions: Array.from(new Set(failedNotes.map((n) => n.session_id))).length,
        },
      });
    }
  } catch (error) {
    console.error("Error in checkFailedTranscriptions:", error);
  }
}

/**
 * Check for inactive teams
 */
async function checkInactiveTeams(): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Get teams with no sessions in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: teams } = await supabase.from("teams").select(`
        id,
        name,
        created_at,
        sessions (
          id,
          created_at
        )
      `);

    if (!teams) return;

    const inactiveTeams = teams.filter((team) => {
      const sessions = team.sessions as { id: string; created_at: string }[];
      if (!sessions || sessions.length === 0) return true;

      const recentSessions = sessions.filter(
        (s) => new Date(s.created_at) > thirtyDaysAgo,
      );
      return recentSessions.length === 0;
    });

    if (inactiveTeams.length >= 3) {
      await createNotification({
        type: "user_management",
        severity: "info",
        title: "Inactive Teams",
        message: `${inactiveTeams.length} teams have had no activity in the last 30 days.`,
        metadata: {
          count: inactiveTeams.length,
          teams: inactiveTeams.slice(0, 5).map((t) => ({
            id: t.id,
            name: t.name,
            created_at: t.created_at,
          })),
        },
      });
    }
  } catch (error) {
    console.error("Error in checkInactiveTeams:", error);
  }
}

/**
 * Check for elevated error rates
 */
async function checkErrorRates(): Promise<void> {
  try {
    const supabase = createAdminClient();

    // This would typically check application logs or error tracking
    // For now, we'll check for deleted notes as a proxy for issues
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data: recentDeletes } = await supabase
      .from("deleted_notes")
      .select("id")
      .gte("deleted_at", oneHourAgo.toISOString());

    if (recentDeletes && recentDeletes.length >= 10) {
      await createNotification({
        type: "data_quality",
        severity: "warning",
        title: "High Note Deletion Rate",
        message: `${recentDeletes.length} notes were deleted in the last hour. This may indicate data quality issues or user confusion.`,
        metadata: {
          count: recentDeletes.length,
          timeframe: "1 hour",
        },
      });
    }
  } catch (error) {
    console.error("Error in checkErrorRates:", error);
  }
}
