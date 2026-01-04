import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Customer } from "@/models/Customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { updateCustomerAction } from "../actions";

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
          <h1 className="text-2xl font-semibold tracking-tight">Edit Customer</h1>
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
          <form action={updateCustomerAction} className="space-y-4">
            <input type="hidden" name="id" value={String(customer._id)} />
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <input
                name="name"
                defaultValue={customer.name}
                required
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone</label>
                <input
                  name="phone"
                  defaultValue={customer.phone || ""}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Address</label>
                <input
                  name="address"
                  defaultValue={customer.address || ""}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-200"
                />
              </div>
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


