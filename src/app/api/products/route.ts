import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Product } from "@/models/Product";

const schema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  unit: z.string().optional().default("strip"),
  categoryId: z.string().optional().default(""),
  defaultSupplierId: z.string().optional().default(""),
  purchasePriceDefault: z.coerce.number().min(0).default(0),
  salePriceDefault: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body", "INVALID_JSON");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid payload", "INVALID_PAYLOAD");

  await connectDb();
  const created = await Product.create({
    ...parsed.data,
    categoryId: parsed.data.categoryId || null,
    defaultSupplierId: parsed.data.defaultSupplierId || null,
  });

  return jsonOk(
    {
      message: "Product created",
      data: { id: String(created._id) },
    },
    201
  );
}


