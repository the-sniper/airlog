import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "./supabase/server";
import { verifyPassword, hashPassword } from "./user-auth";

const COMPANY_JWT_SECRET = new TextEncoder().encode(
  process.env.COMPANY_JWT_SECRET || "company-admin-secret-change-in-production",
);

const COMPANY_COOKIE_NAME = "company_admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  contact_email: string | null;
  subscription_tier: string;
  max_teams: number;
  max_sessions_per_month: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyAdmin {
  id: string;
  company_id: string;
  user_id: string;
  role: "owner" | "admin";
  created_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  company: Company;
}

// Helper to check if current admin is owner
export function isCompanyOwner(admin: CompanyAdmin | null): boolean {
  return admin?.role === "owner";
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Create JWT token for company admin
export async function createCompanyToken(
  companyAdminId: string,
  companyId: string,
): Promise<string> {
  return new SignJWT({ companyAdminId, companyId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(COMPANY_JWT_SECRET);
}

// Verify JWT token
export async function verifyCompanyToken(
  token: string,
): Promise<{ companyAdminId: string; companyId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, COMPANY_JWT_SECRET);
    return {
      companyAdminId: payload.companyAdminId as string,
      companyId: payload.companyId as string,
    };
  } catch {
    return null;
  }
}

// Set company auth cookie
export async function setCompanyAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COMPANY_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

// Get company auth cookie
export async function getCompanyAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COMPANY_COOKIE_NAME)?.value ?? null;
}

// Clear company auth cookie
export async function clearCompanyAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COMPANY_COOKIE_NAME);
}

// Get current company admin from cookie
export async function getCurrentCompanyAdmin(): Promise<CompanyAdmin | null> {
  const token = await getCompanyAuthCookie();
  if (!token) return null;

  const payload = await verifyCompanyToken(token);
  if (!payload) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("company_admins")
    .select(
      `
      id, company_id, user_id, role, created_at,
      user:users(id, first_name, last_name, email, deleted_at),
      company:companies(id, name, slug, logo_url, description, contact_email, subscription_tier, max_teams, max_sessions_per_month, is_active, created_at, updated_at)
    `,
    )
    .eq("id", payload.companyAdminId)
    .single();

  if (!data) return null;
  
  // Handle Supabase join returns (can be arrays)
  const user = Array.isArray(data.user) ? data.user[0] : data.user;
  const company = Array.isArray(data.company) ? data.company[0] : data.company;
  
  if (!user || !company) return null;

  return {
    id: data.id,
    company_id: data.company_id,
    user_id: data.user_id,
    role: data.role,
    created_at: data.created_at,
    user: user as CompanyAdmin["user"],
    company: company as Company,
  };
}

// Register a new company with owner
export async function registerCompany(
  companyName: string,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  description?: string,
  contact_email?: string,
  logo_url?: string
): Promise<{ success: boolean; error?: string; companyId?: string }> {
  const supabase = createAdminClient();

  // Check if email already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    return { success: false, error: "Email already registered" };
  }

  // Generate slug from company name
  const baseSlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .trim();

  // Check for unique slug
  let slug = baseSlug || "company";
  let counter = 0;
  while (true) {
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!existingCompany) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  // Create user
  const passwordHash = await hashPassword(password);
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash: passwordHash,
    })
    .select("id")
    .single();

  if (userError || !user) {
    return { success: false, error: userError?.message || "Failed to create user" };
  }

  // Create company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: companyName,
      slug,
      description,
      contact_email,
      logo_url: logo_url || null,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    // Rollback user creation
    await supabase.from("users").delete().eq("id", user.id);
    return { success: false, error: companyError?.message || "Failed to create company" };
  }

  // Create company admin as owner
  const { error: adminError } = await supabase.from("company_admins").insert({
    company_id: company.id,
    user_id: user.id,
    role: "owner",
  });

  if (adminError) {
    // Rollback
    await supabase.from("companies").delete().eq("id", company.id);
    await supabase.from("users").delete().eq("id", user.id);
    return { success: false, error: adminError.message };
  }

  // Update user with company_id
  await supabase
    .from("users")
    .update({ company_id: company.id })
    .eq("id", user.id);

  return { success: true, companyId: company.id };
}

// Login company admin
export async function loginCompanyAdmin(
  email: string,
  password: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Find user by email
  const { data: user } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("email", email)
    .single();

  if (!user) {
    return { success: false, error: "Invalid credentials" };
  }

  // Verify password
  const validPassword = await verifyPassword(password, user.password_hash);
  if (!validPassword) {
    return { success: false, error: "Invalid credentials" };
  }

  // Check if user is a company admin
  const { data: companyAdmin } = await supabase
    .from("company_admins")
    .select("id, company_id")
    .eq("user_id", user.id)
    .single();

  if (!companyAdmin) {
    return { success: false, error: "Not a company administrator" };
  }

  // Update last login timestamp for analytics
  await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  // Record login event for detailed analytics tracking
  const { error: loginError } = await supabase.from("user_logins").insert({
    user_id: user.id,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  });
  
  if (loginError) {
    console.error("[COMPANY LOGIN TRACKING ERROR]", {
      error: loginError.message,
      code: loginError.code,
      userId: user.id,
    });
  }

  // Create session token
  const token = await createCompanyToken(companyAdmin.id, companyAdmin.company_id);
  await setCompanyAuthCookie(token);

  return { success: true };
}

// Logout company admin
export async function logoutCompanyAdmin() {
  await clearCompanyAuthCookie();
}

// Invite a user to become a company admin
export async function inviteCompanyAdmin(
  companyId: string,
  inviterAdminId: string,
  email: string,
  role: "admin" = "admin",
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Find user
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) {
    return { success: false, error: "User not found. They must register first." };
  }

  // Check if already an admin for this company
  const { data: existing } = await supabase
    .from("company_admins")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { success: false, error: "User is already an admin for this company" };
  }

  // Add as company admin
  const { error } = await supabase.from("company_admins").insert({
    company_id: companyId,
    user_id: user.id,
    role,
    invited_by: inviterAdminId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Update user's company_id if not set or if they are just joining
  // For admins, we enforce the company association
  await supabase
    .from("users")
    .update({ company_id: companyId })
    .eq("id", user.id);

  return { success: true };
}

// Get all admins for a company
export async function getCompanyAdmins(companyId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_admins")
    .select(
      `
      id, role, created_at,
      user:users(id, first_name, last_name, email)
    `,
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data || [];
}

// Update company admin role (only owners can do this)
export async function updateCompanyAdminRole(
  companyAdminId: string,
  newRole: "admin",
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("company_admins")
    .update({ role: newRole })
    .eq("id", companyAdminId)
    .neq("role", "owner"); // Cannot change owner role

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Remove company admin (not owner)
export async function removeCompanyAdmin(
  companyAdminId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Check if trying to remove owner
  const { data: admin } = await supabase
    .from("company_admins")
    .select("role")
    .eq("id", companyAdminId)
    .single();

  if (admin?.role === "owner") {
    return { success: false, error: "Cannot remove company owner" };
  }

  const { error } = await supabase
    .from("company_admins")
    .delete()
    .eq("id", companyAdminId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Get company by ID
export async function getCompany(companyId: string): Promise<Company | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  return data;
}

// Update company details
export async function updateCompany(
  companyId: string,
  updates: Partial<Pick<Company, "name" | "logo_url" | "description" | "contact_email">>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("companies")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", companyId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export { hashPassword, verifyPassword };
