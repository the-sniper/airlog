import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createAdminClient } from "./supabase/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "your-secret-key-change-in-production",
);

const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_login: string | null;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create JWT token
export async function createToken(adminId: string): Promise<string> {
  return new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(
  token: string,
): Promise<{ adminId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { adminId: payload.adminId as string };
  } catch {
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

// Get auth cookie
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

// Clear auth cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Check if admin exists
export async function adminExists(): Promise<boolean> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("admin_users")
    .select("*", { count: "exact", head: true });
  return (count ?? 0) > 0;
}

// Get current admin from cookie
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_users")
    .select("id, email, created_at, last_login")
    .eq("id", payload.adminId)
    .single();

  return data;
}

// Create admin (only if none exists)
export async function createAdmin(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const exists = await adminExists();
  if (exists) {
    return { success: false, error: "Admin already exists" };
  }

  const passwordHash = await hashPassword(password);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("admin_users")
    .insert({ email, password_hash: passwordHash });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Login admin
export async function loginAdmin(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data: admin } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .single();

  if (!admin) {
    return { success: false, error: "Invalid credentials" };
  }

  const validPassword = await verifyPassword(password, admin.password_hash);
  if (!validPassword) {
    return { success: false, error: "Invalid credentials" };
  }

  // Update last login
  await supabase
    .from("admin_users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", admin.id);

  // Create and set token
  const token = await createToken(admin.id);
  await setAuthCookie(token);

  return { success: true };
}

// Logout admin
export async function logoutAdmin() {
  await clearAuthCookie();
}
