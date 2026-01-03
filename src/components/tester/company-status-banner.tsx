"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Clock,
  AlertCircle,
  Check,
  ArrowRight,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CompanyStatus {
  hasCompany: boolean;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  pendingRequest: {
    id: string;
    status: string;
    requested_at: string;
    company: {
      id: string;
      name: string;
      logo_url: string | null;
    };
  } | null;
  rejectedRequest: {
    id: string;
    status: string;
    rejection_reason: string | null;
    company: {
      id: string;
      name: string;
    };
  } | null;
}

export function CompanyStatusBanner() {
  const [status, setStatus] = useState<CompanyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/users/company-status");
        if (res.ok) {
          setStatus(await res.json());
        }
      } catch (error) {
        console.error("Error fetching company status:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (loading) {
    return null; // Don't show skeleton for banner
  }

  if (!status) {
    return null;
  }

  // User has a company - no need to show anything
  if (status.hasCompany) {
    return null;
  }

  // User has a pending request
  if (status.pendingRequest) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Waiting for approval</p>
            <p className="text-sm text-muted-foreground">
              Your request to join{" "}
              <strong>{status.pendingRequest.company.name}</strong> is pending
              review by the company admin.
            </p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary">
            Pending
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // User had a rejected request
  if (status.rejectedRequest) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Request declined</p>
            <p className="text-sm text-muted-foreground">
              Your request to join{" "}
              <strong>{status.rejectedRequest.company.name}</strong> was
              declined.
              {status.rejectedRequest.rejection_reason && (
                <span className="block mt-1 text-xs">
                  Reason: {status.rejectedRequest.rejection_reason}
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User has no company and no pending request - show info about testing access
  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 flex-shrink-0">
          <Building2 className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium">No company linked</p>
          <p className="text-sm text-muted-foreground">
            You can join testing sessions when invited by a company. Contact a
            company admin to get access, or they can add you directly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function NoCompanyEmptyState() {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl mb-2">Waiting for invitations</CardTitle>
        <CardDescription className="max-w-md mb-6">
          You&apos;ll see your testing sessions here once a company admin
          invites you to participate. In the meantime, you can explore the
          platform.
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/join">
            <Button variant="outline">
              Join with Session Code
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
