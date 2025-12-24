import { NextResponse } from "next/server";
import { clearUserAuthCookie } from "@/lib/user-auth";

export async function POST() {
  try {
    await clearUserAuthCookie();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
