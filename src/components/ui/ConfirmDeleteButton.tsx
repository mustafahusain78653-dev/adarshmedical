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
  children: React.ReactElement<{
    onClick?: React.MouseEventHandler;
    disabled?: boolean;
    type?: string;
  }>;
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
      const body = (await res.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      toast.error(body?.error?.message || "Delete failed.");
      return;
    }

    toast.success("Deleted.");
    startTransition(() => {
      if (onSuccessRedirectTo) router.replace(onSuccessRedirectTo);
      router.refresh();
    });
  }

  const existingOnClick = children.props.onClick;
  const existingDisabled = Boolean(children.props.disabled);
  const typeProp = children.props.type;

  return React.cloneElement(children, {
    onClick: async (e: React.MouseEvent) => {
      await onClick(e);
      existingOnClick?.(e);
    },
    disabled: existingDisabled || isPending,
    ...(children.type === "button" && !typeProp ? { type: "button" } : null),
  });
}


