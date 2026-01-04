"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { Product } from "@/models/Product";
import { Purchase } from "@/models/Purchase";

const itemSchema = z.object({
  productId: z.string().min(1),
  batchNo: z.string().min(1),
  expiryDate: z.string().min(1),
  qty: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().nonnegative(),
  unitPrice: z.coerce.number().nonnegative(),
});

export async function createPurchaseAction(formData: FormData) {
  const supplierId = String(formData.get("supplierId") ?? "");
  const invoiceNo = String(formData.get("invoiceNo") ?? "");
  const purchasedAtStr = String(formData.get("purchasedAt") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const itemsJson = String(formData.get("itemsJson") ?? "[]");

  let rawItems: unknown = [];
  try {
    rawItems = JSON.parse(itemsJson);
  } catch {
    redirect("/dashboard/purchases/new?error=items");
  }

  const itemsParsed = z.array(itemSchema).safeParse(rawItems);
  if (!itemsParsed.success || itemsParsed.data.length === 0) {
    redirect("/dashboard/purchases/new?error=items");
  }

  const purchasedAt = purchasedAtStr ? new Date(purchasedAtStr) : new Date();
  if (Number.isNaN(purchasedAt.getTime())) redirect("/dashboard/purchases/new?error=date");

  const items = itemsParsed.data.map((x) => ({
    ...x,
    expiryDate: new Date(x.expiryDate),
  }));

  await connectDb();

  // Update stock batches
  for (const it of items) {
    const product = await Product.findById(it.productId);
    if (!product) redirect("/dashboard/purchases/new?error=product");

    const expiryIso = it.expiryDate.toISOString().slice(0, 10);
    const batches = product.batches as unknown as Array<{ batchNo: unknown; expiryDate: Date }>;
    const idx = batches.findIndex(
      (b) =>
        String(b.batchNo).toLowerCase() === it.batchNo.toLowerCase() &&
        new Date(b.expiryDate).toISOString().slice(0, 10) === expiryIso
    );

    if (idx >= 0) {
      product.batches[idx].qty = Number(product.batches[idx].qty) + it.qty;
      product.batches[idx].unitCost = it.unitCost;
      product.batches[idx].unitPrice = it.unitPrice;
    } else {
      product.batches.push({
        batchNo: it.batchNo,
        expiryDate: it.expiryDate,
        qty: it.qty,
        unitCost: it.unitCost,
        unitPrice: it.unitPrice,
      });
    }

    await product.save();
  }

  const totalCost = items.reduce((sum, it) => sum + it.qty * it.unitCost, 0);
  await Purchase.create({
    supplierId: supplierId || null,
    invoiceNo,
    purchasedAt,
    notes,
    items,
    totalCost,
  });

  redirect("/dashboard/purchases?toast=created");
}

export async function deletePurchaseAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/purchases?error=invalid");

  await connectDb();
  const purchase = await Purchase.findById(id).lean<{
    _id: unknown;
    items: Array<{ productId: unknown; batchNo: string; expiryDate: Date; qty: number }>;
  }>();
  if (!purchase) redirect("/dashboard/purchases");

  // Revert stock changes
  for (const it of purchase.items) {
    const product = await Product.findById(it.productId);
    if (!product) redirect("/dashboard/purchases?error=product");

    const expiryIso = new Date(it.expiryDate).toISOString().slice(0, 10);
    const batches = product.batches as unknown as Array<{ batchNo: unknown; expiryDate: Date; qty: number }>;
    const idx = batches.findIndex(
      (b) =>
        String(b.batchNo).toLowerCase() === String(it.batchNo).toLowerCase() &&
        new Date(b.expiryDate).toISOString().slice(0, 10) === expiryIso
    );
    if (idx < 0) redirect("/dashboard/purchases?error=batch");

    const nextQty = Number(product.batches[idx].qty) - Number(it.qty);
    if (nextQty < 0) redirect("/dashboard/purchases?error=stock");
    product.batches[idx].qty = nextQty;
    await product.save();
  }

  await Purchase.findByIdAndDelete(id);
  redirect("/dashboard/purchases?toast=deleted");
}


