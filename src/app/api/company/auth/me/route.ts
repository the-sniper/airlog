import { NextResponse } from "next/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";

export async function GET() {
  try {
    const admin = await getCurrentCompanyAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        role: admin.role,
        user: admin.user,
      },
      company: admin.company,
    });
  } catch (error) {
    console.error("Get company admin error:", error);
    return NextResponse.json(
      { error: "Failed to get admin info" },
      { status: 500 }
    );
  }
}
