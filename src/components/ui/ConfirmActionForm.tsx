"use client";

import { useRef } from "react";

export function ConfirmActionForm({
  action,
  confirmMessage,
  children,
  className,
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
}) {
  const submitting = useRef(false);

  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (submitting.current) return;
        const ok = window.confirm(confirmMessage);
        if (!ok) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        submitting.current = true;
      }}
    >
      {children}
    </form>
  );
}


