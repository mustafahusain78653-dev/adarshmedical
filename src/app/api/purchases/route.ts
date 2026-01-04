import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
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

const createSchema = z.object({
  supplierId: z.string().optional().default(""),
  invoiceNo: z.string().optional().default(""),
  purchasedAt: z.string().optional().default(""),
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

  const purchasedAt = parsed.data.purchasedAt ? new Date(parsed.data.purchasedAt) : new Date();
  if (Number.isNaN(purchasedAt.getTime())) return jsonError(400, "Invalid purchasedAt", "INVALID_DATE");

  const items = parsed.data.items.map((x) => ({
    ...x,
    expiryDate: new Date(x.expiryDate),
  }));
  if (items.some((x) => Number.isNaN(x.expiryDate.getTime()))) {
    return jsonError(400, "Invalid item expiryDate", "INVALID_DATE");
  }

  await connectDb();

  // Update stock batches
  for (const it of items) {
    const product = await Product.findById(it.productId);
    if (!product) return jsonError(404, "Product not found", "PRODUCT_NOT_FOUND");

    const expiryIso = it.expiryDate.toISOString().slice(0, 10);
    const batches = product.batches as unknown as Array<{ batchNo: unknown; expiryDate: Date; qty: number }>;
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
  const purchase = await Purchase.create({
    supplierId: parsed.data.supplierId || null,
    invoiceNo: parsed.data.invoiceNo,
    purchasedAt,
    notes: parsed.data.notes,
    items,
    totalCost,
  });

  return jsonOk({ message: "Purchase created", data: { id: String(purchase._id) } }, 201);
}


