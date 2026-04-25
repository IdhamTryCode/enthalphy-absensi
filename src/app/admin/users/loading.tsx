import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-12 pt-6 lg:px-10 lg:pt-10">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </header>
      <Skeleton className="mt-5 h-10 w-full rounded-md" />
      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
