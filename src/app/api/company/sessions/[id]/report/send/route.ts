import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";
import { createReportReadyEmail } from "@/lib/email-templates";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function checkAccess(id: string) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) return { error: "Unauthorized", status: 401 };

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("company_id")
    .eq("id", id)
    .single();

  if (!session || session.company_id !== admin.company_id) {
    return { error: "Forbidden", status: 403 };
  }
  return { supabase };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json({ error: access.error }, { status: access.status as number });

  const supabase = access.supabase!;

  try {
    // Parse request body for optional tester IDs
    let testerIds: string[] | undefined;
    try {
      const body = await req.json();
      testerIds = body.testerIds;
    } catch {
      // No body or invalid JSON, will send to all testers
    }

    // Get session with testers (using already authenticated client context/but still admin client technically)
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*, testers (*)")
      .eq("id", id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Ensure session has a share_token for the report
    let shareToken = session.share_token;
    if (!shareToken) {
      // Generate a new share token
      const crypto = await import("crypto");
      shareToken = crypto.randomBytes(16).toString("hex");
      await supabase
        .from("sessions")
        .update({ share_token: shareToken })
        .eq("id", id);
    }

    // Get testers to send to - either specific IDs or all testers
    let targetTesters = session.testers || [];
    if (testerIds && testerIds.length > 0) {
      targetTesters = targetTesters.filter((t: { id: string }) =>
        testerIds!.includes(t.id),
      );
    }

    // Filter testers with email
    const testersWithEmail =
      targetTesters.filter((t: { email: string | null }) => t.email) || [];

    if (testersWithEmail.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        message: "No testers with email addresses",
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const reportUrl = `${baseUrl}/report/${shareToken}`;

    const results = await Promise.allSettled(
      testersWithEmail.map(
        async (tester: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
        }) => {
          await transporter.sendMail({
            from: fromEmail,
            to: tester.email,
            subject: `Testing Report: ${session.name}`,
            html: createReportReadyEmail({
              firstName: tester.first_name,
              sessionName: session.name,
              reportUrl,
            }),
          });

          return { testerId: tester.id, success: true };
        },
      ),
    );

    const successfulResults = results
      .map((r, idx) => ({ r, tester: testersWithEmail[idx] }))
      .filter((entry) => entry.r.status === "fulfilled");
    const successful = successfulResults.length;
    const failed = results.filter((r) => r.status === "rejected");

    // Log failures for debugging
    failed.forEach((f, i) => {
      if (f.status === "rejected") {
        console.error(`Report email failure ${i + 1}:`, f.reason);
      }
    });

    // Mark report_sent_at for successful testers
    if (successfulResults.length > 0) {
      const sentIds = successfulResults.map((entry) => entry.tester.id);
      await supabase
        .from("testers")
        .update({ report_sent_at: new Date().toISOString() })
        .in("id", sentIds);
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed.length,
      sentTesterIds: successfulResults.map((entry) => entry.tester.id),
      sessionId: id,
      shareToken,
    });
  } catch (error) {
    console.error("Error sending report emails:", error);
    return NextResponse.json(
      { error: "Failed to send report emails" },
      { status: 500 },
    );
  }
}
