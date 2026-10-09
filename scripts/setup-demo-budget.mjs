// Bir dəfə: node --env-file=.env.local scripts/setup-demo-budget.mjs
import fs from 'node:fs';
import pg from 'pg';
if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL yoxdur');
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query('begin');
  await client.query(fs.readFileSync(new URL('./demo-budget.sql', import.meta.url), 'utf8'));
  await client.query("notify pgrst, 'reload schema'");
  await client.query('commit');
  console.log('Demo budget schema ready');
} catch {
  await client.query('rollback').catch(() => {});
  console.error('Demo budget schema setup failed');
  process.exitCode = 1;
} finally { await client.end(); }
