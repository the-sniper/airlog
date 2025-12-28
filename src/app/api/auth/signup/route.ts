import { NextResponse } from "next/server";
import { createAdmin, adminExists, loginAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const exists = await adminExists();
    if (exists) {
      return NextResponse.json(
        { error: "Admin already exists. Please login instead." },
        { status: 409 },
      );
    }

    const result = await createAdmin(email, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Auto-login after signup
    await loginAdmin(email, password);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Check if admin exists
export async function GET() {
  try {
    const exists = await adminExists();
    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Check admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
