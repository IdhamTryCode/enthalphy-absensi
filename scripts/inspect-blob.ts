import "dotenv/config";
import { list } from "@vercel/blob";

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌ BLOB_READ_WRITE_TOKEN belum di-set");
    process.exit(1);
  }

  let cursor: string | undefined;
  const all: { pathname: string; size: number; uploadedAt: Date }[] = [];

  do {
    const page = await list({ prefix: "absensi/", cursor, limit: 1000 });
    for (const b of page.blobs) {
      all.push({
        pathname: b.pathname,
        size: b.size,
        uploadedAt: new Date(b.uploadedAt),
      });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  if (all.length === 0) {
    console.log("Belum ada foto di folder absensi/");
    return;
  }

  // Sort terbaru dulu
  all.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  console.log(`Total foto: ${all.length}\n`);
  console.log("Per file:");
  console.log("─".repeat(80));
  for (const b of all) {
    const kb = (b.size / 1024).toFixed(1);
    const when = b.uploadedAt.toISOString().replace("T", " ").slice(0, 19);
    console.log(`${kb.padStart(7)} KB  ${when}  ${b.pathname}`);
  }

  const sizes = all.map((b) => b.size);
  const total = sizes.reduce((a, b) => a + b, 0);
  const avg = total / all.length;
  const min = Math.min(...sizes);
  const max = Math.max(...sizes);

  console.log("─".repeat(80));
  console.log(`\nStatistik:`);
  console.log(`  Jumlah:     ${all.length} foto`);
  console.log(`  Total:      ${(total / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Rata-rata:  ${(avg / 1024).toFixed(1)} KB per foto`);
  console.log(`  Min:        ${(min / 1024).toFixed(1)} KB`);
  console.log(`  Max:        ${(max / 1024).toFixed(1)} KB`);
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
