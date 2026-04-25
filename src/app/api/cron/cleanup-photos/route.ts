import { NextResponse } from "next/server";
import { list, del } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETENTION_DAYS = 30;
const PREFIX = "absensi/";

export async function GET(req: Request) {
  // Wajib: CRON_SECRET harus di-set di env, tidak boleh kosong.
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    console.error(
      "[cron] CRON_SECRET is missing or too short — endpoint disabled",
    );
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }
  // Proteksi: Vercel Cron otomatis kirim header Authorization dengan CRON_SECRET.
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  let deleted = 0;
  let scanned = 0;
  let cursor: string | undefined;

  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    scanned += page.blobs.length;

    const toDelete = page.blobs
      .filter((b) => new Date(b.uploadedAt) < cutoff)
      .map((b) => b.url);

    if (toDelete.length > 0) {
      // Batch delete — @vercel/blob mendukung array urls
      await del(toDelete);
      deleted += toDelete.length;
    }

    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return NextResponse.json({
    ok: true,
    retentionDays: RETENTION_DAYS,
    cutoff: cutoff.toISOString(),
    scanned,
    deleted,
  });
}
