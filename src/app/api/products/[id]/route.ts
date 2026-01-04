import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Product } from "@/models/Product";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().optional(),
  categoryId: z.string().optional(),
  defaultSupplierId: z.string().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, "Missing id", "MISSING_ID");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body", "INVALID_JSON");
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid payload", "INVALID_PAYLOAD");

  const update: Record<string, unknown> = { ...parsed.data };
  if (Object.prototype.hasOwnProperty.call(parsed.data, "categoryId")) {
    update.categoryId = parsed.data.categoryId ? parsed.data.categoryId : null;
  }
  if (Object.prototype.hasOwnProperty.call(parsed.data, "defaultSupplierId")) {
    update.defaultSupplierId = parsed.data.defaultSupplierId ? parsed.data.defaultSupplierId : null;
  }

  await connectDb();
  const updated = await Product.findByIdAndUpdate(id, update, {
    runValidators: true,
    new: true,
  }).lean<{ _id: unknown } | null>();
  if (!updated) return jsonError(404, "Product not found", "NOT_FOUND");

  return jsonOk({ message: "Product updated", data: { id: String(updated._id) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, "Missing id", "MISSING_ID");

  await connectDb();
  const deleted = await Product.findByIdAndDelete(id).lean<{ _id: unknown } | null>();
  if (!deleted) return jsonError(404, "Product not found", "NOT_FOUND");

  return jsonOk({ message: "Product deleted" });
}


