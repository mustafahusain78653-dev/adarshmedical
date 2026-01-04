import Link from "next/link";
import { connectDb } from "@/lib/db";
import { Sale } from "@/models/Sale";
import { Customer } from "@/models/Customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";

export default async function SalesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string; error?: string }>;
}) {
  await connectDb();
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const pageSize = 20;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const filter = q
    ? {
        $or: [
          { customerName: { $regex: q, $options: "i" } },
          { paymentMethod: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const [sales, total, customers] = await Promise.all([
    Sale.find(filter)
      .sort({ soldAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<
        Array<{
          _id: unknown;
          soldAt: Date;
          customerId?: unknown | null;
          customerName?: string;
          paymentMethod?: string;
          items?: unknown[];
          totalRevenue: number;
          profit: number;
        }>
      >(),
    Sale.countDocuments(filter),
    Customer.find().lean<Array<{ _id: unknown; name: string }>>(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const customerMap = new Map(customers.map((c) => [String(c._id), c.name]));
  const error = sp.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="text-sm text-zinc-400">Sales entries (revenue & profit).</p>
        </div>
        <div className="flex gap-2">
          <form className="flex gap-2" action="/dashboard/sales" method="get">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search..."
              className="w-56 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            />
            <button className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60">
              Search
            </button>
          </form>
          <Link
            href="/dashboard/sales/new"
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            New Sale
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Something went wrong. Please try again.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Recent Sales</CardTitle>
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
                  <th className="py-2">Customer</th>
                  <th className="py-2">Items</th>
                  <th className="py-2">Revenue</th>
                  <th className="py-2">Profit</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={String(s._id)} className="border-b border-zinc-900/60">
                    <td className="py-2 text-zinc-300">
                      {new Date(s.soldAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 font-medium">
                      {s.customerId
                        ? customerMap.get(String(s.customerId)) ?? "-"
                        : s.customerName || "Walk-in"}
                    </td>
                    <td className="py-2 text-zinc-300">{s.items?.length ?? 0}</td>
                    <td className="py-2 font-medium">
                      ₹ {Number(s.totalRevenue).toFixed(2)}
                    </td>
                    <td className="py-2 font-medium text-green-400">
                      ₹ {Number(s.profit).toFixed(2)}
                    </td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <ConfirmDeleteButton
                          url={`/api/sales/${String(s._id)}`}
                          confirmMessage="Delete this sale? This will add the sold stock back."
                        >
                          <button className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40">
                            Delete
                          </button>
                        </ConfirmDeleteButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {!sales.length ? (
                  <tr>
                    <td className="py-6 text-sm text-zinc-400" colSpan={6}>
                      No sales yet.
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
                  href={`/dashboard/sales?q=${encodeURIComponent(q)}&page=${page - 1}`}
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
                  href={`/dashboard/sales?q=${encodeURIComponent(q)}&page=${page + 1}`}
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


