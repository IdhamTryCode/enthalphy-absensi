import { listProfiles } from "@/lib/users";
import { listDivisions } from "@/lib/divisions";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, divisions] = await Promise.all([listProfiles(), listDivisions()]);
  return <UsersClient initialUsers={users} divisions={divisions} />;
}
