import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Customer } from "@/models/Customer";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
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
  const created = await Customer.create(parsed.data);
  return jsonOk(
    {
      message: "Customer created",
      data: {
        id: String(created._id),
        name: created.name,
        phone: created.phone ?? "",
        address: created.address ?? "",
      },
    },
    201
  );
}


