"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { env } from "@/lib/env";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { AdminUser } from "@/models/AdminUser";
import { emailSchema, passwordSchema } from "@/lib/validators/auth";

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
    redirect("/setup");
  }

  if (parsed.data.setupKey !== env.SETUP_KEY()) {
    redirect("/setup");
  }

  await connectDb();
  const existing = await AdminUser.countDocuments();
  if (existing > 0) {
    redirect("/login");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await AdminUser.create({
    email: parsed.data.email,
    passwordHash,
    name: "Admin",
    role: ["admin"],
  });

  await setSessionCookie({ sub: String(user._id), email: user.email });
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const parsed = z
    .object({ email: emailSchema, password: passwordSchema })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    redirect("/login");
  }

  await connectDb();
  const user = await AdminUser.findOne({ email: parsed.data.email }).lean<{
    _id: unknown;
    email: string;
    passwordHash: string;
  }>();
  if (!user) redirect("/login");

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) redirect("/login");

  await setSessionCookie({ sub: String(user._id), email: user.email });
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}


