import Link from "next/link";
import { redirect } from "next/navigation";
import { setupAction } from "@/app/actions/auth";
import { connectDb } from "@/lib/db";
import { AdminUser } from "@/models/AdminUser";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  await connectDb();
  const hasAdmin = (await AdminUser.countDocuments()) > 0;
  if (hasAdmin) redirect("/login?error=already_setup");

  const error = sp.error;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Initial Setup</h1>
        <p className="text-sm text-zinc-400">
          Create the first admin account (only needed once).
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Setup failed. Check details and try again.
        </div>
      ) : null}

      <form action={setupAction} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Admin Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="admin@adarshmedical.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Admin Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="min 6 characters"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Setup Key</label>
          <input
            name="setupKey"
            type="password"
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="from .env.local"
          />
        </div>

        <button className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
          Create admin & continue
        </button>
      </form>

      <div className="text-sm text-zinc-400">
        Already have an admin?{" "}
        <Link className="font-medium text-zinc-100 underline" href="/login">
          Sign in
        </Link>
        .
      </div>
    </div>
  );
}


