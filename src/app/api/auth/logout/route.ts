import { jsonOk } from "@/lib/api";
import { clearSessionCookieOnResponse } from "@/lib/auth";

export async function POST() {
  const res = jsonOk({ ok: true });
  clearSessionCookieOnResponse(res);
  return res;
}


