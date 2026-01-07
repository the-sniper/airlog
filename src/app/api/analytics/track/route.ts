import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyUserToken } from "@/lib/user-auth";
import { verifyCompanyToken } from "@/lib/company-auth";
import { verifyToken as verifyAdminToken } from "@/lib/auth";

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
    // Log for debugging domain mismatch issues
    if (domain !== allowedDomain) {
      console.warn("[PAGE VIEW TRACKING SKIPPED]", {
        requestDomain: domain,
        allowedDomain: allowedDomain,
        appUrl: appUrl,
        path: path,
      });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Get visitor ID from cookie or generate new one
    let visitorId = req.cookies.get("visitor_id")?.value;
    const isNewVisitor = !visitorId;
    
    if (!visitorId) {
      visitorId = crypto.randomUUID();
    }

    // Use admin client to insert page views (bypasses RLS)
    const supabase = createAdminClient();
    
    // Determine which session to check based on the path being visited
    // This handles cases where multiple sessions exist in the same browser
    let userId: string | null = null;
    const isCompanyPath = path?.startsWith("/company");
    
    if (isCompanyPath) {
      // For company paths, prefer company admin session
      const companySessionToken = req.cookies.get("company_admin_session")?.value;
      if (companySessionToken) {
        const payload = await verifyCompanyToken(companySessionToken);
        if (payload?.companyAdminId) {
          const { data: companyAdmin } = await supabase
            .from("company_admins")
            .select("user_id")
            .eq("id", payload.companyAdminId)
            .single();
          
          if (companyAdmin?.user_id) {
            userId = companyAdmin.user_id;
          }
        }
      }
      
      // Fallback to user session if company session not found
      if (!userId) {
        const userSessionToken = req.cookies.get("user_session")?.value;
        if (userSessionToken) {
          const payload = await verifyUserToken(userSessionToken);
          if (payload?.userId) {
            userId = payload.userId;
          }
        }
      }
    } else {
      // For non-company paths, prefer regular user session
      const userSessionToken = req.cookies.get("user_session")?.value;
      if (userSessionToken) {
        const payload = await verifyUserToken(userSessionToken);
        if (payload?.userId) {
          userId = payload.userId;
        }
      }
      
      // Fallback to company admin session if user session not found
      if (!userId) {
        const companySessionToken = req.cookies.get("company_admin_session")?.value;
        if (companySessionToken) {
          const payload = await verifyCompanyToken(companySessionToken);
          if (payload?.companyAdminId) {
            const { data: companyAdmin } = await supabase
              .from("company_admins")
              .select("user_id")
              .eq("id", payload.companyAdminId)
              .single();
            
            if (companyAdmin?.user_id) {
              userId = companyAdmin.user_id;
            }
          }
        }
      }
    }

    // Record page view
    const { error } = await supabase.from("page_views").insert({
      path,
      visitor_id: visitorId,
      user_id: userId,
      user_agent: userAgent,
      ip_address: ipAddress,
      domain,
      referrer,
    });

    if (error) {
      console.error("[PAGE VIEW TRACKING ERROR]", {
        error: error.message,
        code: error.code,
        path: path,
        domain: domain,
        userId: userId,
      });
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
