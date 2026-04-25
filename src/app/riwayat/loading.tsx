import { Skeleton } from "@/components/ui/skeleton";

export default function RiwayatLoading() {
  return (
    <main className="relative min-h-dvh bg-background">
      <div className="bg-brand-gradient pointer-events-none absolute inset-x-0 top-0 h-64" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-12 pt-6 lg:px-10 lg:pt-10">
        <header className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <section className="mt-8">
          <Skeleton className="h-3 w-20" />
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </section>
        <section className="mt-8 space-y-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </section>
      </div>
    </main>
  );
}
