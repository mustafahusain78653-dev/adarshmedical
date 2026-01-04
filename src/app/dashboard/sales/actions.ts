"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";

const requestItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

export async function createSaleAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const customerName = String(formData.get("customerName") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "cash");
  const soldAtStr = String(formData.get("soldAt") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const itemsJson = String(formData.get("itemsJson") ?? "[]");

  let rawItems: unknown = [];
  try {
    rawItems = JSON.parse(itemsJson);
  } catch {
    redirect("/dashboard/sales/new?error=items");
  }

  const reqParsed = z.array(requestItemSchema).safeParse(rawItems);
  if (!reqParsed.success || reqParsed.data.length === 0) {
    redirect("/dashboard/sales/new?error=items");
  }

  const soldAt = soldAtStr ? new Date(soldAtStr) : new Date();
  if (Number.isNaN(soldAt.getTime())) redirect("/dashboard/sales/new?error=date");

  await connectDb();

  type ProductBatch = {
    batchNo: string;
    expiryDate: Date;
    qty: number;
    unitCost: number;
    unitPrice: number;
  };

  type SaleItem = {
    productId: unknown;
    batchNo: string;
    expiryDate: Date;
    qty: number;
    unitPrice: number;
    unitCost: number;
    lineRevenue: number;
    lineCost: number;
    lineProfit: number;
  };

  const saleItems: SaleItem[] = [];
  let totalRevenue = 0;
  let totalCost = 0;

  for (const req of reqParsed.data) {
    const product = await Product.findById(req.productId);
    if (!product) redirect("/dashboard/sales/new?error=product");

    const productBatches = product.batches as unknown as ProductBatch[];
    const batches = [...productBatches]
      .filter((b) => Number(b.qty) > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    let remaining = req.qty;

    const consumeFromBatch = (b: ProductBatch, takeQty: number) => {
      b.qty = Number(b.qty) - takeQty;
      const lineRevenue = takeQty * req.unitPrice;
      const lineCost = takeQty * Number(b.unitCost);
      saleItems.push({
        productId: product._id,
        batchNo: String(b.batchNo),
        expiryDate: b.expiryDate,
        qty: takeQty,
        unitPrice: req.unitPrice,
        unitCost: Number(b.unitCost),
        lineRevenue,
        lineCost,
        lineProfit: lineRevenue - lineCost,
      });
      totalRevenue += lineRevenue;
      totalCost += lineCost;
    };

    for (const b of batches) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, Number(b.qty));
      consumeFromBatch(b, take);
      remaining -= take;
    }
    if (remaining > 0) redirect("/dashboard/sales/new?error=stock");

    await product.save();
  }

  const profit = totalRevenue - totalCost;
  await Sale.create({
    customerId: customerId || null,
    customerName,
    paymentMethod,
    notes,
    soldAt,
    items: saleItems,
    totalRevenue,
    totalCost,
    profit,
  });

  redirect("/dashboard/sales?toast=created");
}

export async function deleteSaleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/sales?error=invalid");

  await connectDb();
  const sale = await Sale.findById(id).lean<{
    _id: unknown;
    items: Array<{
      productId: unknown;
      batchNo: string;
      expiryDate: Date | null;
      qty: number;
      unitCost: number;
      unitPrice: number;
    }>;
  }>();
  if (!sale) redirect("/dashboard/sales");

  // Revert stock changes
  for (const it of sale.items) {
    const product = await Product.findById(it.productId);
    if (!product) redirect("/dashboard/sales?error=product");

    type ProductBatch = { batchNo: string; expiryDate: Date; qty: number; unitCost: number; unitPrice: number };
    const productBatches = product.batches as unknown as ProductBatch[];
    const expiryIso = it.expiryDate ? new Date(it.expiryDate).toISOString().slice(0, 10) : null;
    const idx = productBatches.findIndex(
      (b) =>
        String(b.batchNo).toLowerCase() === String(it.batchNo).toLowerCase() &&
        (expiryIso ? new Date(b.expiryDate).toISOString().slice(0, 10) === expiryIso : true)
    );
    if (idx >= 0) {
      product.batches[idx].qty = Number(product.batches[idx].qty) + Number(it.qty);
    } else {
      // batch missing, recreate (best-effort)
      product.batches.push({
        batchNo: String(it.batchNo || "UNKNOWN"),
        expiryDate: it.expiryDate ? new Date(it.expiryDate) : new Date(),
        qty: Number(it.qty),
        unitCost: Number(it.unitCost || 0),
        unitPrice: Number(it.unitPrice || 0),
      });
    }
    await product.save();
  }

  await Sale.findByIdAndDelete(id);
  redirect("/dashboard/sales?toast=deleted");
}


