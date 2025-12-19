"use client";

import { useState, useEffect } from "react";
import type { SessionWithDetails, PollResponse } from "@/types";
import type { HistoricalSession } from "@/lib/analytics";
import { SceneAnalyticsCard } from "./scene-analytics";
import { TemporalAnalyticsCard } from "./temporal-analytics";
import { ContentQualityCard } from "./content-quality";
import { CategoryInsightsCard } from "./category-insights";
import { CrossTesterAgreementCard } from "./cross-tester-agreement";
import { TrendsThemesCard } from "./trends-themes";
import { HistoricalComparisonCard } from "./historical-comparison";
import { Loader2 } from "lucide-react";

interface AnalyticsTabProps {
  session: SessionWithDetails;
  pollResponses: PollResponse[];
  sessionId?: string; // For fetching historical data (admin only)
  shareToken?: string; // For public report
}

export function AnalyticsTab({ session, pollResponses, sessionId, shareToken }: AnalyticsTabProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalSession[] | null>(null);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  useEffect(() => {
    async function fetchHistorical() {
      setLoadingHistorical(true);
      try {
        let response;
        if (sessionId) {
          response = await fetch(`/api/sessions/${sessionId}/historical`);
        } else if (shareToken) {
          response = await fetch(`/api/public/report/${shareToken}/historical`);
        }
        
        if (response?.ok) {
          const data = await response.json();
          setHistoricalData(data.sessions || []);
        }
      } catch (error) {
        console.error("Failed to fetch historical data:", error);
      } finally {
        setLoadingHistorical(false);
      }
    }

    fetchHistorical();
  }, [sessionId, shareToken]);

  const hasNotes = session.notes && session.notes.length > 0;

  if (!hasNotes) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No notes recorded. Analytics will be available once testers submit feedback.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TemporalAnalyticsCard session={session} />
        <ContentQualityCard session={session} />
      </div>

      {/* Row 2: Scene Analysis */}
      <SceneAnalyticsCard session={session} />

      {/* Row 3: Category Insights */}
      <CategoryInsightsCard session={session} />

      {/* Row 4: Agreement & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CrossTesterAgreementCard session={session} />
        <TrendsThemesCard session={session} />
      </div>

      {/* Row 5: Historical Comparison */}
      {loadingHistorical ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading historical data...</span>
        </div>
      ) : (
        <HistoricalComparisonCard session={session} pastSessions={historicalData || []} />
      )}
    </div>
  );
}
