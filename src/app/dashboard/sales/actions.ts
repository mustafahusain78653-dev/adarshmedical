"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";

const requestItemSchema = z.object({
  productId: z.string().min(1),
  qtyPieces: z.coerce.number().int().positive(),
  unitPricePerPiece: z.coerce.number().positive(),
});

export async function createSaleAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const customerName = String(formData.get("customerName") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "cash");
  const soldAtStr = String(formData.get("soldAt") ?? "");
  const itemsJson = String(formData.get("itemsJson") ?? "[]");

  let rawItems: unknown = [];
  try {
    rawItems = JSON.parse(itemsJson);
  } catch {
    redirect("/dashboard/sales/new");
  }

  const reqParsed = z.array(requestItemSchema).safeParse(rawItems);
  if (!reqParsed.success || reqParsed.data.length === 0) {
    redirect("/dashboard/sales/new");
  }

  const soldAt = soldAtStr ? new Date(soldAtStr) : new Date();
  if (Number.isNaN(soldAt.getTime())) redirect("/dashboard/sales/new");

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
    qtyUnit: "piece";
    qtyEntered: number;
    unitPrice: number;
    unitPricePerPiece: number;
    unitCostPerPiece: number;
    piecesSold: number;
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
    if (!product) redirect("/dashboard/sales/new");

    const piecesPerStrip = Math.max(1, Number((product as any).piecesPerStrip || 10));
    const qtyPieces = Number(req.qtyPieces);
    const unitPricePerPiece = Number(req.unitPricePerPiece);
    const stripsNeeded = qtyPieces / piecesPerStrip;

    const purchasePriceDefault = Number((product as any).purchasePriceDefault || 0);
    const unitCostStock =
      Number.isFinite(purchasePriceDefault) && purchasePriceDefault > 0 ? purchasePriceDefault : 0;
    const unitCostPerPiece = unitCostStock / piecesPerStrip;

    const productBatches = product.batches as unknown as ProductBatch[];
    const defaultBatchNo = "DEFAULT";
    const defaultExpiryDate = new Date("2099-12-31T00:00:00.000Z");

    let def = productBatches.find(
      (b) =>
        String(b.batchNo).toLowerCase() === defaultBatchNo.toLowerCase() &&
        new Date(b.expiryDate).toISOString().slice(0, 10) === defaultExpiryDate.toISOString().slice(0, 10)
    );
    if (!def) {
      def = {
        batchNo: defaultBatchNo,
        expiryDate: defaultExpiryDate,
        qty: 0,
        unitCost: unitCostStock,
        unitPrice: 0,
      };
      product.batches.push(def as any);
    } else if (unitCostStock > 0) {
      def.unitCost = unitCostStock;
    }

    const available = Math.max(0, Number(def.qty) || 0);
    const stripsConsumed = Math.min(available, stripsNeeded);
    def.qty = available - stripsConsumed;

    await product.save();

    const lineRevenue = Math.max(0, qtyPieces * unitPricePerPiece);
    const lineCost = Math.max(0, qtyPieces * unitCostPerPiece);
    const lineProfit = Math.max(0, lineRevenue - lineCost);
    saleItems.push({
      productId: product._id,
      batchNo: defaultBatchNo,
      expiryDate: defaultExpiryDate,
      qty: stripsConsumed,
      qtyUnit: "piece",
      qtyEntered: qtyPieces,
      unitPrice: unitPricePerPiece,
      unitPricePerPiece,
      unitCostPerPiece,
      piecesSold: qtyPieces,
      unitCost: unitCostStock,
      lineRevenue,
      lineCost,
      lineProfit,
    });
    totalRevenue += lineRevenue;
    totalCost += lineCost;
  }

  const profit = Math.max(0, totalRevenue - totalCost);
  await Sale.create({
    customerId: customerId || null,
    customerName,
    paymentMethod,
    soldAt,
    items: saleItems,
    totalRevenue,
    totalCost,
    profit,
  });

  redirect("/dashboard/sales");
}

export async function deleteSaleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/sales");

  await connectDb();
  const sale = await Sale.findById(id).lean<{
    _id: unknown;
    items: Array<{
      productId: unknown;
      batchNo: string;
      expiryDate: Date | null;
      qty: number;
      qtyUnit?: string;
      unitCost: number;
      unitPrice: number;
      unitPricePerPiece?: number;
    }>;
  }>();
  if (!sale) redirect("/dashboard/sales");

  // Revert stock changes
  for (const it of sale.items) {
    const product = await Product.findById(it.productId);
    if (!product) redirect("/dashboard/sales");

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
      const piecesPerStrip = Math.max(1, Number((product as any).piecesPerStrip || 1));
      const productUnit = String((product as any).unit || "strip");
      const isStripProduct = productUnit === "strip" && piecesPerStrip > 1;
      const derivedUnitPricePerPiece =
        typeof it.unitPricePerPiece === "number"
          ? it.unitPricePerPiece
          : isStripProduct && String(it.qtyUnit || "piece") === "strip"
            ? Number(it.unitPrice || 0) / piecesPerStrip
            : Number(it.unitPrice || 0);
      const unitPriceStock = isStripProduct ? derivedUnitPricePerPiece * piecesPerStrip : derivedUnitPricePerPiece;

      product.batches.push({
        batchNo: String(it.batchNo || "UNKNOWN"),
        expiryDate: it.expiryDate ? new Date(it.expiryDate) : new Date(),
        qty: Number(it.qty),
        unitCost: Number(it.unitCost || 0),
        unitPrice: Number(unitPriceStock || 0),
      });
    }
    await product.save();
  }

  await Sale.findByIdAndDelete(id);
  redirect("/dashboard/sales");
}


