import { MapPin, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PhotoLink, PhotoThumbnail } from "@/components/photo-thumbnail";
import type { AttendanceRow } from "@/lib/attendance-types";

type Density = "compact" | "comfortable";

type Props = {
  label: string;
  row: AttendanceRow | null;
  density?: Density;
  /** "thumbnail" tampilkan foto sebagai PhotoThumbnail (samping jam),
   *  "link" tampilkan sebagai inline PhotoLink di bawah,
   *  "none" tidak tampilkan foto sama sekali. */
  photo?: "thumbnail" | "link" | "none";
  /** Optional extra footer (mis. tombol Koreksi). */
  footer?: React.ReactNode;
};

/**
 * Status block untuk 1 record check-in atau check-out.
 * Dipakai di /admin (rekap), /dashboard (timeline), /riwayat (list).
 */
export function AttendanceStatusBlock({
  label,
  row,
  density = "comfortable",
  photo = "link",
  footer,
}: Props) {
  if (!row) {
    return (
      <div className="rounded-xl border border-dashed p-3 text-muted-foreground">
        <p
          className={
            density === "compact"
              ? "text-[10px] font-medium uppercase tracking-wider"
              : "text-[11px] font-medium uppercase tracking-wider"
          }
        >
          {label}
        </p>
        <p className="mt-1 text-sm">—</p>
      </div>
    );
  }

  const isCompact = density === "compact";
  const labelClass = isCompact
    ? "text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
    : "text-[11px] font-medium uppercase tracking-wider text-muted-foreground";
  const jamClass = isCompact
    ? "text-base font-semibold tabular-nums"
    : "text-lg font-semibold tabular-nums leading-tight";
  const flagSize = isCompact ? "text-[9px]" : "text-[10px]";
  const meta = isCompact
    ? "text-[10px] text-muted-foreground"
    : "text-[11px] text-muted-foreground";

  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-1">
        <p className={labelClass}>{label}</p>
        {row.flag ? (
          <Badge variant="destructive" className={`h-4 px-1.5 ${flagSize}`}>
            {row.flag}
          </Badge>
        ) : null}
      </div>

      {photo === "thumbnail" ? (
        <div className="mt-1 flex items-start gap-2">
          <PhotoThumbnail
            url={row.linkFoto}
            alt={`${label} ${row.jam}`}
            caption={row.alamat}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className={jamClass}>{row.jam}</p>
            <p
              className={`mt-0.5 flex items-start gap-1 ${meta}`}
              title={row.alamat}
            >
              <MapPin className="mt-0.5 size-2.5 shrink-0" />
              <span className="line-clamp-2">{row.alamat}</span>
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className={`mt-1 ${jamClass}`}>{row.jam}</p>
          <p
            className={`mt-1 flex items-start gap-1 ${meta}`}
            title={row.alamat}
          >
            <MapPin className="mt-0.5 size-2.5 shrink-0" />
            <span className={isCompact ? "line-clamp-1" : "line-clamp-2"}>
              {row.alamat}
            </span>
          </p>
        </>
      )}

      {row.note ? (
        <p
          className={`mt-${isCompact ? "1" : "2"} flex items-start gap-1 ${
            isCompact ? "text-[10px]" : "rounded-md bg-muted/50 px-2 py-1.5 text-[11px] text-foreground/80"
          }`}
        >
          <StickyNote className="mt-0.5 size-2.5 shrink-0 text-primary" />
          <span className="line-clamp-2">{row.note}</span>
        </p>
      ) : null}

      {photo === "link" ? (
        <div className="mt-1.5">
          <PhotoLink
            url={row.linkFoto}
            alt={`${label} ${row.jam}`}
            caption={row.alamat}
          />
        </div>
      ) : null}

      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}
