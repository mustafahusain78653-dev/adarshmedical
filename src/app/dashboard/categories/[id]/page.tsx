import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Category } from "@/models/Category";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CategoryEditFormClient } from "./CategoryEditFormClient";

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
          <CategoryEditFormClient
            id={String(category._id)}
            initialName={category.name}
            initialDescription={category.description || ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}


