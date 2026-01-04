import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { env } from "@/lib/env";

export type SessionPayload = {
  sub: string; // admin user id
  email: string;
};

export const SESSION_COOKIE_NAME = "am_session";

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV() === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = jwt.sign(payload, env.JWT_SECRET(), { expiresIn: "7d" });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, getCookieOptions());
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", { ...getCookieOptions(), maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET()) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookieOnResponse(res: NextResponse, payload: SessionPayload) {
  const token = jwt.sign(payload, env.JWT_SECRET(), { expiresIn: "7d" });
  res.cookies.set(SESSION_COOKIE_NAME, token, getCookieOptions());
}

export function clearSessionCookieOnResponse(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE_NAME, "", { ...getCookieOptions(), maxAge: 0 });
}


