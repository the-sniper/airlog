"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, Fingerprint } from "lucide-react";
import type { SessionWithDetails } from "@/types";
import { calculateCrossTesterAgreement } from "@/lib/analytics";

interface CrossTesterAgreementCardProps {
  session: SessionWithDetails;
}

export function CrossTesterAgreementCard({ session }: CrossTesterAgreementCardProps) {
  const agreement = useMemo(() => calculateCrossTesterAgreement(session), [session]);

  const getAgreementLevel = () => {
    if (agreement.sharedFindingsRate > 30) return { label: "High Agreement", color: "text-emerald-500" };
    if (agreement.sharedFindingsRate > 15) return { label: "Moderate Agreement", color: "text-amber-500" };
    return { label: "Low Agreement", color: "text-sky-500" };
  };

  const agreementLevel = getAgreementLevel();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Cross-Tester Agreement
        </CardTitle>
        <CardDescription>Common findings across multiple testers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agreement Score */}
        <div className="p-4 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Shared Findings</span>
            <span className={`text-sm font-medium ${agreementLevel.color}`}>
              {agreementLevel.label}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(agreement.sharedFindingsRate, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(agreement.sharedFindingsRate)}% of keywords shared by 2+ testers</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Shared</span>
            </div>
            <div className="text-xl font-bold">{agreement.sharedKeywords}</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <Fingerprint className="w-4 h-4 text-sky-500" />
              <span className="text-xs text-muted-foreground">Unique</span>
            </div>
            <div className="text-xl font-bold">{agreement.uniqueKeywords}</div>
          </div>
        </div>

        {/* Common Keywords */}
        {agreement.commonKeywords.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Consensus Topics (mentioned by multiple testers)
            </div>
            <div className="flex flex-wrap gap-2">
              {agreement.commonKeywords.slice(0, 10).map((kw) => (
                <Badge
                  key={kw.keyword}
                  variant="secondary"
                  className="text-xs"
                  title={`${kw.testerCount} testers, ${kw.count} mentions`}
                >
                  {kw.keyword}
                  <span className="ml-1 opacity-60">×{kw.testerCount}</span>
                </Badge>
              ))}
            </div>
            {agreement.commonKeywords.length > 10 && (
              <p className="text-xs text-muted-foreground">
                +{agreement.commonKeywords.length - 10} more shared topics
              </p>
            )}
          </div>
        )}

        {agreement.commonKeywords.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No common topics found across testers yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
