"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SessionReportView from "@/components/reports/session-report-view";
import type { SessionWithDetails, PollResponse } from "@/types";

export default function PublicReportPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [pollResponses, setPollResponses] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchReport = useCallback(
    async function () {
      try {
        const response = await fetch(`/api/public/report/${token}`);
        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
          setPollResponses(data.pollResponses || []);
        } else {
          setError("This report is not available or the link has expired.");
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load report.");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function generatePDF() {
    if (!session) return;
    setGenerating(true);
    try {
      const response = await fetch(`/api/public/report/${token}`, {
        method: "POST",
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${session.name.replace(/\s+/g, "-")}-report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="h-8 rounded-lg bg-muted/30 animate-pulse" />
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
          {/* Session info skeleton */}
          <div className="h-16 rounded-lg bg-muted/30" />

          {/* Tabs skeleton */}
          <div className="h-12 rounded-lg bg-muted/30" />

          {/* Summary card skeleton */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="h-6 w-1/4 bg-muted/40 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-secondary/30" />
              ))}
            </div>
          </div>

          {/* Category breakdown skeleton */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="h-6 w-1/3 bg-muted/40 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 rounded bg-secondary/30" />
              ))}
            </div>
          </div>

          {/* Notes section skeleton */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="h-6 w-1/5 bg-muted/40 rounded" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-secondary/30" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Report Not Available</h2>
            <p className="text-muted-foreground">
              {error || "This report link is invalid or has expired."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 w-full overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="shrink-0">
              <Image
                src="/logo.svg"
                alt="AirLog"
                width={80}
                height={28}
                className="dark:hidden w-[70px] sm:w-[80px] h-auto"
              />
              <Image
                src="/logo-dark.svg"
                alt="AirLog"
                width={80}
                height={28}
                className="hidden dark:block w-[70px] sm:w-[80px] h-auto"
              />
            </div>
            <div className="h-4 w-px bg-border hidden xs:block shrink-0" />
            <span className="font-semibold text-sm sm:text-base md:text-lg truncate">
              <span className="hidden xs:inline">OnSite Session </span>Report
            </span>
          </div>
          <Button
            onClick={generatePDF}
            disabled={generating}
            size="sm"
            className="shrink-0 h-8 sm:h-9 px-2 sm:px-4"
          >
            {generating ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="ml-1.5 sm:ml-2">
              <span className="hidden xxs:inline">Export </span>PDF
            </span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Session Info */}
        <div>
          <h1 className="text-2xl font-bold mb-1">{session.name}</h1>
          {session.description && (
            <p className="text-muted-foreground">{session.description}</p>
          )}
          {session.build_version && (
            <p className="text-sm text-muted-foreground font-mono mt-1">
              Build: {session.build_version}
            </p>
          )}
        </div>

        <SessionReportView
          session={session}
          pollResponses={pollResponses}
          shareToken={token}
        />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p>Generated by AirLog • Voice-first testing feedback platform</p>
        </div>
      </main>
    </div>
  );
}
