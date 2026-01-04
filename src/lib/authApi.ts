import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string[];
};

export function toApiUser(u: {
  _id: unknown;
  name?: string | null;
  email: string;
  role?: unknown;
}): ApiUser {
  const role =
    Array.isArray(u.role) && u.role.every((r) => typeof r === "string")
      ? (u.role as string[])
      : ["admin"];

  return {
    id: String(u._id),
    name: String(u.name ?? "Admin"),
    email: u.email,
    role,
  };
}

export function signAuthToken(user: ApiUser) {
  // Match the reference token semantics: userId + email + role[] in JWT payload.
  const payload = { userId: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, env.JWT_SECRET(), { expiresIn: "7d" });
}


