import Link from "next/link";
import { connectDb } from "@/lib/db";
import { Category } from "@/models/Category";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { deleteCategoryAction } from "./actions";
import { ConfirmActionForm } from "@/components/ui/ConfirmActionForm";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
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
          { name: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<Array<{ _id: unknown; name: string; description?: string }>>(),
    Category.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const error = sp.error;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-zinc-400">Manage product categories.</p>
        </div>
        <div className="flex gap-2">
          <form className="flex gap-2" action="/dashboard/categories" method="get">
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
            href="/dashboard/categories/new"
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Add Category
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
            <CardTitle>All Categories</CardTitle>
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
                  <th className="py-2">Name</th>
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={String(c._id)} className="border-b border-zinc-900/60">
                    <td className="py-2 font-medium">{c.name}</td>
                    <td className="py-2 text-zinc-300">{c.description || "-"}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900/60"
                          href={`/dashboard/categories/${String(c._id)}`}
                        >
                          Edit
                        </Link>
                        <ConfirmActionForm
                          action={deleteCategoryAction}
                          confirmMessage="Delete this category? This cannot be undone."
                        >
                          <input type="hidden" name="id" value={String(c._id)} />
                          <button className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40">
                            Delete
                          </button>
                        </ConfirmActionForm>
                      </div>
                    </td>
                  </tr>
                ))}
                {!categories.length ? (
                  <tr>
                    <td className="py-6 text-sm text-zinc-400" colSpan={3}>
                      No categories yet.
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
                  href={`/dashboard/categories?q=${encodeURIComponent(q)}&page=${page - 1}`}
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
                  href={`/dashboard/categories?q=${encodeURIComponent(q)}&page=${page + 1}`}
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


