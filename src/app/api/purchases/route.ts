import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Product } from "@/models/Product";
import { Purchase } from "@/models/Purchase";

const itemSchema = z.object({
  productId: z.string().min(1),
  qtyStrips: z.coerce.number().int().positive(),
  piecesPerStrip: z.coerce.number().int().min(1).default(10),
  costPerStrip: z.coerce.number().positive(),
});

const createSchema = z.object({
  supplierId: z.string().optional().default(""),
  purchasedAt: z.string().optional().default(""),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body", "INVALID_JSON");
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid payload", "INVALID_PAYLOAD");

  const purchasedAt = parsed.data.purchasedAt ? new Date(parsed.data.purchasedAt) : new Date();
  if (Number.isNaN(purchasedAt.getTime())) return jsonError(400, "Invalid purchasedAt", "INVALID_DATE");

  const defaultBatchNo = "DEFAULT";
  const defaultExpiryDate = new Date("2099-12-31T00:00:00.000Z");

  const items = parsed.data.items.map((x) => ({
    ...x,
    batchNo: defaultBatchNo,
    expiryDate: defaultExpiryDate,
  }));

  await connectDb();

  // Update stock batches
  for (const it of items) {
    const product = await Product.findById(it.productId);
    if (!product) return jsonError(404, "Product not found", "PRODUCT_NOT_FOUND");

    const piecesPerStrip = Math.max(1, Number(it.piecesPerStrip || 10));
    const qtyStrips = Number(it.qtyStrips);
    const costPerStrip = Number(it.costPerStrip);

    if (!Number.isFinite(qtyStrips) || qtyStrips <= 0) {
      return jsonError(400, "Invalid qtyStrips", "INVALID_QTY");
    }
    if (!Number.isFinite(costPerStrip) || costPerStrip <= 0) {
      return jsonError(400, "Invalid costPerStrip", "INVALID_COST");
    }

    // Stock is stored in strips (single DEFAULT batch)
    const qtyStock = qtyStrips;
    const unitCostStock = costPerStrip; // per strip
    const unitPriceStock = 0; // not used in simplified flow
    const unitCostPerPiece = unitCostStock / piecesPerStrip;
    const unitPricePerPiece = 0;

    // Keep these on product for sales profit/calc (hidden from UI)
    (product as any).unit = "strip";
    (product as any).piecesPerStrip = piecesPerStrip;
    (product as any).purchasePriceDefault = unitCostStock;

    const expiryIso = it.expiryDate.toISOString().slice(0, 10);
    const batches = product.batches as unknown as Array<{ batchNo: unknown; expiryDate: Date; qty: number }>;
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

    // Mutate item fields to include computed snapshots for purchase record
    (it as any).piecesPerStrip = piecesPerStrip;
    (it as any).qtyBase = qtyStock;
    (it as any).unitCostPerPiece = unitCostPerPiece;
    (it as any).unitPricePerPiece = unitPricePerPiece;
    (it as any).qty = qtyStrips;
    (it as any).qtyUnit = "strip";
    (it as any).unitCost = unitCostStock;
    (it as any).unitPrice = 0;
  }

  const totalCost = items.reduce(
    (sum, it) => sum + Number((it as any).qty || 0) * Number((it as any).unitCost || 0),
    0
  );
  const purchase = await Purchase.create({
    supplierId: parsed.data.supplierId || null,
    invoiceNo: "",
    purchasedAt,
    items: items.map((it) => ({
      productId: it.productId,
      batchNo: it.batchNo,
      expiryDate: it.expiryDate,
      qty: Number((it as any).qty),
      qtyUnit: String((it as any).qtyUnit || "strip"),
      qtyBase: Number((it as any).qtyBase),
      unitCost: Number((it as any).unitCost),
      unitPrice: Number((it as any).unitPrice),
      piecesPerStrip: Number((it as any).piecesPerStrip || 1),
      unitCostPerPiece: Number((it as any).unitCostPerPiece || 0),
      unitPricePerPiece: Number((it as any).unitPricePerPiece || 0),
    })),
    totalCost,
  });

  return jsonOk({ message: "Purchase created", data: { id: String(purchase._id) } }, 201);
}


