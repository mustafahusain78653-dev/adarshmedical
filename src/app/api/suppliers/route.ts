import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Supplier } from "@/models/Supplier";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  gstin: z.string().optional().default(""),
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

  await connectDb();
  const created = await Supplier.create(parsed.data);
  return jsonOk(
    {
      message: "Supplier created",
      data: {
        id: String(created._id),
        name: created.name,
        phone: created.phone ?? "",
        address: created.address ?? "",
        gstin: created.gstin ?? "",
      },
    },
    201
  );
}


