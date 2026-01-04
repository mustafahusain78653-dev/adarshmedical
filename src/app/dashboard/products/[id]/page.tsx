import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Supplier } from "@/models/Supplier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProductEditFormClient } from "./ProductEditFormClient";
import { BatchAdjustFormClient } from "./BatchAdjustFormClient";

export const dynamic = "force-dynamic";

type Batch = {
  batchNo: string;
  expiryDate: Date;
  qty: number;
  unitCost: number;
  unitPrice: number;
};

type ProductLean = {
  _id: unknown;
  name: string;
  unit?: string;
  genericName?: string;
  brand?: string;
  purchasePriceDefault?: number;
  salePriceDefault?: number;
  minStock?: number;
  isActive?: boolean;
  categoryId?: unknown | null;
  defaultSupplierId?: unknown | null;
  batches?: Batch[];
};

function stockQty(p: ProductLean) {
  return (p.batches ?? []).reduce((sum, b) => sum + Number(b.qty || 0), 0);
}

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

  const batches = [...(product.batches ?? [])].sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="text-sm text-zinc-400">
            Stock: <span className="font-medium text-zinc-100">{stockQty(product)}</span>{" "}
            {product.unit}
          </p>
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
              unit: product.unit || "strip",
              genericName: product.genericName || "",
              brand: product.brand || "",
              purchasePriceDefault: Number(product.purchasePriceDefault || 0),
              salePriceDefault: Number(product.salePriceDefault || 0),
              minStock: Number(product.minStock || 0),
              isActive: !!product.isActive,
              categoryId: product.categoryId ? String(product.categoryId) : "",
              defaultSupplierId: product.defaultSupplierId ? String(product.defaultSupplierId) : "",
            }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-xs text-zinc-400">
                  <tr>
                    <th className="py-2">Batch</th>
                    <th className="py-2">Expiry</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Cost</th>
                    <th className="py-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={`${b.batchNo}-${String(b.expiryDate)}`} className="border-b border-zinc-900/60">
                      <td className="py-2 font-medium">{b.batchNo}</td>
                      <td className="py-2 text-zinc-300">
                        {new Date(b.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-2">{b.qty}</td>
                      <td className="py-2 text-zinc-300">₹ {Number(b.unitCost).toFixed(2)}</td>
                      <td className="py-2 text-zinc-300">₹ {Number(b.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!batches.length ? (
                    <tr>
                      <td className="py-6 text-sm text-zinc-400" colSpan={5}>
                        No stock batches yet. Add stock via Purchases or manual adjustment.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Stock Adjustment</CardTitle>
          </CardHeader>
          <CardContent>
            <BatchAdjustFormClient
              productId={String(product._id)}
              defaultUnitCost={Number(product.purchasePriceDefault || 0)}
              defaultUnitPrice={Number(product.salePriceDefault || 0)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


