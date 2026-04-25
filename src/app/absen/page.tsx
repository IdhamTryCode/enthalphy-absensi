import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getTodayStateByUserId } from "@/lib/attendance";
import { AbsenClient } from "./absen-client";

export const dynamic = "force-dynamic";

export default async function AbsenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { status: rawStatus } = await searchParams;
  const requested = rawStatus === "Pulang" ? "Pulang" : "Masuk";

  const state = await getTodayStateByUserId(user.id);
  // Guard: cegah akses langsung ke status yang sudah terkunci.
  if (requested === "Masuk" && state.checkIn) redirect("/dashboard");
  if (requested === "Pulang" && (!state.checkIn || state.checkOut)) {
    redirect("/dashboard");
  }

  return <AbsenClient status={requested} />;
}
