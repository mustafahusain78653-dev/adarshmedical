"use client";

import { useState } from "react";
import { toast } from "sonner";

type Batch = { batchNo: string; expiryDate: string; qty: number; unitPrice: number };
type ProductOption = {
  id: string;
  name: string;
  salePriceDefault: number;
  batches: Batch[];
};
type CustomerOption = { id: string; name: string };

type Line = { productId: string; qty: number; unitPrice: number };

export function SaleForm({
  products,
  customers,
  action,
}: {
  products: ProductOption[];
  customers: CustomerOption[];
  action: (formData: FormData) => void;
}) {
  const [lines, setLines] = useState<Line[]>([
    { productId: "", qty: 1, unitPrice: 0 },
  ]);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  }

  function addRow() {
    setLines((prev) => [...prev, { productId: "", qty: 1, unitPrice: 0 }]);
  }

  function removeRow(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalRevenue = lines.reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0),
    0
  );

  return (
    <form
      action={action}
      className="space-y-4"
      onSubmit={(e) => {
        const invalid = lines.some(
          (it) =>
            !it.productId ||
            !Number.isFinite(it.qty) ||
            it.qty <= 0 ||
            !Number.isFinite(it.unitPrice) ||
            it.unitPrice <= 0
        );
        if (invalid) {
          e.preventDefault();
          toast.error("Please fill all sale item fields (product, qty, unit price).");
        }
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
                <th className="py-2">Qty</th>
                <th className="py-2">Unit Price</th>
                <th className="py-2">Line Total</th>
                <th className="py-2 text-right">Remove</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((it, idx) => {
                return (
                  <tr key={idx} className="border-b border-zinc-900/60">
                    <td className="py-2">
                      <select
                        value={it.productId}
                        onChange={(e) => {
                          const id = e.target.value;
                          updateLine(idx, {
                            productId: id,
                            unitPrice: 0,
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
                    </td>
                    <td className="py-2">
                      <input
                        value={it.qty}
                        onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })}
                        type="number"
                        min={1}
                        className="w-20 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        value={it.unitPrice === 0 ? "" : it.unitPrice}
                        onChange={(e) =>
                          updateLine(idx, { unitPrice: Number(e.target.value) })
                        }
                        type="number"
                        step="0.01"
                        min={0}
                        className="w-28 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                      />
                    </td>
                    <td className="py-2 font-medium">
                      ₹ {(Number(it.qty) * Number(it.unitPrice)).toFixed(2)}
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

      <div className="space-y-1">
        <label className="text-sm font-medium">Notes</label>
        <input
          name="notes"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
          placeholder="Optional"
        />
      </div>

      <input type="hidden" name="itemsJson" value={JSON.stringify(lines)} />

      <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
        Save Sale
      </button>
    </form>
  );
}



