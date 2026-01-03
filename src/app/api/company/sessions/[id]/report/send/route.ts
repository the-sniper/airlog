import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/server";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // Parse request body for optional tester IDs
    let testerIds: string[] | undefined;
    try {
      const body = await req.json();
      testerIds = body.testerIds;
    } catch {
      // No body or invalid JSON, will send to all testers
    }

    const supabase = createAdminClient();

    // Get session with testers
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
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4f6fc5; font-size: 24px; margin-bottom: 24px;">AirLog Testing Report</h1>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Hi ${tester.first_name},
                </p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Thank you for participating in the testing session for <strong>${session.name}</strong>. The session has been completed and the report is now available.
                </p>
                
                <div style="margin: 32px 0;">
                  <a href="${reportUrl}" 
                     style="display: inline-block; background-color: #4f6fc5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
                    View Testing Report
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Or copy and paste this link into your browser:
                  <br />
                  <a href="${reportUrl}" style="color: #4f6fc5;">${reportUrl}</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
                
                <p style="color: #9ca3af; font-size: 12px;">
                  This report contains feedback and notes collected during the testing session.
                </p>
              </div>
            `,
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
