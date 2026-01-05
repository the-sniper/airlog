import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer } = body;
    const userAgent = req.headers.get("user-agent");
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip");
    const domain = req.headers.get("host");

    // Only track page views for the configured app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let allowedDomain: string;
    try {
      allowedDomain = new URL(appUrl).host; // includes port if present
    } catch {
      allowedDomain = "localhost:3000";
    }

    // Check if the request domain matches the allowed domain
    if (domain !== allowedDomain) {
      // Skip tracking for non-matching domains
      return NextResponse.json({ success: true, skipped: true });
    }

    // Get visitor ID from cookie or generate new one
    let visitorId = req.cookies.get("visitor_id")?.value;
    const isNewVisitor = !visitorId;
    
    if (!visitorId) {
      visitorId = crypto.randomUUID();
    }

    const supabase = await createClient();
    
    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Record page view
    // Use service role if needed? 
    // Usually RLS allows insert for anon if we set it up.
    // But here we use the server client which inherits the user's role (anon or authenticated).
    // The migration added policy for public insert.
    
    const { error } = await supabase.from("page_views").insert({
      path,
      visitor_id: visitorId,
      user_id: user?.id || null,
      user_agent: userAgent,
      ip_address: ipAddress,
      domain,
      referrer,
    });

    if (error) {
      console.error("Track error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });

    // Set visitor cookie if new
    if (isNewVisitor) {
      response.cookies.set("visitor_id", visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    console.error("Tracking API Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
