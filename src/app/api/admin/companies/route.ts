import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth";

// GET all companies (super admin only)
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from("companies")
    .select(`
      *,
      admins:company_admins(count),
      teams:teams(count),
      sessions:sessions(count),
      users:users(count)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// POST create new company (super admin only)
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, ownerEmail, ownerFirstName, ownerLastName } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Company name is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Check if slug already exists
  const { data: existingCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existingCompany) {
    return NextResponse.json(
      { error: "A company with this name already exists" },
      { status: 409 }
    );
  }

  // Create company
  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      name: name.trim(),
      slug,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }

  return NextResponse.json(company, { status: 201 });
}
