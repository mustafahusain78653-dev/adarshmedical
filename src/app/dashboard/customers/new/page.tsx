import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CustomerCreateFormClient } from "./CustomerCreateFormClient";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Customer</h1>
          <p className="text-sm text-zinc-400">Create a new customer record.</p>
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
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerCreateFormClient />
        </CardContent>
      </Card>
    </div>
  );
}


