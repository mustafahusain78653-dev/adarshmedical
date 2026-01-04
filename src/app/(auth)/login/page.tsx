import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const error = sp.error;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <p className="text-sm text-zinc-400">
          Sign in to manage Adarsh Medical Store.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Invalid credentials or setup not completed.
        </div>
      ) : null}

      <form action={loginAction} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="admin@adarshmedical.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="••••••••"
          />
        </div>

        <button className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
          Sign in
        </button>
      </form>

      <div className="text-sm text-zinc-400">
        First time?{" "}
        <Link className="font-medium text-zinc-100 underline" href="/setup">
          Create admin account
        </Link>
        .
      </div>
    </div>
  );
}



