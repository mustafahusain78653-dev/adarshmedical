import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Customer } from "@/models/Customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CustomerEditFormClient } from "./CustomerEditFormClient";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDb();
  const customer = await Customer.findById(id).lean<{
    _id: unknown;
    name: string;
    phone?: string;
    address?: string;
  }>();
  if (!customer) redirect("/dashboard/customers");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Customer
          </h1>
          <p className="text-sm text-zinc-400">Update customer details.</p>
        </div>
        <Link
          href="/dashboard/customers"
          className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60"
        >
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerEditFormClient
            id={String(customer._id)}
            initialName={customer.name}
            initialPhone={customer.phone || ""}
            initialAddress={customer.address || ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
