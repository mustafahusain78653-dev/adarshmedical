import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { loginBodySchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/password";
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

  const parsed = loginBodySchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid payload", "INVALID_PAYLOAD");

  await connectDb();

  const user = await AdminUser.findOne({ email: parsed.data.email }).lean<{
    _id: unknown;
    email: string;
    passwordHash: string;
    name?: string;
    role?: unknown;
  }>();

  if (!user) return jsonError(401, "Invalid email or password", "INVALID_CREDENTIALS");

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return jsonError(401, "Invalid email or password", "INVALID_CREDENTIALS");

  const apiUser = toApiUser(user);
  const token = signAuthToken(apiUser);

  const res = jsonOk({ token, user: apiUser });
  setSessionCookieOnResponse(res, { sub: apiUser.id, email: apiUser.email });
  return res;
}


