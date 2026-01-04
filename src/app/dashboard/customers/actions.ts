"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { Customer } from "@/models/Customer";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
});

export async function createCustomerAction(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  });
  if (!parsed.success) redirect("/dashboard/customers");
  await connectDb();
  await Customer.create(parsed.data);
  redirect("/dashboard/customers");
}

export async function updateCustomerAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  });
  if (!id || !parsed.success) redirect("/dashboard/customers");
  await connectDb();
  await Customer.findByIdAndUpdate(id, parsed.data, { runValidators: true });
  redirect("/dashboard/customers");
}

export async function deleteCustomerAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/customers");
  await connectDb();
  await Customer.findByIdAndDelete(id);
  redirect("/dashboard/customers");
}




