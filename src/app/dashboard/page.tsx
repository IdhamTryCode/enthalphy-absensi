import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Halo, {session.user?.name}</h1>
      <p className="text-muted-foreground">
        {session.user?.email}
        {session.user?.isAdmin ? " (admin)" : ""}
      </p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button variant="outline" type="submit">
          Keluar
        </Button>
      </form>
    </main>
  );
}
