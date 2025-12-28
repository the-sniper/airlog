import crypto from "crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hashToken } from "@/lib/user-auth";

async function sendResetEmail(to: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  const from = process.env.SMTP_FROM || "AirLog <no-reply@airlog.app>";
  const subject = "Reset your AirLog password";
  const html = `
    <p>Hello,</p>
    <p>We received a request to reset your AirLog password.</p>
    <p><a href="${resetLink}">Click here to reset your password</a></p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `;

  await transporter.sendMail({ from, to, subject, html });
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createAdminClient();

    const { data: user } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .single();

    // Always return success to avoid account enumeration
    const safeResponse = NextResponse.json({ success: true });
    if (!user) return safeResponse;

    const token = crypto.randomBytes(32).toString("hex");
    const token_hash = hashToken(token);
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Invalidate previous tokens for this user
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("user_id", user.id);

    const { error } = await supabase
      .from("password_reset_tokens")
      .insert({ user_id: user.id, token_hash, expires_at: expires });

    if (error) return safeResponse;

    try {
      await sendResetEmail(user.email, token);
    } catch (mailErr) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[ResetPassword] Token (dev):", token);
      } else {
        return safeResponse;
      }
    }

    return safeResponse;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
