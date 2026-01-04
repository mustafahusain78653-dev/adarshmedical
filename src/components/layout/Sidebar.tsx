"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui";
import { NAV_ITEMS } from "@/components/layout/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 md:flex">
      <div className="flex h-16 items-center border-b border-zinc-800 px-4">
        <div className="text-sm font-semibold tracking-tight">
          Adarsh Medical
          <div className="text-xs font-normal text-zinc-400">Admin Panel</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-zinc-900/70 text-zinc-50 ring-1 ring-inset ring-zinc-700"
                  : "text-zinc-300 hover:bg-zinc-900/60 hover:text-zinc-50"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-3 text-xs text-zinc-500">
        v0.1 • Next.js + MongoDB
      </div>
    </aside>
  );
}



