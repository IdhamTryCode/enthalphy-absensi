import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col bg-background p-5">
      <header className="flex items-center gap-2">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-6 w-40" />
      </header>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
