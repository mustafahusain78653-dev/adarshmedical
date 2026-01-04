"use client";

import { Toaster, toast } from "sonner";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const TOAST_MESSAGES: Record<string, { title: string; kind: "success" | "error" }> = {
  login: { title: "Logged in successfully.", kind: "success" },
  logout: { title: "Logged out successfully.", kind: "success" },
  setup: { title: "Admin account created.", kind: "success" },

  created: { title: "Created successfully.", kind: "success" },
  updated: { title: "Updated successfully.", kind: "success" },
  deleted: { title: "Deleted successfully.", kind: "success" },

  invalid: { title: "Invalid input. Please check and try again.", kind: "error" },
  items: { title: "Please add valid items and try again.", kind: "error" },
  date: { title: "Invalid date. Please check and try again.", kind: "error" },
  product: { title: "One of the selected products was not found.", kind: "error" },
  batch: { title: "Invalid batch details. Please check and try again.", kind: "error" },
  stock: { title: "Not enough stock to complete this action.", kind: "error" },
  already_setup: { title: "Admin setup already completed. Please login.", kind: "error" },
  setup_key: { title: "Incorrect setup key.", kind: "error" },
  error: { title: "Something went wrong. Please try again.", kind: "error" },
};

export function ToastProvider() {
  const params = useSearchParams();
  const pathname = usePathname();

  const toastKey = params.get("toast");
  const errorKey = params.get("error");
  const key = toastKey || errorKey;

  useEffect(() => {
    if (!key) return;
    const msg = TOAST_MESSAGES[key] ?? { title: String(key), kind: toastKey ? "success" : "error" };
    if (msg.kind === "success") toast.success(msg.title);
    else toast.error(msg.title);
  }, [pathname, key, toastKey]);

  return (
    <Toaster
      richColors
      theme="dark"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "border border-zinc-800 bg-zinc-950 text-zinc-100",
          title: "text-zinc-100",
          description: "text-zinc-300",
        },
      }}
    />
  );
}


