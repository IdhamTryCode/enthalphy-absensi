import "dotenv/config";
import { google } from "googleapis";
import { formatInTimeZone } from "date-fns-tz";

const TAB = "Attendance";
const TZ = "Asia/Jakarta";

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

async function main() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!b64) fail("GOOGLE_SERVICE_ACCOUNT_B64 tidak di-set");
  if (!sheetId) fail("GOOGLE_SHEET_ID tidak di-set");

  const argEmail = process.argv[2];
  const argDate = process.argv[3];

  const email = argEmail?.trim().toLowerCase();
  const date =
    argDate?.trim() || formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");

  const key = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Ambil semua data + sheetId numeric
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const tab = meta.data.sheets?.find(
    (s) => s.properties?.title?.trim() === TAB,
  );
  if (!tab?.properties?.sheetId && tab?.properties?.sheetId !== 0) {
    fail(`Tab "${TAB}" tidak ditemukan`);
  }
  const sheetNumericId = tab.properties!.sheetId!;
  const tabName = tab.properties!.title!;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${tabName}'!A2:K`,
  });
  const rows = (res.data.values ?? []) as string[][];

  // Cari row numbers yang match (row fisik di sheet = index + 2 karena skip header)
  const matches: number[] = [];
  rows.forEach((r, idx) => {
    const rowEmail = (r[2] ?? "").toLowerCase();
    const rowDate = r[3] ?? "";
    if (rowDate !== date) return;
    if (email && rowEmail !== email) return;
    matches.push(idx + 2); // 1-based, +1 lagi karena header
  });

  if (matches.length === 0) {
    console.log(
      `\nTidak ada record ${email ? `untuk ${email} ` : ""}pada ${date}.\n`,
    );
    return;
  }

  console.log(
    `\n→ Akan hapus ${matches.length} baris pada ${date}${email ? ` untuk ${email}` : " (semua user)"}:`,
  );
  matches.forEach((rowNum) => {
    const r = rows[rowNum - 2];
    console.log(`   row ${rowNum}: ${r[1]} | ${r[2]} | ${r[4]} | ${r[5]}`);
  });

  // Hapus dari bawah ke atas biar index tidak bergeser
  const sorted = [...matches].sort((a, b) => b - a);
  const requests = sorted.map((rowNum) => ({
    deleteDimension: {
      range: {
        sheetId: sheetNumericId,
        dimension: "ROWS" as const,
        startIndex: rowNum - 1, // 0-based
        endIndex: rowNum,
      },
    },
  }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { requests },
  });

  console.log(`\n✓ ${matches.length} baris dihapus.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
