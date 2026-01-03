"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Check,
  X,
  Loader2,
  RefreshCw,
  UserCheck,
  Clock,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface JoinRequest {
  id: string;
  status: string;
  requested_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function CompanyJoinRequestsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  // Rejection dialog
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    request: JoinRequest | null;
  }>({ open: false, request: null });
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/company/join-requests");
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (error) {
      console.error("Error fetching join requests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleApprove(request: JoinRequest) {
    setProcessing(request.id);
    try {
      const res = await fetch("/api/company/join-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id, action: "approve" }),
      });

      if (res.ok) {
        toast({
          title: "Request approved!",
          description: `${request.user.first_name} ${request.user.last_name} has been added to your company.`,
          variant: "success",
        });
        fetchRequests();
      } else {
        const result = await res.json();
        toast({
          title: "Error",
          description: result.error || "Failed to approve request",
          variant: "destructive",
        });
      }
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject() {
    if (!rejectDialog.request) return;
    setProcessing(rejectDialog.request.id);

    try {
      const res = await fetch("/api/company/join-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: rejectDialog.request.id,
          action: "reject",
          rejectionReason: rejectionReason.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast({
          title: "Request rejected",
          description: `The request from ${rejectDialog.request.user.first_name} has been rejected.`,
        });
        fetchRequests();
        setRejectDialog({ open: false, request: null });
        setRejectionReason("");
      } else {
        const result = await res.json();
        toast({
          title: "Error",
          description: result.error || "Failed to reject request",
          variant: "destructive",
        });
      }
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-16 rounded-lg bg-muted/30" />
        <div className="h-64 rounded-xl bg-secondary/30" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Join Requests</h1>
            <p className="text-muted-foreground">
              Approve or reject user requests to join your company
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchRequests(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <CardDescription>
                Users who have requested to join during signup
              </CardDescription>
            </div>
            <Badge variant="secondary">{requests.length} pending</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">No pending requests</h3>
              <p className="text-sm text-muted-foreground">
                When users request to join during signup, they&apos;ll appear
                here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {request.user.first_name[0]}
                        {request.user.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {request.user.first_name} {request.user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested {formatDate(request.requested_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request)}
                      disabled={processing === request.id}
                    >
                      {processing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRejectDialog({ open: true, request })}
                      disabled={processing === request.id}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, request: null });
            setRejectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Reject the request from{" "}
              <strong>
                {rejectDialog.request?.user.first_name}{" "}
                {rejectDialog.request?.user.last_name}
              </strong>
              ? They won&apos;t be able to access company resources.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason (optional)</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Let the user know why their request was rejected..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRejectDialog({ open: false, request: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!!processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
