"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, X, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Size = "xs" | "sm" | "md";

const sizeMap: Record<Size, { class: string; px: number }> = {
  xs: { class: "size-8", px: 32 },
  sm: { class: "size-10", px: 40 },
  md: { class: "size-14", px: 56 },
};

export function PhotoThumbnail({
  url,
  alt,
  size = "sm",
  caption,
}: {
  url: string | null | undefined;
  alt: string;
  size?: Size;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  const dim = sizeMap[size];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Buka foto ${alt}`}
        className={`relative ${dim.class} shrink-0 overflow-hidden rounded-md border bg-muted transition hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary`}
      >
        <Image
          src={url}
          alt={alt}
          fill
          sizes={`${dim.px}px`}
          className="object-cover"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-2xl gap-3 p-0 sm:rounded-2xl"
        >
          <DialogTitle className="sr-only">Foto {alt}</DialogTitle>
          <DialogDescription className="sr-only">
            {caption ?? alt}
          </DialogDescription>
          <div className="relative aspect-square w-full overflow-hidden bg-muted sm:rounded-t-2xl">
            <Image
              src={url}
              alt={alt}
              fill
              sizes="(min-width: 640px) 640px, 100vw"
              className="object-contain"
              priority
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup"
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition hover:bg-background"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex items-start justify-between gap-3 px-5 pb-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{alt}</p>
              {caption ? (
                <p className="truncate text-xs text-muted-foreground">
                  {caption}
                </p>
              ) : null}
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              Buka di tab baru
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Inline variant — tampil sebagai link kecil dengan ikon, click → modal.
 * Cocok untuk space sempit di card sub-section.
 */
export function PhotoLink({
  url,
  alt,
  caption,
}: {
  url: string | null | undefined;
  alt: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
      >
        <ImageIcon className="size-3" />
        Foto
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-2xl gap-3 p-0 sm:rounded-2xl"
        >
          <DialogTitle className="sr-only">Foto {alt}</DialogTitle>
          <DialogDescription className="sr-only">
            {caption ?? alt}
          </DialogDescription>
          <div className="relative aspect-square w-full overflow-hidden bg-muted sm:rounded-t-2xl">
            <Image
              src={url}
              alt={alt}
              fill
              sizes="(min-width: 640px) 640px, 100vw"
              className="object-contain"
              priority
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup"
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition hover:bg-background"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex items-start justify-between gap-3 px-5 pb-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{alt}</p>
              {caption ? (
                <p className="truncate text-xs text-muted-foreground">
                  {caption}
                </p>
              ) : null}
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              Tab baru
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
