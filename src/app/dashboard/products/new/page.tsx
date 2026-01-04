import Link from "next/link";
import { connectDb } from "@/lib/db";
import { Category } from "@/models/Category";
import { Supplier } from "@/models/Supplier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createProductAction } from "../actions";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  await connectDb();
  const [categories, suppliers] = await Promise.all([
    Category.find().sort({ name: 1 }).lean<Array<{ _id: unknown; name: string }>>(),
    Supplier.find().sort({ name: 1 }).lean<Array<{ _id: unknown; name: string }>>(),
  ]);

  const error = sp.error;

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

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Invalid input. Please check and try again.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProductAction} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
                  placeholder="Paracetamol 650mg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Unit</label>
                <input
                  name="unit"
                  defaultValue="strip"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
                  placeholder="strip / bottle / box"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Generic Name</label>
                <input
                  name="genericName"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Brand</label>
                <input
                  name="brand"
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
                  defaultValue=""
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
                  defaultValue=""
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
                  defaultValue={0}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Default Sale Price</label>
                <input
                  name="salePriceDefault"
                  type="number"
                  step="0.01"
                  defaultValue={0}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Min Stock</label>
                <input
                  name="minStock"
                  type="number"
                  defaultValue={0}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input name="isActive" type="checkbox" defaultChecked />
              Active
            </label>

            <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
              Create product
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


