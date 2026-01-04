import Link from "next/link";
import { connectDb } from "@/lib/db";
import { Purchase } from "@/models/Purchase";
import { Supplier } from "@/models/Supplier";
import { Product } from "@/models/Product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string; error?: string }>;
}) {
  await connectDb();
  const sp = (await searchParams) ?? {};
  const pageSize = 20;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const filter = {};

  const [purchases, total, suppliers] = await Promise.all([
    Purchase.find(filter)
      .sort({ purchasedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<
        Array<{
          _id: unknown;
          supplierId?: unknown | null;
          items?: Array<{
            productId: unknown;
            qty: number;
            piecesPerStrip?: number;
            unitCost?: number;
          }>;
          totalCost: number;
          purchasedAt: Date;
        }>
      >(),
    Purchase.countDocuments(filter),
    Supplier.find().lean<Array<{ _id: unknown; name: string }>>(),
  ]);

  const productIds = Array.from(
    new Set(
      purchases.flatMap((p) => (p.items ?? []).map((it) => String(it.productId))).filter(Boolean)
    )
  );
  const products = await Product.find({ _id: { $in: productIds } }).lean<
    Array<{ _id: unknown; name: string }>
  >();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  function formatItem(it: {
    productId: unknown;
    qty: number;
    piecesPerStrip?: number;
    unitCost?: number;
  }) {
    const p = productMap.get(String(it.productId));
    const name = p?.name ?? "Unknown";
    const qtyStrips = Number(it.qty || 0);
    const pps = Math.max(1, Number(it.piecesPerStrip || 10));
    const costPerStrip = Number(it.unitCost ?? 0);
    const costPerPiece = pps > 0 ? costPerStrip / pps : 0;
    const totalPieces = Math.max(0, Math.floor(qtyStrips * pps + 1e-9));
    return `${name}: ${qtyStrips} strip | ${pps} pcs/strip (${totalPieces} pcs) | Cost/strip ₹${costPerStrip.toFixed(
      2
    )} | Cost/pc ₹${costPerPiece.toFixed(2)}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const supplierMap = new Map(suppliers.map((s) => [String(s._id), s.name]));
  const error = sp.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchases</h1>
          <p className="text-sm text-zinc-400">Stock-in entries (supplier invoices).</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/purchases/new"
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            New Purchase
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error === "stock"
            ? "Cannot delete: stock would go negative (some of it may have been sold)."
            : "Something went wrong. Please try again."}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Recent Purchases</CardTitle>
            <div className="text-xs text-zinc-400">
              Showing {from}-{to} of {total}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 text-xs text-zinc-400">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Supplier</th>
                  <th className="py-2">Items</th>
                  <th className="py-2">Total Cost</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={String(p._id)} className="border-b border-zinc-900/60">
                    <td className="py-2 text-zinc-300">
                      {new Date(p.purchasedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 font-medium">
                      {p.supplierId ? supplierMap.get(String(p.supplierId)) ?? "-" : "-"}
                    </td>
                    <td className="py-2 text-zinc-300">
                      {p.items?.length
                        ? `${(p.items ?? []).slice(0, 3).map(formatItem).join(", ")}${
                            (p.items?.length ?? 0) > 3 ? ` +${(p.items?.length ?? 0) - 3} more` : ""
                          }`
                        : "-"}
                    </td>
                    <td className="py-2 font-medium">₹ {Number(p.totalCost).toFixed(2)}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <ConfirmDeleteButton
                          url={`/api/purchases/${String(p._id)}`}
                          confirmMessage="Delete this purchase? This will revert the stock added by this purchase (only possible if stock won't go negative)."
                        >
                          <button className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40">
                            Delete
                          </button>
                        </ConfirmDeleteButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {!purchases.length ? (
                  <tr>
                    <td className="py-6 text-sm text-zinc-400" colSpan={5}>
                      No purchases yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              {page <= 1 ? (
                <span className="rounded-lg border border-zinc-900 px-3 py-2 text-sm text-zinc-600">
                  Prev
                </span>
              ) : (
                <Link
                  className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60"
                  href={`/dashboard/purchases?page=${page - 1}`}
                >
                  Prev
                </Link>
              )}
              <div className="text-sm text-zinc-400">
                Page <span className="text-zinc-100">{page}</span> of{" "}
                <span className="text-zinc-100">{totalPages}</span>
              </div>
              {page >= totalPages ? (
                <span className="rounded-lg border border-zinc-900 px-3 py-2 text-sm text-zinc-600">
                  Next
                </span>
              ) : (
                <Link
                  className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60"
                  href={`/dashboard/purchases?page=${page + 1}`}
                >
                  Next
                </Link>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}


