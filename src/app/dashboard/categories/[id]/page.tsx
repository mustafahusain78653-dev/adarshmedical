import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Category } from "@/models/Category";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { updateCategoryAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDb();
  const category = await Category.findById(id).lean<{
    _id: unknown;
    name: string;
    description?: string;
  }>();
  if (!category) redirect("/dashboard/categories");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Category</h1>
          <p className="text-sm text-zinc-400">Update category details.</p>
        </div>
        <Link
          href="/dashboard/categories"
          className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60"
        >
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateCategoryAction} className="space-y-4">
            <input type="hidden" name="id" value={String(category._id)} />
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <input
                name="name"
                defaultValue={category.name}
                required
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <input
                name="description"
                defaultValue={category.description || ""}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
              />
            </div>
            <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
              Save changes
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


