import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompanyAdmin, updateCompany, isCompanyOwner } from "@/lib/company-auth";

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentCompanyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owner can update company settings for now
    if (!isCompanyOwner(admin)) {
      return NextResponse.json(
        { error: "Only the company owner can update settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, logo_url, description, contact_email } = body;

    const result = await updateCompany(admin.company_id, {
      name,
      logo_url,
      description,
      contact_email,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating company settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
