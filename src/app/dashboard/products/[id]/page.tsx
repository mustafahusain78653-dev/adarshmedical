import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Supplier } from "@/models/Supplier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { adjustBatchAction, updateProductAction } from "../actions";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  await connectDb();
  const sp = (await searchParams) ?? {};

  const [product, categories, suppliers] = await Promise.all([
    Product.findById(id).lean<ProductLean>(),
    Category.find().sort({ name: 1 }).lean<Array<{ _id: unknown; name: string }>>(),
    Supplier.find().sort({ name: 1 }).lean<Array<{ _id: unknown; name: string }>>(),
  ]);

  if (!product) redirect("/dashboard/products");

  const error = sp.error;
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

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error === "stock"
            ? "Not enough stock for that adjustment."
            : "Something went wrong. Please try again."}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProductAction} className="space-y-4">
            <input type="hidden" name="id" value={String(product._id)} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <input
                  name="name"
                  defaultValue={product.name}
                  required
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Unit</label>
                <input
                  name="unit"
                  defaultValue={product.unit || "strip"}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Generic Name</label>
                <input
                  name="genericName"
                  defaultValue={product.genericName || ""}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Brand</label>
                <input
                  name="brand"
                  defaultValue={product.brand || ""}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <select
                  name="categoryId"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                  defaultValue={product.categoryId ? String(product.categoryId) : ""}
                >
                  <option value="">-</option>
                  {categories.map((c) => (
                    <option key={String(c._id)} value={String(c._id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Default Supplier</label>
                <select
                  name="defaultSupplierId"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                  defaultValue={product.defaultSupplierId ? String(product.defaultSupplierId) : ""}
                >
                  <option value="">-</option>
                  {suppliers.map((s) => (
                    <option key={String(s._id)} value={String(s._id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Default Purchase Price</label>
                <input
                  name="purchasePriceDefault"
                  type="number"
                  step="0.01"
                  defaultValue={Number(product.purchasePriceDefault || 0)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Default Sale Price</label>
                <input
                  name="salePriceDefault"
                  type="number"
                  step="0.01"
                  defaultValue={Number(product.salePriceDefault || 0)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Min Stock</label>
                <input
                  name="minStock"
                  type="number"
                  defaultValue={Number(product.minStock || 0)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input name="isActive" type="checkbox" defaultChecked={!!product.isActive} />
              Active
            </label>

            <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
              Save product
            </button>
          </form>
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
            <form action={adjustBatchAction} className="space-y-3">
              <input type="hidden" name="productId" value={String(product._id)} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Batch No</label>
                  <input
                    name="batchNo"
                    required
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
                    placeholder="B123"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Expiry Date</label>
                  <input
                    name="expiryDate"
                    type="date"
                    required
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Qty Change</label>
                  <input
                    name="qtyChange"
                    type="number"
                    required
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
                    placeholder="e.g. 10 or -2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Unit Cost</label>
                  <input
                    name="unitCost"
                    type="number"
                    step="0.01"
                    defaultValue={Number(product.purchasePriceDefault || 0)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Unit Price</label>
                  <input
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    defaultValue={Number(product.salePriceDefault || 0)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                  />
                </div>
              </div>
              <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
                Apply adjustment
              </button>
              <div className="text-xs text-zinc-400">
                Use positive qty to add stock, negative to reduce (corrections).
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


