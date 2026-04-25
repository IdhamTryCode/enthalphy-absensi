"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log ke server (akan muncul di Vercel logs)
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Maaf, ada yang salah saat memuat halaman ini. Coba lagi atau kembali ke
          dashboard.
        </p>
        {error.digest ? (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Kode error:{" "}
            <span className="font-mono tabular-nums">{error.digest}</span>
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={reset}>
            <RefreshCw className="size-4" />
            Coba lagi
          </Button>
          <Link href="/dashboard" className="block">
            <Button variant="outline" className="w-full">
              <Home className="size-4" />
              Ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
