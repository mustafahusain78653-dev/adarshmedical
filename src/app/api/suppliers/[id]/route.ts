import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Supplier } from "@/models/Supplier";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
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
  const updated = await Supplier.findByIdAndUpdate(id, parsed.data, {
    runValidators: true,
    new: true,
  }).lean<{ _id: unknown; name: string; phone?: string; address?: string; gstin?: string } | null>();
  if (!updated) return jsonError(404, "Supplier not found", "NOT_FOUND");

  return jsonOk({
    message: "Supplier updated",
    data: {
      id: String(updated._id),
      name: updated.name,
      phone: updated.phone ?? "",
      address: updated.address ?? "",
      gstin: updated.gstin ?? "",
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, "Missing id", "MISSING_ID");

  await connectDb();
  const deleted = await Supplier.findByIdAndDelete(id).lean<{ _id: unknown } | null>();
  if (!deleted) return jsonError(404, "Supplier not found", "NOT_FOUND");

  return jsonOk({ message: "Supplier deleted" });
}


