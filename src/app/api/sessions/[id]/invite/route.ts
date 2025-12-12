import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const { testers, sessionName } = await req.json();
    
    if (!testers || !Array.isArray(testers) || testers.length === 0) {
      return NextResponse.json({ error: "No testers provided" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000";
    
    const results = await Promise.allSettled(
      testers.map(async (tester: { id: string; first_name: string; last_name: string; email: string; invite_token: string }) => {
        const inviteUrl = `${baseUrl}/join/${tester.invite_token}`;
        
        const { error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Echo Test <onboarding@resend.dev>",
          to: tester.email,
          subject: `You're invited to test: ${sessionName || "Testing Session"}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #10b981; font-size: 24px; margin-bottom: 24px;">Echo Test Invitation</h1>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${tester.first_name},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                You've been invited to participate in a testing session${sessionName ? ` for <strong>${sessionName}</strong>` : ""}.
              </p>
              
              <div style="margin: 32px 0;">
                <a href="${inviteUrl}" 
                   style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
                  Join Testing Session
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
                <br />
                <a href="${inviteUrl}" style="color: #10b981;">${inviteUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
              
              <p style="color: #9ca3af; font-size: 12px;">
                This invite link is unique to you. Please do not share it with others.
              </p>
            </div>
          `,
        });
        
        if (error) {
          console.error(`Failed to send email to ${tester.email}:`, error);
          throw new Error(error.message);
        }
        
        return { testerId: tester.id, success: true };
      })
    );

    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected");
    
    // Log failures for debugging
    failed.forEach((f, i) => {
      if (f.status === "rejected") {
        console.error(`Email failure ${i + 1}:`, f.reason);
      }
    });

    return NextResponse.json({ 
      success: true, 
      sent: successful, 
      failed: failed.length,
      sessionId: id 
    });
  } catch (error) {
    console.error("Error sending invite emails:", error);
    return NextResponse.json({ error: "Failed to send invite emails" }, { status: 500 });
  }
}
