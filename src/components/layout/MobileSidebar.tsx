"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav";
import { cn } from "@/lib/ui";

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <aside className="absolute left-0 top-0 h-full w-72 border-r border-zinc-800 bg-zinc-950">
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
          <div className="text-sm font-semibold tracking-tight">
            Adarsh Medical
            <div className="text-xs font-normal text-zinc-400">Admin Panel</div>
          </div>
          <button
            className="rounded-lg border border-zinc-800 p-2 text-zinc-100 hover:bg-zinc-900/60"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
      </aside>
    </div>
  );
}


