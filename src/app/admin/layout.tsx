import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser, signOut } from "@/lib/current-user";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogOut, ArrowLeft } from "lucide-react";
import { AdminSidebarNav, AdminMobileNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const initial = user.name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-dvh bg-background lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden border-r bg-card lg:flex lg:w-64 lg:flex-col">
        <div className="border-b p-5">
          <Image
            src="/logo.png"
            alt="Enthalphy"
            width={130}
            height={44}
            style={{ width: "auto", height: "auto" }}
            priority
          />
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-primary">
            <ShieldCheck className="size-3" />
            Admin Panel
          </div>
        </div>

        <AdminSidebarNav />

        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {initial}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Admin
              </p>
            </div>
          </div>
          <Link href="/dashboard" className="block">
            <Button variant="ghost" size="sm" className="mt-2 w-full justify-start">
              <ArrowLeft className="size-4" />
              Ke Dashboard
            </Button>
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut();
              redirect("/login");
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              <LogOut className="size-4" />
              Keluar
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="size-9 rounded-full">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" />
            Admin
          </span>
        </div>
        <AdminMobileNav />
      </header>

      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
