import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export type SessionPayload = {
  sub: string; // admin user id
  email: string;
};

const COOKIE_NAME = "am_session";

export async function setSessionCookie(payload: SessionPayload) {
  const token = jwt.sign(payload, env.JWT_SECRET(), { expiresIn: "7d" });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV() === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV() === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET()) as SessionPayload;
  } catch {
    return null;
  }
}


