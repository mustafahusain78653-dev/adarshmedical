"use client";

import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import { toast } from "sonner";

export function ConfirmDeleteButton({
  url,
  confirmMessage,
  children,
  onSuccessRedirectTo,
}: {
  url: string;
  confirmMessage: string;
  children?: React.ReactNode;
  onSuccessRedirectTo?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    const ok = window.confirm(confirmMessage);
    if (!ok) return;

    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      toast.error(body?.error?.message || "Delete failed.");
      return;
    }

    toast.success("Deleted.");
    startTransition(() => {
      if (onSuccessRedirectTo) router.replace(onSuccessRedirectTo);
      router.refresh();
    });
  }

  if (!React.isValidElement(children)) {
    // Don't crash the whole page if someone accidentally renders this without a single element child.
    return null;
  }

  const childEl = children as React.ReactElement<{
    onClick?: React.MouseEventHandler;
    disabled?: boolean;
    type?: string;
  }>;

  const childProps = (childEl.props ?? {}) as {
    onClick?: React.MouseEventHandler;
    disabled?: boolean;
    type?: string;
  };

  const existingOnClick = childProps.onClick;
  const existingDisabled = Boolean(childProps.disabled);
  const typeProp = childProps.type;

  return React.cloneElement(childEl, {
    onClick: async (e: React.MouseEvent) => {
      await onClick(e);
      existingOnClick?.(e);
    },
    disabled: existingDisabled || isPending,
    ...(childEl.type === "button" && !typeProp ? { type: "button" } : null),
  });
}
