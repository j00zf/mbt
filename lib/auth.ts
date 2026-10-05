import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SALT_ROUNDS = 10;
const SESSION_COOKIE_NAME = "mbt_admin_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "mbt-internship-supabase-admin-secret-key-2026";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  try {
    // Check bcrypt hash first
    const isBcrypt = await bcrypt.compare(password, hashed);
    if (isBcrypt) return true;
  } catch {
    // If not a bcrypt hash or failed, check direct equality as fallback
  }
  return password === hashed;
}

export interface AdminSession {
  id: number;
  name: string;
  email: string;
  loginTime: number;
}

export function encodeSession(data: AdminSession): string {
  const payload = JSON.stringify(data);
  return Buffer.from(payload).toString("base64");
}

export function decodeSession(token: string): AdminSession | null {
  try {
    const json = Buffer.from(token, "base64").toString("utf-8");
    return JSON.parse(json) as AdminSession;
  } catch {
    return null;
  }
}

export async function setAdminSession(session: AdminSession) {
  const cookieStore = await cookies();
  const token = encodeSession(session);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!tokenCookie?.value) return null;
  return decodeSession(tokenCookie.value);
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
