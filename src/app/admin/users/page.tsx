import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/current-user";
import { listProfiles } from "@/lib/users";
import { listDivisions } from "@/lib/divisions";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  const [users, divisions] = await Promise.all([listProfiles(), listDivisions()]);
  return <UsersClient initialUsers={users} divisions={divisions} />;
}
