"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

type Option = { id: string; name: string; purchasePriceDefault?: number; salePriceDefault?: number };
type SupplierOption = { id: string; name: string };

type Item = {
  rowId: string;
  productId: string;
  batchNo: string;
  expiryDate: string;
  qty: number;
  unitCost: number;
  unitPrice: number;
};

export function PurchaseForm({
  suppliers,
  products,
  action,
}: {
  suppliers: SupplierOption[];
  products: Option[];
  action: (formData: FormData) => void;
}) {
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [items, setItems] = useState<Item[]>([
    { rowId: nanoid(), productId: "", batchNo: "", expiryDate: "", qty: 1, unitCost: 0, unitPrice: 0 },
  ]);

  const totalCost = items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitCost) || 0), 0);

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      { rowId: nanoid(), productId: "", batchNo: "", expiryDate: "", qty: 1, unitCost: 0, unitPrice: 0 },
    ]);
  }

  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form
      action={action}
      className="space-y-4"
      onSubmit={(e) => {
        const invalid = items.some(
          (it) =>
            !it.productId ||
            !it.batchNo.trim() ||
            !it.expiryDate ||
            !Number.isFinite(it.qty) ||
            it.qty <= 0 ||
            !Number.isFinite(it.unitCost) ||
            it.unitCost < 0 ||
            !Number.isFinite(it.unitPrice) ||
            it.unitPrice < 0
        );
        if (invalid) {
          e.preventDefault();
          toast.error("Please fill all item fields (product, batch, expiry, qty, cost, price).");
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Supplier</label>
          <select
            name="supplierId"
            defaultValue=""
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          >
            <option value="">-</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Invoice No</label>
          <input
            name="invoiceNo"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="Optional"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Purchase Date</label>
          <input
            name="purchasedAt"
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
                <th className="py-2">Batch</th>
                <th className="py-2">Expiry</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Unit Cost</th>
                <th className="py-2">Unit Price</th>
                <th className="py-2 text-right">Remove</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.rowId} className="border-b border-zinc-900/60">
                  <td className="py-2">
                    <select
                      value={it.productId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const p = productMap.get(id);
                        updateItem(idx, {
                          productId: id,
                          unitCost: Number(p?.purchasePriceDefault ?? 0),
                          unitPrice: Number(p?.salePriceDefault ?? 0),
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
                      value={it.batchNo}
                      onChange={(e) => updateItem(idx, { batchNo: e.target.value })}
                      className="w-32 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
                      placeholder="B123"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      value={it.expiryDate}
                      onChange={(e) => updateItem(idx, { expiryDate: e.target.value })}
                      type="date"
                      className="w-40 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      value={it.qty}
                      onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })}
                      type="number"
                      min={1}
                      className="w-20 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      value={it.unitCost === 0 ? "" : it.unitCost}
                      onChange={(e) => updateItem(idx, { unitCost: Number(e.target.value) })}
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-28 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      value={it.unitPrice === 0 ? "" : it.unitPrice}
                      onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-28 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900/60"
                      disabled={items.length === 1}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2" />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="text-xs text-zinc-400">Total Cost</div>
          <div className="text-xl font-semibold">₹ {totalCost.toFixed(2)}</div>
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

      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

      <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
        Save Purchase
      </button>
    </form>
  );
}



