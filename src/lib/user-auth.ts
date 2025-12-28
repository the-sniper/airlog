import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "./supabase/server";

const USER_JWT_SECRET = new TextEncoder().encode(
  process.env.USER_JWT_SECRET || "user-session-secret-change-me",
);
const USER_COOKIE_NAME = "user_session";
const USER_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AppUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createUserToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(USER_JWT_SECRET);
}

export async function verifyUserToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, USER_JWT_SECRET);
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

export async function setUserAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: USER_SESSION_DURATION / 1000,
    path: "/",
  });
}

export async function clearUserAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
}

export async function getUserAuthCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(USER_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const token = await getUserAuthCookie();
  if (!token) return null;

  const payload = await verifyUserToken(token);
  if (!payload) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, password_hash, created_at")
    .eq("id", payload.userId)
    .single();

  return data as AppUser | null;
}
