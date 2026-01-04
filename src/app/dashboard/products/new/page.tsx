import Link from "next/link";
import { connectDb } from "@/lib/db";
import { Category } from "@/models/Category";
import { Supplier } from "@/models/Supplier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProductCreateFormClient } from "./ProductCreateFormClient";

export default async function NewProductPage({
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connectDb();
  const [categories, suppliers] = await Promise.all([
    Category.find().sort({ name: 1 }).lean<Array<{ _id: unknown; name: string }>>(),
    Supplier.find().sort({ name: 1 }).lean<Array<{ _id: unknown; name: string }>>(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Product</h1>
          <p className="text-sm text-zinc-400">Create a medicine / product item.</p>
        </div>
        <Link
          href="/dashboard/products"
          className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60"
        >
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductCreateFormClient
            categories={categories.map((c) => ({ id: String(c._id), name: c.name }))}
            suppliers={suppliers.map((s) => ({ id: String(s._id), name: s.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}


