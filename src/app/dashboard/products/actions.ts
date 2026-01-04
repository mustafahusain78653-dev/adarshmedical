"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { Product } from "@/models/Product";

function asNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const productSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  unit: z.string().optional().default("strip"),
  categoryId: z.string().optional().default(""),
  defaultSupplierId: z.string().optional().default(""),
  purchasePriceDefault: z.coerce.number().min(0).default(0),
  salePriceDefault: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export async function createProductAction(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    genericName: formData.get("genericName"),
    brand: formData.get("brand"),
    unit: formData.get("unit"),
    categoryId: formData.get("categoryId"),
    defaultSupplierId: formData.get("defaultSupplierId"),
    purchasePriceDefault: formData.get("purchasePriceDefault"),
    salePriceDefault: formData.get("salePriceDefault"),
    minStock: formData.get("minStock"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) redirect("/dashboard/products/new");

  await connectDb();
  await Product.create({
    ...parsed.data,
    categoryId: parsed.data.categoryId || null,
    defaultSupplierId: parsed.data.defaultSupplierId || null,
  });
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    genericName: formData.get("genericName"),
    brand: formData.get("brand"),
    unit: formData.get("unit"),
    categoryId: formData.get("categoryId"),
    defaultSupplierId: formData.get("defaultSupplierId"),
    purchasePriceDefault: formData.get("purchasePriceDefault"),
    salePriceDefault: formData.get("salePriceDefault"),
    minStock: formData.get("minStock"),
    isActive: formData.get("isActive") === "on",
  });
  if (!id || !parsed.success) redirect("/dashboard/products");

  await connectDb();
  await Product.findByIdAndUpdate(
    id,
    {
      ...parsed.data,
      categoryId: parsed.data.categoryId || null,
      defaultSupplierId: parsed.data.defaultSupplierId || null,
    },
    { runValidators: true }
  );
  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${id}`);
  redirect(`/dashboard/products/${id}`);
}

export async function deleteProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/products");
  await connectDb();
  await Product.findByIdAndDelete(id);
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function adjustBatchAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const batchNo = String(formData.get("batchNo") ?? "").trim();
  const expiryDateStr = String(formData.get("expiryDate") ?? "");
  const qtyChange = asNumber(formData.get("qtyChange"));
  const unitCost = asNumber(formData.get("unitCost"));
  const unitPrice = asNumber(formData.get("unitPrice"));

  if (!productId || !batchNo || !expiryDateStr || !Number.isFinite(qtyChange)) {
    redirect(`/dashboard/products/${productId}`);
  }

  const expiryDate = new Date(expiryDateStr);
  if (Number.isNaN(expiryDate.getTime())) {
    redirect(`/dashboard/products/${productId}`);
  }

  await connectDb();
  const product = await Product.findById(productId);
  if (!product) redirect("/dashboard/products");

  const batches = product.batches as unknown as Array<{ batchNo: unknown; expiryDate: Date }>;
  const idx = batches.findIndex(
    (b) =>
      String(b.batchNo).toLowerCase() === batchNo.toLowerCase() &&
      new Date(b.expiryDate).toISOString().slice(0, 10) === expiryDate.toISOString().slice(0, 10)
  );

  if (idx >= 0) {
    const nextQty = Number(product.batches[idx].qty) + qtyChange;
    if (nextQty < 0) redirect(`/dashboard/products/${productId}`);
    product.batches[idx].qty = nextQty;
    if (qtyChange > 0) {
      // allow updating latest cost/price
      if (unitCost >= 0) product.batches[idx].unitCost = unitCost;
      if (unitPrice >= 0) product.batches[idx].unitPrice = unitPrice;
    }
  } else {
    if (qtyChange <= 0) redirect(`/dashboard/products/${productId}`);
    product.batches.push({
      batchNo,
      expiryDate,
      qty: qtyChange,
      unitCost: unitCost >= 0 ? unitCost : 0,
      unitPrice: unitPrice >= 0 ? unitPrice : 0,
    });
  }

  await product.save();
  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}`);
  redirect(`/dashboard/products/${productId}`);
}


