import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Product } from "@/models/Product";

const schema = z.object({
  batchNo: z.string().min(1).transform((s) => s.trim()),
  expiryDate: z.string().min(1),
  qtyChange: z.number(),
  unitCost: z.number().optional(),
  unitPrice: z.number().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: productId } = await ctx.params;
  if (!productId) return jsonError(400, "Missing productId", "MISSING_ID");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body", "INVALID_JSON");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid payload", "INVALID_PAYLOAD");

  const expiryDate = new Date(parsed.data.expiryDate);
  if (Number.isNaN(expiryDate.getTime())) return jsonError(400, "Invalid expiryDate", "INVALID_DATE");

  await connectDb();
  const product = await Product.findById(productId);
  if (!product) return jsonError(404, "Product not found", "NOT_FOUND");

  type ProductBatch = { batchNo: string; expiryDate: Date; qty: number; unitCost: number; unitPrice: number };
  const batches = product.batches as unknown as ProductBatch[];

  const idx = batches.findIndex(
    (b) =>
      String(b.batchNo).toLowerCase() === parsed.data.batchNo.toLowerCase() &&
      new Date(b.expiryDate).toISOString().slice(0, 10) === expiryDate.toISOString().slice(0, 10)
  );

  const qtyChange = Number(parsed.data.qtyChange);
  if (!Number.isFinite(qtyChange) || qtyChange === 0) {
    return jsonError(400, "Invalid qtyChange", "INVALID_QTY");
  }

  const unitCost = parsed.data.unitCost;
  const unitPrice = parsed.data.unitPrice;

  if (idx >= 0) {
    const nextQty = Number(product.batches[idx].qty) + qtyChange;
    if (nextQty < 0) return jsonError(409, "Not enough stock", "STOCK");
    product.batches[idx].qty = nextQty;
    if (qtyChange > 0) {
      if (typeof unitCost === "number" && unitCost >= 0) product.batches[idx].unitCost = unitCost;
      if (typeof unitPrice === "number" && unitPrice >= 0) product.batches[idx].unitPrice = unitPrice;
    }
  } else {
    if (qtyChange <= 0) return jsonError(400, "Batch not found for negative adjustment", "BATCH");
    product.batches.push({
      batchNo: parsed.data.batchNo,
      expiryDate,
      qty: qtyChange,
      unitCost: typeof unitCost === "number" && unitCost >= 0 ? unitCost : 0,
      unitPrice: typeof unitPrice === "number" && unitPrice >= 0 ? unitPrice : 0,
    });
  }

  await product.save();
  return jsonOk({ message: "Batch updated" });
}


