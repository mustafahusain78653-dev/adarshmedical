"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { Supplier } from "@/models/Supplier";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  gstin: z.string().optional().default(""),
});

export async function createSupplierAction(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    gstin: formData.get("gstin"),
  });
  if (!parsed.success) redirect("/dashboard/suppliers");
  await connectDb();
  await Supplier.create(parsed.data);
  redirect("/dashboard/suppliers");
}

export async function updateSupplierAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    gstin: formData.get("gstin"),
  });
  if (!id || !parsed.success) redirect("/dashboard/suppliers");
  await connectDb();
  await Supplier.findByIdAndUpdate(id, parsed.data, { runValidators: true });
  redirect("/dashboard/suppliers");
}

export async function deleteSupplierAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/suppliers");
  await connectDb();
  await Supplier.findByIdAndDelete(id);
  redirect("/dashboard/suppliers");
}




