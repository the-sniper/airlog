import { NextRequest, NextResponse } from "next/server";
import { loginCompanyAdmin } from "@/lib/company-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Extract IP and user agent for analytics
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    const result = await loginCompanyAdmin(email, password, ipAddress, userAgent);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Company login error:", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}

