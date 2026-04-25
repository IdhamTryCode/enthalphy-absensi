import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/current-user";
import { listDivisions } from "@/lib/divisions";
import { DivisiClient } from "./divisi-client";

export const dynamic = "force-dynamic";

export default async function AdminDivisiPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  const divisions = await listDivisions();
  return <DivisiClient initial={divisions} />;
}
