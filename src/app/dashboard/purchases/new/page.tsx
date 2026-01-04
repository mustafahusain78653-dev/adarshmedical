import Link from "next/link";
import { connectDb } from "@/lib/db";
import { Supplier } from "@/models/Supplier";
import { Product } from "@/models/Product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createPurchaseAction } from "../actions";
import { PurchaseForm } from "./PurchaseForm";

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  await connectDb();
  const [suppliers, products] = await Promise.all([
    Supplier.find().sort({ name: 1 }).lean<Array<{ _id: unknown; name: string }>>(),
    Product.find({ isActive: true })
      .sort({ name: 1 })
      .lean<Array<{ _id: unknown; name: string; purchasePriceDefault?: number; salePriceDefault?: number }>>(),
  ]);

  const error = sp.error;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Purchase</h1>
          <p className="text-sm text-zinc-400">Add stock into inventory.</p>
        </div>
        <Link
          href="/dashboard/purchases"
          className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60"
        >
          Back
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Please fill items correctly (product, batch, expiry, qty, prices).
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseForm
            action={createPurchaseAction}
            suppliers={suppliers.map((s) => ({ id: String(s._id), name: s.name }))}
            products={products.map((p) => ({
              id: String(p._id),
              name: p.name,
              purchasePriceDefault: Number(p.purchasePriceDefault || 0),
              salePriceDefault: Number(p.salePriceDefault || 0),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}


