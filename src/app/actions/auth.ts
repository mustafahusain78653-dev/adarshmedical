"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { env } from "@/lib/env";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { AdminUser } from "@/models/AdminUser";

const emailSchema = z.string().email().toLowerCase();
const passwordSchema = z.string().min(6);

export async function setupAction(formData: FormData) {
  const parsed = z
    .object({
      email: emailSchema,
      password: passwordSchema,
      setupKey: z.string().min(1),
    })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      setupKey: formData.get("setupKey"),
    });

  if (!parsed.success) {
    redirect("/setup?error=invalid");
  }

  if (parsed.data.setupKey !== env.SETUP_KEY()) {
    redirect("/setup?error=setup_key");
  }

  await connectDb();
  const existing = await AdminUser.countDocuments();
  if (existing > 0) {
    redirect("/login?error=already_setup");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await AdminUser.create({
    email: parsed.data.email,
    passwordHash,
    name: "Admin",
  });

  await setSessionCookie({ sub: String(user._id), email: user.email });
  redirect("/dashboard?toast=setup");
}

export async function loginAction(formData: FormData) {
  const parsed = z
    .object({ email: emailSchema, password: passwordSchema })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  await connectDb();
  const user = await AdminUser.findOne({ email: parsed.data.email }).lean<{
    _id: unknown;
    email: string;
    passwordHash: string;
  }>();
  if (!user) redirect("/login?error=invalid");

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) redirect("/login?error=invalid");

  await setSessionCookie({ sub: String(user._id), email: user.email });
  redirect("/dashboard?toast=login");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login?toast=logout");
}


