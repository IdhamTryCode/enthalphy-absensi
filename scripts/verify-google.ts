import "dotenv/config";
import { google } from "googleapis";

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

async function main() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!b64) fail("GOOGLE_SERVICE_ACCOUNT_B64 belum di-set di .env.local");
  if (!sheetId) fail("GOOGLE_SHEET_ID belum di-set di .env.local");

  const key = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  console.log(`→ Service account: ${key.client_email}`);

  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  console.log("→ Authorizing…");
  await auth.authorize();
  console.log("✓ Auth OK");

  const sheets = google.sheets({ version: "v4", auth });

  console.log(`\n→ Reading Sheet ${sheetId}…`);
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    console.log(`✓ Sheet title: "${meta.data.properties?.title}"`);
    const tabNames = (meta.data.sheets ?? [])
      .map((s) => s.properties?.title ?? "")
      .filter(Boolean);
    console.log(`  Tabs: ${tabNames.join(", ")}`);

    const attendanceTab = tabNames.find(
      (n) => n.trim().toLowerCase() === "attendance",
    );
    if (!attendanceTab) {
      fail(`Tab "Attendance" tidak ditemukan. Tab yang ada: ${tabNames.join(", ")}`);
    }
    if (attendanceTab !== "Attendance") {
      console.warn(
        `  ⚠ Nama tab "${attendanceTab}" mengandung whitespace — rename ke "Attendance" saja biar clean`,
      );
    }

    const header = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${attendanceTab}'!A1:K1`,
    });
    const row = header.data.values?.[0] ?? [];
    if (row.length === 0) {
      console.warn("  ⚠ Header kosong di tab Attendance row 1");
    } else {
      console.log(`  Header: ${row.join(" | ")}`);
    }

    console.log("\n→ Test write: append & delete 1 row…");
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `'${attendanceTab}'!A:A`,
      valueInputOption: "RAW",
      requestBody: { values: [["__verify__"]] },
    });
    const updatedRange = appendRes.data.updates?.updatedRange ?? "";
    console.log(`✓ Append OK: ${updatedRange}`);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: updatedRange,
    });
    console.log("✓ Cleanup OK (row dihapus)");
  } catch (err) {
    const e = err as Error;
    fail(
      `Gagal akses Sheet. ${e.message}\n` +
        `   Pastikan: (1) SHEET_ID benar, (2) Sheet di-share ke ${key.client_email} sebagai Editor, ` +
        `(3) tab bernama "Attendance".`,
    );
  }

  console.log("\n🎉 Sheet OK. Foto akan di-upload ke Vercel Blob (butuh BLOB_READ_WRITE_TOKEN saat runtime).\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
