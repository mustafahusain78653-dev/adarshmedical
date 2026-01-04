"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Option = { id: string; name: string };

export function ProductCreateFormClient({
  categories,
  suppliers,
}: {
  categories: Option[];
  suppliers: Option[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("strip");
  const [genericName, setGenericName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [defaultSupplierId, setDefaultSupplierId] = useState("");
  const [purchasePriceDefault, setPurchasePriceDefault] = useState<number>(0);
  const [salePriceDefault, setSalePriceDefault] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        unit,
        genericName,
        brand,
        categoryId,
        defaultSupplierId,
        purchasePriceDefault,
        salePriceDefault,
        minStock,
        isActive,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      setError(body?.error?.message || "Failed to create product.");
      return;
    }

    startTransition(() => {
      router.replace("/dashboard/products");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="Paracetamol 650mg"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Unit</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="strip / bottle / box"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Generic Name</label>
          <input
            value={genericName}
            onChange={(e) => setGenericName(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Brand</label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          >
            <option value="">-</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Default Supplier</label>
          <select
            value={defaultSupplierId}
            onChange={(e) => setDefaultSupplierId(e.target.value)}
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
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Default Purchase Price</label>
          <input
            type="number"
            step="0.01"
            value={purchasePriceDefault}
            onChange={(e) => setPurchasePriceDefault(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Default Sale Price</label>
          <input
            type="number"
            step="0.01"
            value={salePriceDefault}
            onChange={(e) => setSalePriceDefault(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Min Stock</label>
          <input
            type="number"
            value={minStock}
            onChange={(e) => setMinStock(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input checked={isActive} onChange={(e) => setIsActive(e.target.checked)} type="checkbox" />
        Active
      </label>

      <button
        disabled={isPending}
        className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create product"}
      </button>
    </form>
  );
}


