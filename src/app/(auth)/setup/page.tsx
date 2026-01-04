import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { AdminUser } from "@/models/AdminUser";
import { SetupFormClient } from "./SetupFormClient";

export const dynamic = "force-dynamic";

export default async function SetupPage({
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connectDb();
  const hasAdmin = (await AdminUser.countDocuments()) > 0;
  if (hasAdmin) redirect("/login");

  return (
    <SetupFormClient />
  );
}


