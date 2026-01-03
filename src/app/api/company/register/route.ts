import { NextRequest, NextResponse } from "next/server";
import { registerCompany } from "@/lib/company-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, firstName, lastName, email, password } = body;

    // Validate required fields
    if (!companyName || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Register company and owner
    const result = await registerCompany(
      companyName,
      firstName,
      lastName,
      email,
      password
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      companyId: result.companyId,
    });
  } catch (error) {
    console.error("Company registration error:", error);
    return NextResponse.json(
      { error: "Failed to register company" },
      { status: 500 }
    );
  }
}
