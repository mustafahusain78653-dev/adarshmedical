import { z } from "zod";

export const emailSchema = z.string().email().toLowerCase();
export const passwordSchema = z.string().min(6);

export const loginBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const setupBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  setupKey: z.string().min(1),
});


