"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/ui";

export function NavButtonLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={cn(className)}
      onClick={() => router.push(href)}
    >
      {children}
    </button>
  );
}


