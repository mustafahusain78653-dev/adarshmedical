import Link from "next/link";
import { connectDb } from "@/lib/db";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SaleForm } from "./SaleForm";

export default async function NewSalePage({
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connectDb();
  const [products, customers] = await Promise.all([
    Product.find({ isActive: true })
      .sort({ name: 1 })
      .lean<
        Array<{
          _id: unknown;
          name: string;
          salePriceDefault?: number;
          batches?: Array<{ batchNo: string; expiryDate: Date; qty: number; unitPrice?: number }>;
        }>
      >(),
    Customer.find().sort({ name: 1 }).lean<Array<{ _id: unknown; name: string }>>(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Sale</h1>
          <p className="text-sm text-zinc-400">Record a sale and reduce stock.</p>
        </div>
        <Link
          href="/dashboard/sales"
          className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60"
        >
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sale</CardTitle>
        </CardHeader>
        <CardContent>
          <SaleForm
            customers={customers.map((c) => ({ id: String(c._id), name: c.name }))}
            products={products.map((p) => ({
              id: String(p._id),
              name: p.name,
              salePriceDefault: Number(p.salePriceDefault || 0),
              batches: (p.batches ?? []).map((b) => ({
                batchNo: String(b.batchNo),
                expiryDate: new Date(b.expiryDate).toISOString().slice(0, 10),
                qty: Number(b.qty),
                unitPrice: Number(b.unitPrice ?? p.salePriceDefault ?? 0),
              })),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}


