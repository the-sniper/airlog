import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET all admins for a company (super admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("company_admins")
    .select(`
      id,
      role,
      created_at,
      user:users(id, first_name, last_name, email)
    `)
    .eq("company_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching company admins:", error);
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST create new admin for a company (super admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, first_name, last_name, password, role = "admin" } = body;

  if (!email?.trim() || !first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json(
      { error: "Email, first name, and last name are required" },
      { status: 400 }
    );
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Check if company exists
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("id", params.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Check if user with this email already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single();

  let userId: string;

  if (existingUser) {
    // Check if user is already an admin of this company
    const { data: existingAdmin } = await supabase
      .from("company_admins")
      .select("id")
      .eq("company_id", params.id)
      .eq("user_id", existingUser.id)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: "User is already an admin of this company" },
        { status: 409 }
      );
    }

    userId = existingUser.id;
  } else {
    // Create new user
    const password_hash = await bcrypt.hash(password, 10);
    
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase().trim(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        password_hash,
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user:", userError);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    userId = newUser.id;
  }

  // Create company admin record
  const { data: companyAdmin, error: adminError } = await supabase
    .from("company_admins")
    .insert({
      company_id: params.id,
      user_id: userId,
      role: role,
    })
    .select(`
      id,
      role,
      created_at,
      user:users(id, first_name, last_name, email)
    `)
    .single();

  if (adminError) {
    console.error("Error creating company admin:", adminError);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }

  return NextResponse.json(companyAdmin, { status: 201 });
}

// DELETE remove admin from company (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const adminId = url.searchParams.get("adminId");

  if (!adminId) {
    return NextResponse.json({ error: "adminId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check if this is the only owner
  const { data: adminToDelete } = await supabase
    .from("company_admins")
    .select("role")
    .eq("id", adminId)
    .eq("company_id", params.id)
    .single();

  if (!adminToDelete) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  if (adminToDelete.role === "owner") {
    // Check if there are other owners
    const { data: owners } = await supabase
      .from("company_admins")
      .select("id")
      .eq("company_id", params.id)
      .eq("role", "owner");

    if (owners && owners.length <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the only owner of the company" },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase
    .from("company_admins")
    .delete()
    .eq("id", adminId)
    .eq("company_id", params.id);

  if (error) {
    console.error("Error deleting company admin:", error);
    return NextResponse.json({ error: "Failed to remove admin" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
