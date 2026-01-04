import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Category } from "@/models/Category";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
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

  await connectDb();

  const updated = await Category.findByIdAndUpdate(id, parsed.data, {
    runValidators: true,
    new: true,
  }).lean<{ _id: unknown; name: string; description?: string } | null>();

  if (!updated) return jsonError(404, "Category not found", "NOT_FOUND");

  return jsonOk({
    message: "Category updated",
    data: { id: String(updated._id), name: updated.name, description: updated.description ?? "" },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, "Missing id", "MISSING_ID");

  await connectDb();
  const deleted = await Category.findByIdAndDelete(id).lean<{ _id: unknown } | null>();
  if (!deleted) return jsonError(404, "Category not found", "NOT_FOUND");

  return jsonOk({ message: "Category deleted" });
}


