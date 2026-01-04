import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";

const itemSchema = z.object({
  productId: z.string().min(1),
  qtyPieces: z.coerce.number().int().positive(),
  unitPricePerPiece: z.coerce.number().positive(),
});

const createSchema = z.object({
  customerId: z.string().optional().default(""),
  customerName: z.string().optional().default(""),
  paymentMethod: z.string().optional().default("cash"),
  soldAt: z.string().optional().default(""),
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

  const soldAt = parsed.data.soldAt ? new Date(parsed.data.soldAt) : new Date();
  if (Number.isNaN(soldAt.getTime())) return jsonError(400, "Invalid soldAt", "INVALID_DATE");

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

  for (const reqItem of parsed.data.items) {
    const product = await Product.findById(reqItem.productId);
    if (!product) return jsonError(404, "Product not found", "PRODUCT_NOT_FOUND");

    const piecesPerStrip = Math.max(1, Number((product as any).piecesPerStrip || 10));
    const qtyPieces = Number(reqItem.qtyPieces);
    const unitPricePerPiece = Number(reqItem.unitPricePerPiece);

    const defaultBatchNo = "DEFAULT";
    const defaultExpiryDate = new Date("2099-12-31T00:00:00.000Z");

    const stripsNeeded = qtyPieces / piecesPerStrip;

    const productBatches = product.batches as unknown as ProductBatch[];
    const stockStrips = productBatches.reduce((sum, b) => sum + Number(b.qty || 0), 0);

    // Cost basis comes from last purchase cost/strip stored on product (set by Purchases)
    const purchasePriceDefault = Number((product as any).purchasePriceDefault || 0);
    const unitCost = Number.isFinite(purchasePriceDefault) && purchasePriceDefault > 0 ? purchasePriceDefault : 0;
    const unitCostPerPiece = unitCost / piecesPerStrip;

    const unitPrice = unitPricePerPiece; // entered

    // Consume from DEFAULT batch only (single-batch system).
    // IMPORTANT: Sales are NOT blocked by stock. If stock is insufficient, we consume
    // what we can (down to 0) and still record the sale (so deleting the sale won't
    // incorrectly add stock that never existed).
    let def = productBatches.find(
      (b) =>
        String(b.batchNo).toLowerCase() === defaultBatchNo.toLowerCase() &&
        new Date(b.expiryDate).toISOString().slice(0, 10) === defaultExpiryDate.toISOString().slice(0, 10)
    );
    if (!def) {
      // If stock exists but batch isn't found (legacy data), create it.
      def = { batchNo: defaultBatchNo, expiryDate: defaultExpiryDate, qty: 0, unitCost, unitPrice: 0 };
      product.batches.push(def as any);
    }

    const availableInDefault = Math.max(0, Number(def.qty) || 0);
    const stripsConsumed = Math.min(availableInDefault, stripsNeeded);
    def.qty = availableInDefault - stripsConsumed;

    await product.save();

    const lineRevenue = Math.max(0, qtyPieces * unitPricePerPiece);
    const lineCost = Math.max(0, qtyPieces * unitCostPerPiece);
    const lineProfit = Math.max(0, lineRevenue - lineCost);

    saleItems.push({
      productId: product._id,
      batchNo: defaultBatchNo,
      expiryDate: defaultExpiryDate,
      qty: stripsConsumed, // strips actually consumed from stock (can be fractional)
      qtyEntered: qtyPieces,
      unitPrice,
      unitPricePerPiece,
      unitCostPerPiece,
      piecesSold: qtyPieces,
      unitCost,
      lineRevenue,
      lineCost,
      lineProfit,
    });
    totalRevenue += lineRevenue;
    totalCost += lineCost;
  }

  const profit = Math.max(0, totalRevenue - totalCost);
  const sale = await Sale.create({
    customerId: parsed.data.customerId || null,
    customerName: parsed.data.customerName,
    paymentMethod: parsed.data.paymentMethod,
    soldAt,
    items: saleItems,
    totalRevenue,
    totalCost,
    profit,
  });

  return jsonOk({ message: "Sale created", data: { id: String(sale._id) } }, 201);
}


