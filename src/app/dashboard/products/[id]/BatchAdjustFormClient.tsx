"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function BatchAdjustFormClient({
  productId,
  defaultUnitCost,
  defaultUnitPrice,
}: {
  productId: string;
  defaultUnitCost: number;
  defaultUnitPrice: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [batchNo, setBatchNo] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [qtyChange, setQtyChange] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(defaultUnitCost);
  const [unitPrice, setUnitPrice] = useState<number>(defaultUnitPrice);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch(`/api/products/${productId}/batches/adjust`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        batchNo,
        expiryDate,
        qtyChange,
        unitCost,
        unitPrice,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      setError(body?.error?.message || "Failed to apply adjustment.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Batch No</label>
          <input
            required
            value={batchNo}
            onChange={(e) => setBatchNo(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="B123"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Expiry Date</label>
          <input
            required
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            type="date"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Qty Change</label>
          <input
            required
            value={qtyChange}
            onChange={(e) => setQtyChange(Number(e.target.value))}
            type="number"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="e.g. 10 or -2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Unit Cost</label>
          <input
            value={unitCost}
            onChange={(e) => setUnitCost(Number(e.target.value))}
            type="number"
            step="0.01"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Unit Price</label>
          <input
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            type="number"
            step="0.01"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          />
        </div>
      </div>

      <button
        disabled={isPending}
        className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Applying..." : "Apply adjustment"}
      </button>
      <div className="text-xs text-zinc-400">
        Use positive qty to add stock, negative to reduce (corrections).
      </div>
    </form>
  );
}


