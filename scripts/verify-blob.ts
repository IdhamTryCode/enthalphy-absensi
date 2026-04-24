import "dotenv/config";
import { put, del } from "@vercel/blob";

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌ BLOB_READ_WRITE_TOKEN belum di-set di .env.local");
    process.exit(1);
  }

  const key = `_verify/${Date.now()}.txt`;
  console.log(`→ Uploading ${key}…`);
  const blob = await put(key, "verification", {
    access: "public",
    contentType: "text/plain",
  });
  console.log(`✓ Upload OK: ${blob.url}`);

  console.log("→ Deleting test file…");
  await del(blob.url);
  console.log("✓ Delete OK");

  console.log("\n🎉 Vercel Blob siap pakai.\n");
}

main().catch((err) => {
  console.error("❌", err.message ?? err);
  process.exit(1);
});
