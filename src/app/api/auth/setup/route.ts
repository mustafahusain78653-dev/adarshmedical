import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { env } from "@/lib/env";
import { setupBodySchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/password";
import { AdminUser } from "@/models/AdminUser";
import { setSessionCookieOnResponse } from "@/lib/auth";
import { signAuthToken, toApiUser } from "@/lib/authApi";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body", "INVALID_JSON");
  }

  const parsed = setupBodySchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid payload", "INVALID_PAYLOAD");

  if (parsed.data.setupKey !== env.SETUP_KEY()) {
    return jsonError(401, "Invalid setup key", "INVALID_SETUP_KEY");
  }

  await connectDb();
  const existing = await AdminUser.countDocuments();
  if (existing > 0) return jsonError(409, "Already setup", "ALREADY_SETUP");

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await AdminUser.create({
    email: parsed.data.email,
    passwordHash,
    name: "Admin",
    role: ["admin"],
  });

  const apiUser = toApiUser(user.toObject());
  const token = signAuthToken(apiUser);

  const res = jsonOk({ token, user: apiUser }, 201);
  setSessionCookieOnResponse(res, { sub: apiUser.id, email: apiUser.email });
  return res;
}


