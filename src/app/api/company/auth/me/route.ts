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
        user: {
          ...admin.user,
          // @ts-ignore - TS might not know about deleted_at yet if interface not updated
          deleted_at: (admin.user as any).deleted_at
        },
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
