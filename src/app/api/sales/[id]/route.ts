import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, "Missing id", "MISSING_ID");

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
  if (!sale) return jsonError(404, "Sale not found", "NOT_FOUND");

  // Revert stock changes
  for (const it of sale.items) {
    const product = await Product.findById(it.productId);
    if (!product) return jsonError(404, "Product not found", "PRODUCT_NOT_FOUND");

    type ProductBatch = { batchNo: string; expiryDate: Date; qty: number; unitCost: number; unitPrice: number };
    const productBatches = product.batches as unknown as ProductBatch[];

    const piecesPerStrip = Math.max(1, Number((product as any).piecesPerStrip || 1));
    const productUnit = String((product as any).unit || "strip");
    const isStripProduct = productUnit === "strip" && piecesPerStrip > 1;

    const expiryIso = it.expiryDate ? new Date(it.expiryDate).toISOString().slice(0, 10) : null;
    const idx = productBatches.findIndex(
      (b) =>
        String(b.batchNo).toLowerCase() === String(it.batchNo).toLowerCase() &&
        (expiryIso ? new Date(b.expiryDate).toISOString().slice(0, 10) === expiryIso : true)
    );

    if (idx >= 0) {
      product.batches[idx].qty = Number(product.batches[idx].qty) + Number(it.qty);
    } else {
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
  return jsonOk({ message: "Sale deleted" });
}


