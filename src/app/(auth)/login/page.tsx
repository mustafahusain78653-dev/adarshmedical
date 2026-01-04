import { LoginFormClient } from "./LoginFormClient";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="text-sm text-zinc-400">Loading...</div>}
    >
      <LoginFormClient />
    </Suspense>
  );
}
