import { z } from "zod";
import { connectDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { Category } from "@/models/Category";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
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

  try {
    const created = await Category.create(parsed.data);
    return jsonOk(
      {
        message: "Category created",
        data: { id: String(created._id), name: created.name, description: created.description ?? "" },
      },
      201
    );
  } catch {
    return jsonError(409, "Category already exists", "DUPLICATE");
  }
}


