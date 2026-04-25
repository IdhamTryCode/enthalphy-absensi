import { listDivisions } from "@/lib/divisions";
import { DivisiClient } from "./divisi-client";

export const dynamic = "force-dynamic";

export default async function AdminDivisiPage() {
  const divisions = await listDivisions();
  return <DivisiClient initial={divisions} />;
}
