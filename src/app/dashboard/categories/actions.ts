"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { Category } from "@/models/Category";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
});

export async function createCategoryAction(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) redirect("/dashboard/categories");

  await connectDb();
  await Category.create(parsed.data);
  redirect("/dashboard/categories");
}

export async function updateCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!id || !parsed.success) redirect("/dashboard/categories");

  await connectDb();
  await Category.findByIdAndUpdate(id, parsed.data, { runValidators: true });
  redirect("/dashboard/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/categories");
  await connectDb();
  await Category.findByIdAndDelete(id);
  redirect("/dashboard/categories");
}




