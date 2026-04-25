"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Camera,
  MapPin,
  ArrowLeft,
  RefreshCw,
  Check,
  Loader2,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitAttendance } from "@/lib/actions";

type Status = "Masuk" | "Pulang";
type Coords = { lat: number; lng: number; accuracy: number };

const MAX_DIM = 1280;
const JPEG_QUALITY = 0.8;

async function compressImage(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await canvas.convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY });
}

export function AbsenClient({ status }: { status: Status }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");

  const startCamera = useCallback(async () => {
    // Kalau sudah ada stream aktif, jangan start ulang (Strict Mode double-invoke guard).
    if (streamRef.current) return;
    setCameraError(null);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      // Race: kalau effect cleanup sudah jalan duluan, video sudah hilang — buang stream.
      if (!videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      try {
        await video.play();
      } catch (playErr) {
        // AbortError terjadi kalau load request ditimpa (Strict Mode re-run). Diam-diam abaikan.
        const name = (playErr as DOMException)?.name;
        if (name !== "AbortError") throw playErr;
      }
    } catch (err) {
      stream?.getTracks().forEach((t) => t.stop());
      if (streamRef.current === stream) streamRef.current = null;
      const msg = err instanceof Error ? err.message : "Gagal akses kamera";
      setCameraError(msg);
    }
  }, []);

  const stopCamera = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Browser tidak mendukung GPS");
      return;
    }
    setGeoError(null);
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Izin lokasi ditolak. Aktifkan di pengaturan browser.",
          2: "Lokasi tidak tersedia. Pastikan GPS aktif.",
          3: "Waktu pencarian GPS habis. Coba lagi.",
        };
        setGeoError(messages[err.code] ?? err.message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  // Sinkronisasi ke MediaDevices & Geolocation (platform API eksternal).
  // setState di callback cuma muncul kalau user/perangkat menolak izin — ini justru use case
  // yang direkomendasikan React untuk effect (external system sync), bukan cascading render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera();
    requestLocation();
    return () => stopCamera();
  }, [startCamera, stopCamera, requestLocation]);

  const takePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      toast.error("Kamera belum siap");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const raw = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.95),
    );
    if (!raw) {
      toast.error("Gagal mengambil foto");
      return;
    }
    const compressed = await compressImage(raw);
    setPhotoBlob(compressed);
    setPhotoUrl(URL.createObjectURL(compressed));
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoBlob(null);
    setPhotoUrl(null);
    startCamera();
  }, [photoUrl, startCamera]);

  const canSubmit = Boolean(photoBlob && coords && !pending);

  const onSubmit = useCallback(async () => {
    if (!photoBlob || !coords || pending) return;
    setPending(true);
    const fd = new FormData();
    fd.set("status", status);
    fd.set("latitude", String(coords.lat));
    fd.set("longitude", String(coords.lng));
    fd.set("photo", photoBlob, `absen-${Date.now()}.jpg`);
    fd.set("note", note.trim());
    try {
      const result = await submitAttendance(fd);
      if (result.ok) {
        toast.success(result.message);
        // Hard navigate biar dashboard re-fetch data fresh dari server.
        window.location.assign("/dashboard");
      } else {
        toast.error(result.error);
        setPending(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim";
      toast.error(msg);
      setPending(false);
    }
    },
    [photoBlob, coords, status, pending, note],
  );

  const hasPhoto = !!photoUrl;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-5 pb-10 pt-5 lg:max-w-6xl lg:px-10 lg:pt-8">
      <header className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-full"
            aria-label="Kembali"
          >
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {status === "Masuk" ? "Memulai hari" : "Mengakhiri hari"}
          </p>
          <h1 className="text-lg font-semibold tracking-tight lg:text-2xl">
            {status === "Masuk" ? "Check-in" : "Check-out"}
          </h1>
        </div>
      </header>

      {/* Main: stack mobile, split desktop */}
      <div className="mt-6 flex flex-1 flex-col gap-6 lg:mt-10 lg:grid lg:grid-cols-5 lg:gap-8">
        {/* Camera — lg:col-span-3 */}
        <div className="slide-up lg:col-span-3">
          <div className="relative overflow-hidden rounded-3xl border bg-muted shadow-sm aspect-[3/4] lg:aspect-[4/3]">
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl!}
              alt="Foto absen"
              className="size-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="size-full scale-x-[-1] object-cover"
            />
          )}

          {!hasPhoto && !cameraError ? (
            <>
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
                </span>
                Live
              </div>
              <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs font-medium text-white/90">
                Pastikan wajahmu terlihat jelas
              </p>
            </>
          ) : null}

          {cameraError && !hasPhoto ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/95 p-6 text-center">
              <div>
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </div>
                <p className="mt-3 text-sm font-medium">Kamera tidak aktif</p>
                <p className="mt-1 text-xs text-muted-foreground">{cameraError}</p>
                <Button
                  onClick={startCamera}
                  className="mt-4"
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="size-3.5" />
                  Coba Lagi
                </Button>
              </div>
            </div>
          ) : null}
          </div>
        </div>

        {/* Panel kanan (desktop) — location + action buttons */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <LocationCard
            loading={geoLoading}
            coords={coords}
            error={geoError}
            onRetry={requestLocation}
          />

          <NoteCard
            status={status}
            value={note}
            onChange={setNote}
            disabled={pending}
          />

          <div className="hidden rounded-2xl border bg-card p-4 text-xs text-muted-foreground shadow-sm lg:block">
            <p className="font-medium text-foreground">Tips</p>
            <ul className="mt-2 space-y-1.5 leading-relaxed">
              <li>• Pastikan wajah terlihat jelas tanpa backlight</li>
              <li>• Aktifkan GPS untuk akurasi terbaik</li>
              <li>• Absensi terkunci setelah submit</li>
            </ul>
          </div>

          <div className="mt-auto pt-2 lg:pt-0">
            {hasPhoto ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  disabled={pending}
                  className="h-14 flex-1"
                  size="lg"
                >
                  <RefreshCw className="size-4" />
                  Ulang
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  className="h-14 flex-1 shadow-md shadow-primary/20"
                  size="lg"
                >
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Mengirim…
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      Kirim
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={takePhoto}
                disabled={!!cameraError}
                className="h-16 w-full text-base shadow-md shadow-primary/20"
                size="lg"
              >
                <Camera className="size-5" />
                Ambil Foto
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const NOTE_LIMIT = 500;

function NoteCard({
  status,
  value,
  onChange,
  disabled,
}: {
  status: Status;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const placeholder =
    status === "Masuk"
      ? "Apa rencana kerjamu hari ini?"
      : "Apa saja yang sudah kamu kerjakan hari ini?";
  const label = status === "Masuk" ? "Rencana Hari Ini" : "Laporan Hari Ini";

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
          <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-muted-foreground/70">
            (opsional)
          </span>
        </p>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {value.length}/{NOTE_LIMIT}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, NOTE_LIMIT))}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm leading-relaxed outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

function LocationCard({
  loading,
  coords,
  error,
  onRetry,
}: {
  loading: boolean;
  coords: Coords | null;
  error: string | null;
  onRetry: () => void;
}) {
  const accuracyTone =
    coords && coords.accuracy <= 50
      ? "text-emerald-600"
      : coords && coords.accuracy <= 200
        ? "text-amber-600"
        : "text-muted-foreground";

  return (
    <div className="mt-4 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={
            error
              ? "flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
              : "flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          }
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : error ? (
            <AlertTriangle className="size-5" />
          ) : (
            <MapPin className="size-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lokasi
            </p>
            {coords && !loading ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                <Radio className="size-2.5" />
                Terkunci
              </span>
            ) : null}
          </div>

          {loading ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Mengambil posisi GPS…
            </p>
          ) : coords ? (
            <>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
              <p className={`mt-0.5 text-xs ${accuracyTone}`}>
                Akurasi ±{Math.round(coords.accuracy)} m
              </p>
            </>
          ) : error ? (
            <>
              <p className="mt-1 text-sm font-medium text-destructive">{error}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Klik ikon gembok di address bar browser → izinkan akses Lokasi →
                reload halaman ini.
              </p>
              <button
                onClick={onRetry}
                type="button"
                className="mt-2 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10"
              >
                Coba lagi
              </button>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Menunggu GPS…</p>
          )}
        </div>
      </div>
    </div>
  );
}
