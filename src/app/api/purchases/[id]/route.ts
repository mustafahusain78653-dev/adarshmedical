import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Product } from "@/models/Product";
import { Purchase } from "@/models/Purchase";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, "Missing id", "MISSING_ID");

  await connectDb();
  const purchase = await Purchase.findById(id).lean<{
    _id: unknown;
    items: Array<{ productId: unknown; batchNo: string; expiryDate: Date; qty: number; qtyBase?: number }>;
  }>();
  if (!purchase) return jsonError(404, "Purchase not found", "NOT_FOUND");

  // Revert stock changes
  for (const it of purchase.items) {
    const product = await Product.findById(it.productId);
    if (!product) return jsonError(404, "Product not found", "PRODUCT_NOT_FOUND");

    const expiryIso = new Date(it.expiryDate).toISOString().slice(0, 10);
    const batches = product.batches as unknown as Array<{ batchNo: unknown; expiryDate: Date; qty: number }>;
    const idx = batches.findIndex(
      (b) =>
        String(b.batchNo).toLowerCase() === String(it.batchNo).toLowerCase() &&
        new Date(b.expiryDate).toISOString().slice(0, 10) === expiryIso
    );
    if (idx < 0) return jsonError(409, "Batch not found", "BATCH");

    const revertQty = Number(it.qtyBase ?? it.qty);
    const nextQty = Number(product.batches[idx].qty) - revertQty;
    if (nextQty < 0) return jsonError(409, "Cannot revert below zero", "STOCK");
    product.batches[idx].qty = nextQty;
    await product.save();
  }

  await Purchase.findByIdAndDelete(id);
  return jsonOk({ message: "Purchase deleted" });
}


