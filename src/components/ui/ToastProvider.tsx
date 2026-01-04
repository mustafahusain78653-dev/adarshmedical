"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
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


