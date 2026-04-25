"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin", label: "Rekap Absensi", icon: ClipboardList, exact: true },
  { href: "/admin/users", label: "Karyawan", icon: Users },
  { href: "/admin/divisi", label: "Divisi", icon: Building2 },
];

function isActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav() {
  const pathname = usePathname();
  // /admin/koreksi/[id] dianggap masih bagian dari "Rekap Absensi"
  const matchedHref =
    pathname.startsWith("/admin/koreksi") ? "/admin" : pathname;

  return (
    <nav className="flex-1 space-y-1 p-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(matchedHref, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                : "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            }
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const matchedHref =
    pathname.startsWith("/admin/koreksi") ? "/admin" : pathname;

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(matchedHref, item.href, item.exact);
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              size="icon"
              className={
                active
                  ? "size-9 rounded-full bg-primary/10 text-primary"
                  : "size-9 rounded-full"
              }
              aria-label={item.label}
            >
              <Icon className="size-4" />
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
