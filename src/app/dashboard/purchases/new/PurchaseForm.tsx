"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Option = {
  id: string;
  name: string;
  piecesPerStrip?: number;
  purchasePriceDefault?: number;
};
type SupplierOption = { id: string; name: string };

type Item = {
  rowId: string;
  productId: string;
  qtyStrips: number;
  piecesPerStrip: number;
  costPerStrip: number | "";
};

export function PurchaseForm({
  suppliers,
  products,
}: {
  suppliers: SupplierOption[];
  products: Option[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [items, setItems] = useState<Item[]>([
    {
      rowId: nanoid(),
      productId: "",
      qtyStrips: 1,
      piecesPerStrip: 10,
      costPerStrip: "",
    },
  ]);

  const totalCost = items.reduce(
    (sum, it) =>
      sum + (Number(it.qtyStrips) || 0) * (typeof it.costPerStrip === "number" ? it.costPerStrip : 0),
    0
  );

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      {
        rowId: nanoid(),
        productId: "",
        qtyStrips: 1,
        piecesPerStrip: 10,
        costPerStrip: "",
      },
    ]);
  }

  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        if (isPending) return;
        const invalid = items.some(
          (it) =>
            !it.productId ||
            !Number.isFinite(it.qtyStrips) ||
            it.qtyStrips <= 0 ||
            !Number.isFinite(it.piecesPerStrip) ||
            it.piecesPerStrip <= 0 ||
            typeof it.costPerStrip !== "number" ||
            !Number.isFinite(it.costPerStrip) ||
            it.costPerStrip <= 0
        );
        if (invalid) {
          e.preventDefault();
          toast.error("Please fill all item fields (product, qty strips, pieces/strip, cost/strip).");
          return;
        }

        e.preventDefault();

        const fd = new FormData(e.currentTarget);
        const supplierId = String(fd.get("supplierId") ?? "");
        const purchasedAt = String(fd.get("purchasedAt") ?? "");

        const res = await fetch("/api/purchases", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            supplierId,
            purchasedAt,
            items: items.map((it) => ({
              productId: it.productId,
              qtyStrips: Number(it.qtyStrips),
              piecesPerStrip: Number(it.piecesPerStrip),
              costPerStrip: Number(it.costPerStrip),
            })),
          }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          toast.error(body?.error?.message || "Failed to save purchase.");
          return;
        }

        toast.success("Purchase saved.");
        startTransition(() => {
          router.replace("/dashboard/purchases");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
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
                <th className="py-2">Unit</th>
                <th className="py-2">Qty (strips)</th>
                <th className="py-2">Pieces/Strip</th>
                <th className="py-2">Total Pieces</th>
                <th className="py-2">Cost/Strip</th>
                <th className="py-2">Cost/Piece</th>
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
                          piecesPerStrip: Math.max(1, Number(p?.piecesPerStrip || 10)),
                          costPerStrip:
                            Number(p?.purchasePriceDefault || 0) > 0
                              ? Number(p?.purchasePriceDefault)
                              : "",
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
                  <td className="py-2 text-zinc-300">Strip</td>
                  <td className="py-2">
                    <input
                      value={it.qtyStrips}
                      onChange={(e) => updateItem(idx, { qtyStrips: Number(e.target.value) })}
                      type="number"
                      min={1}
                      step={1}
                      className="w-24 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      value={it.piecesPerStrip}
                      onChange={(e) =>
                        updateItem(idx, { piecesPerStrip: Math.max(1, Number(e.target.value) || 1) })
                      }
                      type="number"
                      step={1}
                      min={1}
                      className="w-28 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                    />
                  </td>
                  <td className="py-2 text-zinc-300">
                    {Number(it.qtyStrips || 0) * Math.max(1, Number(it.piecesPerStrip || 1))}
                  </td>
                  <td className="py-2">
                    <input
                      value={it.costPerStrip}
                      onChange={(e) =>
                        updateItem(idx, { costPerStrip: e.target.value === "" ? "" : Number(e.target.value) })
                      }
                      type="number"
                      step="0.01"
                      min={0.01}
                      className="w-28 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                    />
                  </td>
                  <td className="py-2 text-zinc-300">
                    {(() => {
                      if (typeof it.costPerStrip !== "number") return "-";
                      return (it.costPerStrip / Math.max(1, Number(it.piecesPerStrip || 1))).toFixed(2);
                    })()}
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

      <button
        disabled={isPending}
        className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save Purchase"}
      </button>
    </form>
  );
}



