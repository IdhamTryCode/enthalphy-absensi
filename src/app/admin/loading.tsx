import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  // Layout admin pakai sidebar (lihat admin/layout.tsx) — loading state ini render
  // di dalam layout itu, jadi tidak perlu sidebar lagi.
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-12 pt-6 lg:px-10 lg:pt-10">
      <header className="space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-9 w-56" />
      </header>

      <section className="mt-6 grid grid-cols-3 gap-3 lg:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </section>

      <Skeleton className="mt-3 h-40 w-full rounded-2xl" />

      <Skeleton className="mt-6 h-10 w-full rounded-md" />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
