import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Customer } from "@/models/Customer";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
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
  const updated = await Customer.findByIdAndUpdate(id, parsed.data, {
    runValidators: true,
    new: true,
  }).lean<{ _id: unknown; name: string; phone?: string; address?: string } | null>();
  if (!updated) return jsonError(404, "Customer not found", "NOT_FOUND");

  return jsonOk({
    message: "Customer updated",
    data: {
      id: String(updated._id),
      name: updated.name,
      phone: updated.phone ?? "",
      address: updated.address ?? "",
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return jsonError(400, "Missing id", "MISSING_ID");

  await connectDb();
  const deleted = await Customer.findByIdAndDelete(id).lean<{ _id: unknown } | null>();
  if (!deleted) return jsonError(404, "Customer not found", "NOT_FOUND");

  return jsonOk({ message: "Customer deleted" });
}


