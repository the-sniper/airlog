import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; testerId: string }> }
) {
  try {
    const { testerId } = await params;
    const { first_name, last_name, email } = await req.json();

    const updates: Record<string, string | null> = {};
    if (first_name?.trim()) updates.first_name = first_name.trim();
    if (last_name?.trim()) updates.last_name = last_name.trim();
    // Allow setting email to empty string (null)
    if (email !== undefined) {
      updates.email = email?.trim() ? email.trim().toLowerCase() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("testers")
      .update(updates)
      .eq("id", testerId)
      .select()
      .single();

    if (error) {
      console.error("Error updating tester:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating tester:", error);
    return NextResponse.json({ error: "Failed to update tester" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; testerId: string }> }
) {
  try {
    const { testerId } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("testers")
      .delete()
      .eq("id", testerId);

    if (error) {
      console.error("Error deleting tester:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tester:", error);
    return NextResponse.json({ error: "Failed to delete tester" }, { status: 500 });
  }
}
