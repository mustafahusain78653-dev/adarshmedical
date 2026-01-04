"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { Product } from "@/models/Product";
import { Purchase } from "@/models/Purchase";

const itemSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().int().positive(),
  qtyUnit: z.enum(["strip", "piece"]).optional().default("strip"),
  unitCost: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
});

export async function createPurchaseAction(formData: FormData) {
  const supplierId = String(formData.get("supplierId") ?? "");
  const purchasedAtStr = String(formData.get("purchasedAt") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const itemsJson = String(formData.get("itemsJson") ?? "[]");

  let rawItems: unknown = [];
  try {
    rawItems = JSON.parse(itemsJson);
  } catch {
    redirect("/dashboard/purchases/new");
  }

  const itemsParsed = z.array(itemSchema).safeParse(rawItems);
  if (!itemsParsed.success || itemsParsed.data.length === 0) {
    redirect("/dashboard/purchases/new");
  }

  const purchasedAt = purchasedAtStr ? new Date(purchasedAtStr) : new Date();
  if (Number.isNaN(purchasedAt.getTime())) redirect("/dashboard/purchases/new");

  const defaultBatchNo = "DEFAULT";
  const defaultExpiryDate = new Date("2099-12-31T00:00:00.000Z");
  const items = itemsParsed.data.map((x) => ({
    ...x,
    batchNo: defaultBatchNo,
    expiryDate: defaultExpiryDate,
  }));

  await connectDb();

  // Update stock batches
  for (const it of items) {
    const product = await Product.findById(it.productId);
    if (!product) redirect("/dashboard/purchases/new");

    const piecesPerStrip = Math.max(1, Number((product as any).piecesPerStrip || 1));
    const productUnit = String((product as any).unit || "strip");
    const isStripProduct = productUnit === "strip" && piecesPerStrip > 1;

    const qtyEntered = Number(it.qty);
    const qtyStock = isStripProduct
      ? it.qtyUnit === "strip"
        ? qtyEntered
        : qtyEntered / piecesPerStrip
      : qtyEntered;

    const unitCostEntered = Number(it.unitCost);
    const unitPriceEntered = Number(it.unitPrice);
    // For strip-products, unitCost/unitPrice are ALWAYS treated as per-strip prices,
    // regardless of qtyUnit (qtyUnit only affects qty conversion).
    const unitCostStock = isStripProduct ? unitCostEntered : unitCostEntered;
    const unitPriceStock = isStripProduct ? unitPriceEntered : unitPriceEntered;

    const unitCostPerPiece = isStripProduct ? unitCostStock / piecesPerStrip : unitCostStock;
    const unitPricePerPiece = isStripProduct ? unitPriceStock / piecesPerStrip : unitPriceStock;

    const expiryIso = it.expiryDate.toISOString().slice(0, 10);
    const batches = product.batches as unknown as Array<{ batchNo: unknown; expiryDate: Date }>;
    const idx = batches.findIndex(
      (b) =>
        String(b.batchNo).toLowerCase() === it.batchNo.toLowerCase() &&
        new Date(b.expiryDate).toISOString().slice(0, 10) === expiryIso
    );

    if (idx >= 0) {
      product.batches[idx].qty = Number(product.batches[idx].qty) + qtyStock;
      product.batches[idx].unitCost = unitCostStock;
      product.batches[idx].unitPrice = unitPriceStock;
    } else {
      product.batches.push({
        batchNo: it.batchNo,
        expiryDate: it.expiryDate,
        qty: qtyStock,
        unitCost: unitCostStock,
        unitPrice: unitPriceStock,
      });
    }

    await product.save();

    // Store computed snapshot fields on item
    (it as any).qtyBase = qtyStock;
    (it as any).piecesPerStrip = piecesPerStrip;
    (it as any).unitCostPerPiece = unitCostPerPiece;
    (it as any).unitPricePerPiece = unitPricePerPiece;
  }

  const totalCost = items.reduce((sum, it) => sum + Number(it.qty) * Number(it.unitCost), 0);
  await Purchase.create({
    supplierId: supplierId || null,
    invoiceNo: "",
    purchasedAt,
    notes,
    items: items.map((it) => ({
      productId: it.productId,
      batchNo: it.batchNo,
      expiryDate: it.expiryDate,
      qty: Number(it.qty),
      qtyUnit: String((it as any).qtyUnit || "strip"),
      qtyBase: Number((it as any).qtyBase),
      unitCost: Number(it.unitCost),
      unitPrice: Number(it.unitPrice),
      piecesPerStrip: Number((it as any).piecesPerStrip || 1),
      unitCostPerPiece: Number((it as any).unitCostPerPiece || 0),
      unitPricePerPiece: Number((it as any).unitPricePerPiece || 0),
    })),
    totalCost,
  });

  redirect("/dashboard/purchases");
}

export async function deletePurchaseAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/purchases");

  await connectDb();
  const purchase = await Purchase.findById(id).lean<{
    _id: unknown;
    items: Array<{ productId: unknown; batchNo: string; expiryDate: Date; qty: number; qtyBase?: number }>;
  }>();
  if (!purchase) redirect("/dashboard/purchases");

  // Revert stock changes
  for (const it of purchase.items) {
    const product = await Product.findById(it.productId);
    if (!product) redirect("/dashboard/purchases");

    const expiryIso = new Date(it.expiryDate).toISOString().slice(0, 10);
    const batches = product.batches as unknown as Array<{ batchNo: unknown; expiryDate: Date; qty: number }>;
    const idx = batches.findIndex(
      (b) =>
        String(b.batchNo).toLowerCase() === String(it.batchNo).toLowerCase() &&
        new Date(b.expiryDate).toISOString().slice(0, 10) === expiryIso
    );
    if (idx < 0) redirect("/dashboard/purchases");

    const revertQty = Number(it.qtyBase ?? it.qty);
    const nextQty = Number(product.batches[idx].qty) - revertQty;
    if (nextQty < 0) redirect("/dashboard/purchases");
    product.batches[idx].qty = nextQty;
    await product.save();
  }

  await Purchase.findByIdAndDelete(id);
  redirect("/dashboard/purchases");
}


