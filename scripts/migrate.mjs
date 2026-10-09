// supabase/migrations/*.sql fayllarını sıra ilə tətbiq edir, tətbiq olunanları _migrations cədvəlində saxlayır.
// İstifadə: node --env-file=.env.local scripts/migrate.mjs   (SUPABASE_DB_URL — session pooler sətri)
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL təyin edilməyib");
  process.exit(1);
}
const dir = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "supabase", "migrations");
const files = fs.readdirSync(dir).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort();

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query("create table if not exists _migrations (name text primary key, applied_at timestamptz default now())");
  const applied = new Set((await client.query("select name from _migrations")).rows.map((r) => r.name));

  // 0001 bu skriptdən əvvəl əllə tətbiq olunubsa — qeyd et, təkrar işə salma.
  if (!applied.size && (await client.query("select to_regclass('public.scenarios') as t")).rows[0].t) {
    await client.query("insert into _migrations (name) values ($1)", [files[0]]);
    applied.add(files[0]);
    console.log(`= ${files[0]} (əvvəlcədən tətbiq olunub, qeyd edildi)`);
  }

  for (const f of files) {
    if (applied.has(f)) continue;
    await client.query("begin");
    try {
      await client.query(fs.readFileSync(path.join(dir, f), "utf8"));
      await client.query("insert into _migrations (name) values ($1)", [f]);
      await client.query("commit");
      console.log(`+ ${f}`);
    } catch (e) {
      await client.query("rollback");
      throw new Error(`${f}: ${e.message}`);
    }
  }
  await client.query("notify pgrst, 'reload schema'"); // Supabase REST yeni sütunları görsün
  console.log("Miqrasiyalar aktualdır.");
} finally {
  await client.end();
}
