import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background p-5">
      <header className="flex items-center justify-between">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="size-9 rounded-full" />
      </header>
      <section className="mt-6 space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-32" />
      </section>
      <Skeleton className="mt-6 h-40 w-full rounded-xl" />
      <Skeleton className="mt-6 h-16 w-full rounded-lg" />
    </main>
  );
}
