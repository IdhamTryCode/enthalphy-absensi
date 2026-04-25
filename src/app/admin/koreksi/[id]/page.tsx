import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getAttendanceById,
  getAttendanceEditHistory,
} from "@/lib/attendance";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History, MapPin, StickyNote } from "lucide-react";
import { PhotoThumbnail } from "@/components/photo-thumbnail";
import { requireAdmin } from "@/lib/current-user";
import { KoreksiForm } from "./koreksi-form";

export const dynamic = "force-dynamic";

export default async function KoreksiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  const { id } = await params;
  const attendance = await getAttendanceById(id);
  if (!attendance) notFound();
  const history = await getAttendanceEditHistory(id);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6 lg:px-10 lg:pt-10">
      <header className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="size-10 rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Admin · Koreksi
          </p>
          <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
            {attendance.nama}
          </h1>
          <p className="text-xs text-muted-foreground">
            {attendance.email} · {attendance.divisionName ?? "Tanpa divisi"}
          </p>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Record asli
          </p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums">
            {attendance.tanggal} · {attendance.status}
          </span>
        </div>
        <div className="mt-3 flex items-start gap-4">
          <PhotoThumbnail
            url={attendance.linkFoto}
            alt={`${attendance.nama} - ${attendance.status} ${attendance.tanggal}`}
            caption={attendance.alamat}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-3xl font-semibold tabular-nums tracking-tight leading-tight">
              {attendance.jam}
            </p>
            <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3 shrink-0" />
              <span>{attendance.alamat}</span>
            </p>
          </div>
        </div>
        {attendance.note ? (
          <p className="mt-3 flex items-start gap-1 rounded-md bg-muted/50 p-2 text-xs leading-relaxed">
            <StickyNote className="mt-0.5 size-3 shrink-0 text-primary" />
            {attendance.note}
          </p>
        ) : null}
      </section>

      <KoreksiForm
        attendanceId={attendance.id}
        initial={{
          jam: attendance.jam,
          note: attendance.note ?? "",
          flag: attendance.flag ?? "none",
          alamat: attendance.alamat,
        }}
      />

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <History className="size-4 text-muted-foreground" />
          Riwayat Koreksi
        </h2>
        {history.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            Belum ada koreksi.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border bg-card p-3 text-xs shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p>
                      <span className="font-medium">{h.field}</span>:{" "}
                      <span className="text-muted-foreground line-through">
                        {h.oldValue ?? "(kosong)"}
                      </span>{" "}
                      →{" "}
                      <span className="font-medium">{h.newValue ?? "(kosong)"}</span>
                    </p>
                    {h.reason ? (
                      <p className="mt-1 text-muted-foreground">
                        Alasan: {h.reason}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                    {new Date(h.createdAt).toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                    })}
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  oleh {h.editorName} ({h.editorEmail})
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
