"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Download, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SessionReportView from "@/components/reports/session-report-view";
import type { SessionWithDetails, PollResponse } from "@/types";

export default function CompanySessionReportPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [pollResponses, setPollResponses] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchReport = useCallback(
    async function () {
      try {
        const response = await fetch(`/api/company/sessions/${id}/report`);
        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
          setPollResponses(data.pollResponses || []);
        } else {
          setError("This report could not be loaded.");
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load report.");
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function generatePDF() {
    if (!session) return;
    setGenerating(true);
    try {
      const response = await fetch(`/api/company/sessions/${id}/report`, {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 rounded-lg bg-secondary/30 animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-secondary/20 animate-pulse" />
          </div>
          <div className="h-10 w-32 rounded-lg bg-secondary/30 animate-pulse" />
        </div>
        <div className="space-y-6 animate-pulse">
          <div className="h-64 rounded-xl bg-secondary/30" />
          <div className="h-64 rounded-xl bg-secondary/30" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center p-8 h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Report Not Available</h2>
            <p className="text-muted-foreground mb-6">
              {error || "This report is invalid or has expired."}
            </p>
            <Link href="/company/sessions">
              <Button variant="outline">Back to Sessions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/company/sessions">
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {session.name}{" "}
              <span className="text-muted-foreground font-normal">Report</span>
            </h1>
            {session.build_version && (
              <p className="text-sm text-muted-foreground font-mono mt-0.5">
                Build: {session.build_version}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={generatePDF} disabled={generating} variant="outline">
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      <SessionReportView
        session={session}
        pollResponses={pollResponses}
        shareToken={session.share_token || undefined}
        analyticsEndpoint={`/api/company/sessions/${id}/historical`}
      />
    </div>
  );
}
