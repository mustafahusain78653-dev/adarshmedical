"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SetupFormClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, setupKey }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      setError(body?.error?.message || "Setup failed. Please try again.");
      return;
    }

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Initial Setup</h1>
        <p className="text-sm text-zinc-400">Create the first admin account (only needed once).</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Admin Email</label>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="admin@adarshmedical.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Admin Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="min 6 characters"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Setup Key</label>
          <input
            name="setupKey"
            type="password"
            required
            value={setupKey}
            onChange={(e) => setSetupKey(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-200"
            placeholder="from .env.local"
          />
        </div>

        <button
          disabled={isPending}
          className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create admin & continue"}
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


