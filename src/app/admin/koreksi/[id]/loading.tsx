import { Skeleton } from "@/components/ui/skeleton";

export default function KoreksiLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6 lg:px-10 lg:pt-10">
      <header className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-48" />
        </div>
      </header>
      <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
      <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
    </main>
  );
}
