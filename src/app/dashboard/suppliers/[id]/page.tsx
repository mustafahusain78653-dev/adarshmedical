import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Supplier } from "@/models/Supplier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SupplierEditFormClient } from "./SupplierEditFormClient";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDb();
  const supplier = await Supplier.findById(id).lean<{
    _id: unknown;
    name: string;
    phone?: string;
    address?: string;
    gstin?: string;
  }>();
  if (!supplier) redirect("/dashboard/suppliers");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Supplier</h1>
          <p className="text-sm text-zinc-400">Update supplier details.</p>
        </div>
        <Link
          href="/dashboard/suppliers"
          className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60"
        >
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{supplier.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierEditFormClient
            id={String(supplier._id)}
            initialName={supplier.name}
            initialPhone={supplier.phone || ""}
            initialGstin={supplier.gstin || ""}
            initialAddress={supplier.address || ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}


