"use client";

import { useState, type ReactNode } from "react";
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

type CommonProps = {
  url: string | null | undefined;
  alt: string;
  caption?: string;
};

function PhotoModal({
  url,
  alt,
  caption,
  open,
  onOpenChange,
}: CommonProps & {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!url) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl gap-3 p-0 sm:rounded-2xl"
      >
        <DialogTitle className="sr-only">Foto {alt}</DialogTitle>
        <DialogDescription className="sr-only">
          {caption ?? alt}
        </DialogDescription>
        <div className="relative w-full overflow-hidden bg-black sm:rounded-t-2xl" style={{ maxHeight: "70svh" }}>
          <Image
            src={url}
            alt={alt}
            width={800}
            height={1000}
            sizes="(min-width: 640px) 640px, 100vw"
            className="mx-auto block max-h-[70svh] w-auto object-contain"
            priority
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Tutup"
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{alt}</p>
            {caption ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">{caption}</p>
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
  );
}

function ClickableTrigger({
  url,
  alt,
  caption,
  children,
}: CommonProps & { children: (open: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  return (
    <>
      {children(() => setOpen(true))}
      <PhotoModal
        url={url}
        alt={alt}
        caption={caption}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

/**
 * Foto thumbnail (avatar style) — click-to-zoom modal.
 */
export function PhotoThumbnail({
  url,
  alt,
  size = "sm",
  caption,
}: CommonProps & { size?: Size }) {
  const dim = sizeMap[size];
  return (
    <ClickableTrigger url={url} alt={alt} caption={caption}>
      {(open) => (
        <button
          type="button"
          onClick={open}
          aria-label={`Buka foto ${alt}`}
          className={`relative ${dim.class} shrink-0 overflow-hidden rounded-md border bg-muted transition hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary`}
        >
          <Image
            src={url!}
            alt={alt}
            fill
            sizes={`${dim.px}px`}
            className="object-cover"
          />
        </button>
      )}
    </ClickableTrigger>
  );
}

/**
 * Inline link variant — kompak, untuk space sempit.
 */
export function PhotoLink(props: CommonProps) {
  return (
    <ClickableTrigger {...props}>
      {(open) => (
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <ImageIcon className="size-3" />
          Foto
        </button>
      )}
    </ClickableTrigger>
  );
}
