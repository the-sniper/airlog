import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";

// GET users belonging to the current company
export async function GET(request: NextRequest) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const supabase = createAdminClient();

    let query = supabase
      .from("users")
      .select("id, first_name, last_name, email, created_at")
      .eq("company_id", admin.company_id)
      .order("first_name", { ascending: true })
      .limit(limit);

    // Apply search filter if provided
    if (search) {
      // Search by name or email
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching company users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Add existing user to company (by ID or email)
export async function POST(request: NextRequest) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { user_id, email } = await request.json();

    if (!user_id && !email) {
      return NextResponse.json(
        { error: "Either user_id or email is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find the user
    let userQuery = supabase.from("users").select("id, company_id, email");

    if (user_id) {
      userQuery = userQuery.eq("id", user_id);
    } else {
      userQuery = userQuery.eq("email", email.toLowerCase().trim());
    }

    const { data: user, error: fetchError } = await userQuery.single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already belongs to a company
    if (user.company_id) {
      if (user.company_id === admin.company_id) {
        return NextResponse.json(
          { error: "User already belongs to your company" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "User already belongs to another company" },
        { status: 409 }
      );
    }

    // Add user to company
    const { error: updateError } = await supabase
      .from("users")
      .update({ company_id: admin.company_id })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "User added to company",
    });
  } catch (error) {
    console.error("Error adding user to company:", error);
    return NextResponse.json(
      { error: "Failed to add user to company" },
      { status: 500 }
    );
  }
}
