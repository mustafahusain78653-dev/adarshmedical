import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Supplier } from "@/models/Supplier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProductEditFormClient } from "./ProductEditFormClient";

export const dynamic = "force-dynamic";

type ProductLean = {
  _id: unknown;
  name: string;
  brand?: string;
  categoryId?: unknown | null;
  defaultSupplierId?: unknown | null;
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  await connectDb();

  const [product, categories, suppliers] = await Promise.all([
    Product.findById(id).lean<ProductLean>(),
    Category.find().sort({ name: 1 }).lean<Array<{ _id: unknown; name: string }>>(),
    Supplier.find().sort({ name: 1 }).lean<Array<{ _id: unknown; name: string }>>(),
  ]);

  if (!product) redirect("/dashboard/products");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="text-sm text-zinc-400">Basic product master details.</p>
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
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductEditFormClient
            id={String(product._id)}
            categories={categories.map((c) => ({ id: String(c._id), name: c.name }))}
            suppliers={suppliers.map((s) => ({ id: String(s._id), name: s.name }))}
            initial={{
              name: product.name,
              brand: product.brand || "",
              categoryId: product.categoryId ? String(product.categoryId) : "",
              defaultSupplierId: product.defaultSupplierId ? String(product.defaultSupplierId) : "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}


