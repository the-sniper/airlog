import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";

// DELETE - Remove a user from the company
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Verify user belongs to this company
    const { data: user } = await supabase
      .from("users")
      .select("id, company_id, first_name, last_name")
      .eq("id", params.userId)
      .eq("company_id", admin.company_id)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "User not found in your company" },
        { status: 404 }
      );
    }

    // Remove company association (don't delete the user, just unlink)
    const { error } = await supabase
      .from("users")
      .update({ company_id: null })
      .eq("id", params.userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${user.first_name} ${user.last_name} has been removed from the company`,
    });
  } catch (error) {
    console.error("Error removing user from company:", error);
    return NextResponse.json(
      { error: "Failed to remove user" },
      { status: 500 }
    );
  }
}
