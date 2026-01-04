import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Product } from "@/models/Product";

const schema = z.object({
  name: z.string().min(1),
  brand: z.string().optional().default(""),
  categoryId: z.string().optional().default(""),
  defaultSupplierId: z.string().optional().default(""),
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
    // Internal defaults (hidden from UI)
    unit: "strip",
    isActive: true,
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


