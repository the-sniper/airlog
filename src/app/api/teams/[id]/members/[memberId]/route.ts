import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH update member
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const { memberId } = await params;
    const { first_name, last_name, email } = await request.json();

    const updates: Record<string, string> = {};
    if (first_name?.trim()) updates.first_name = first_name.trim();
    if (last_name?.trim()) updates.last_name = last_name.trim();
    if (email?.trim()) updates.email = email.trim().toLowerCase();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("team_members")
      .update(updates)
      .eq("id", memberId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 },
    );
  }
}

// DELETE member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const { memberId } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json(
      { error: "Failed to delete team member" },
      { status: 500 },
    );
  }
}
