import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";

const itemSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

const createSchema = z.object({
  customerId: z.string().optional().default(""),
  customerName: z.string().optional().default(""),
  paymentMethod: z.string().optional().default("cash"),
  soldAt: z.string().optional().default(""),
  notes: z.string().optional().default(""),
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
    unitPrice: number;
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

    const productBatches = product.batches as unknown as ProductBatch[];
    const batches = [...productBatches]
      .filter((b) => Number(b.qty) > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    let remaining = reqItem.qty;

    const consumeFromBatch = (b: ProductBatch, takeQty: number) => {
      b.qty = Number(b.qty) - takeQty;
      const lineRevenue = takeQty * reqItem.unitPrice;
      const lineCost = takeQty * Number(b.unitCost);
      saleItems.push({
        productId: product._id,
        batchNo: String(b.batchNo),
        expiryDate: b.expiryDate,
        qty: takeQty,
        unitPrice: reqItem.unitPrice,
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

    if (remaining > 0) return jsonError(409, "Not enough stock", "STOCK");

    await product.save();
  }

  const profit = totalRevenue - totalCost;
  const sale = await Sale.create({
    customerId: parsed.data.customerId || null,
    customerName: parsed.data.customerName,
    paymentMethod: parsed.data.paymentMethod,
    notes: parsed.data.notes,
    soldAt,
    items: saleItems,
    totalRevenue,
    totalCost,
    profit,
  });

  return jsonOk({ message: "Sale created", data: { id: String(sale._id) } }, 201);
}


