import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/server";
import { trackSMTPUsage } from "@/lib/track-usage";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";
import { createSessionInviteEmail } from "@/lib/email-templates";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
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
    const { testers, sessionName } = await req.json();

    if (!testers || !Array.isArray(testers) || testers.length === 0) {
      return NextResponse.json(
        { error: "No testers provided" },
        { status: 400 }
      );
    }

    // Fetch session join code
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("join_code")
      .eq("id", id)
      .single();

    if (sessionError || !sessionData?.join_code) {
      console.error("Error fetching session join code:", sessionError);
      return NextResponse.json(
        { error: "Failed to fetch session join code" },
        { status: 500 }
      );
    }

    const joinCode = sessionData.join_code;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const inviteUrl = `${baseUrl}/join/${joinCode}`;

    const results = await Promise.allSettled(
      testers.map(
        async (tester: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
        }) => {
          const startTime = Date.now();
          try {
            await transporter.sendMail({
              from: fromEmail,
              to: tester.email,
              subject: `You're invited to test: ${sessionName || "Testing Session"}`,
              html: createSessionInviteEmail({
                firstName: tester.first_name,
                sessionName,
                joinCode,
                inviteUrl,
                baseUrl,
              }),
            });
            
            const durationMs = Date.now() - startTime;
            trackSMTPUsage("invite", durationMs, true);
            return { testerId: tester.id, success: true };
          } catch (error) {
            const durationMs = Date.now() - startTime;
            trackSMTPUsage("invite", durationMs, false, String(error));
            throw error;
          }
        },
      ),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");

    // Log failures for debugging
    failed.forEach((f, i) => {
      if (f.status === "rejected") {
        console.error(`Email failure ${i + 1}:`, f.reason);
      }
    });

    // Update invite_sent_at for successfully sent emails
    if (successful > 0) {
      const successfulTesterIds = testers
        .filter(
          (_: { id: string }, index: number) =>
            results[index].status === "fulfilled",
        )
        .map((t: { id: string }) => t.id);

      console.log(
        "[Invite API] Updating invite_sent_at for testers:",
        successfulTesterIds,
      );

      const { error: updateError } = await supabase
        .from("testers")
        .update({ invite_sent_at: new Date().toISOString() })
        .in("id", successfulTesterIds);

      if (updateError) {
        console.error(
          "[Invite API] Error updating invite_sent_at:",
          updateError,
        );
      } else {
        console.log(
          "[Invite API] Successfully updated invite_sent_at for",
          successfulTesterIds.length,
          "testers",
        );
      }
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed.length,
      sessionId: id,
    });
  } catch (error) {
    console.error("Error sending invite emails:", error);
    return NextResponse.json(
      { error: "Failed to send invite emails" },
      { status: 500 },
    );
  }
}
