"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Batch = { batchNo: string; expiryDate: string; qty: number; unitPrice: number };
type ProductOption = {
  id: string;
  name: string;
  piecesPerStrip: number;
  batches: Batch[];
};
type CustomerOption = { id: string; name: string };

type Line = { productId: string; qtyPieces: number; unitPricePerPiece: number | "" };

export function SaleForm({
  products,
  customers,
}: {
  products: ProductOption[];
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<Line[]>([
    { productId: "", qtyPieces: 1, unitPricePerPiece: "" },
  ]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  }

  function addRow() {
    setLines((prev) => [...prev, { productId: "", qtyPieces: 1, unitPricePerPiece: "" }]);
  }

  function removeRow(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalRevenue = lines.reduce((sum, it) => {
    const price = typeof it.unitPricePerPiece === "number" ? it.unitPricePerPiece : 0;
    return sum + (Number(it.qtyPieces) || 0) * price;
  }, 0);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        if (isPending) return;
        const invalid = lines.some(
          (it) =>
            !it.productId ||
            !Number.isFinite(it.qtyPieces) ||
            it.qtyPieces <= 0 ||
            typeof it.unitPricePerPiece !== "number" ||
            !Number.isFinite(it.unitPricePerPiece) ||
            it.unitPricePerPiece <= 0
        );
        if (invalid) {
          e.preventDefault();
          toast.error("Please fill all sale item fields (product, qty pieces, unit price per piece).");
          return;
        }

        e.preventDefault();

        const fd = new FormData(e.currentTarget);
        const customerId = String(fd.get("customerId") ?? "");
        const customerName = String(fd.get("customerName") ?? "");
        const paymentMethod = String(fd.get("paymentMethod") ?? "cash");
        const soldAt = String(fd.get("soldAt") ?? "");

        const res = await fetch("/api/sales", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            customerId,
            customerName,
            paymentMethod,
            soldAt,
            items: lines.map((l) => ({
              productId: l.productId,
              qtyPieces: Number(l.qtyPieces),
              unitPricePerPiece: Number(l.unitPricePerPiece),
            })),
          }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          toast.error(body?.error?.message || "Failed to save sale.");
          return;
        }

        toast.success("Sale saved.");
        startTransition(() => {
          router.replace("/dashboard/sales");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Customer</label>
          <select
            name="customerId"
            defaultValue=""
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          >
            <option value="">Walk-in</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Customer Name (optional)</label>
          <input
            name="customerName"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="If not in list"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Payment</label>
          <select
            name="paymentMethod"
            defaultValue="cash"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Sale Date</label>
          <input
            name="soldAt"
            type="date"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="text-sm font-semibold">Items</div>
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900/60"
          >
            Add row
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs text-zinc-400">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2">Unit</th>
                <th className="py-2">Qty (pieces)</th>
                <th className="py-2">Unit Price (per piece)</th>
                <th className="py-2">Line Total</th>
                <th className="py-2 text-right">Remove</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((it, idx) => {
                const p = productMap.get(it.productId);
                const pps = Math.max(1, Number(p?.piecesPerStrip || 10));
                const stockStrips = (p?.batches ?? []).reduce((sum, b) => sum + Number(b.qty || 0), 0);
                const stockPieces = Math.floor(stockStrips * pps);
                return (
                  <tr key={idx} className="border-b border-zinc-900/60">
                    <td className="py-2">
                      <select
                        value={it.productId}
                        onChange={(e) => {
                          const id = e.target.value;
                          updateLine(idx, {
                            productId: id,
                            unitPricePerPiece: "",
                          });
                        }}
                        className="w-56 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                      >
                        <option value="">Select...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {it.productId ? (
                        <div className="mt-1 text-xs text-zinc-500">
                          Available: {stockPieces} pcs ({stockStrips.toFixed(2).replace(/\.00$/, "")} strips)
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2 text-zinc-300">Piece</td>
                    <td className="py-2">
                      <input
                        value={it.qtyPieces}
                        onChange={(e) => updateLine(idx, { qtyPieces: Number(e.target.value) })}
                        type="number"
                        min={1}
                        step={1}
                        className="w-20 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        value={it.unitPricePerPiece}
                        onChange={(e) =>
                          updateLine(idx, {
                            unitPricePerPiece: e.target.value === "" ? "" : Number(e.target.value),
                          })
                        }
                        type="number"
                        step="0.01"
                        min={0.01}
                        className="w-28 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                      />
                    </td>
                    <td className="py-2 font-medium">
                      ₹ {(Number(it.qtyPieces) * Number(it.unitPricePerPiece)).toFixed(2)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900/60"
                        disabled={lines.length === 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2" />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="text-xs text-zinc-400">Total Revenue</div>
          <div className="text-xl font-semibold">₹ {totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      <button
        disabled={isPending}
        className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save Sale"}
      </button>
    </form>
  );
}



