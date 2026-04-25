import "dotenv/config";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL tidak di-set");
    process.exit(1);
  }
  console.log("→ Connecting…");
  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    const [version] =
      await sql`SELECT current_database() AS db, current_user AS user, version()`;
    console.log("✓ Connect OK");
    console.log(`  DB:   ${version.db}`);
    console.log(`  User: ${version.user}`);

    const tables =
      await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log(`\n  Tables (public):`);
    for (const t of tables) console.log(`    - ${t.table_name}`);
  } catch (err) {
    console.error("❌ Connection failed:", (err as Error).message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
