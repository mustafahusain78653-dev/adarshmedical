import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createSupplierAction } from "../actions";

export default async function NewSupplierPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const error = sp.error;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Supplier</h1>
          <p className="text-sm text-zinc-400">Create a new supplier record.</p>
        </div>
        <Link
          href="/dashboard/suppliers"
          className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60"
        >
          Back
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          Invalid input. Please check and try again.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Supplier Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSupplierAction} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <input
                name="name"
                required
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone</label>
                <input
                  name="phone"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">GSTIN</label>
                <input
                  name="gstin"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Address</label>
              <input
                name="address"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
              />
            </div>

            <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
              Create supplier
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


