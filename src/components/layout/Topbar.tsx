"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

export function Topbar({ email }: { email: string }) {
  const name = (email.split("@")[0] || email).trim();
  const displayName = name ? name.charAt(0).toUpperCase() + name.slice(1) : email;
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-zinc-800 p-2 text-zinc-100 hover:bg-zinc-900/60 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={16} />
          </button>
          <div className="text-sm text-zinc-300">Welcome {displayName}</div>
        </div>
        <form action={logoutAction}>
          <button className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900/60">
            Logout
          </button>
        </form>
      </header>
      <MobileSidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
}



