// Limit/RLS yoxlaması: tranzaksiya rollback edilir, AI çağırılmır.
import pg from 'pg';
import assert from 'node:assert/strict';
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query('begin');
  const permissions = (await client.query(`select relname, relrowsecurity from pg_class where oid in ('public.demo_ai_budget'::regclass,'public.demo_ai_usage'::regclass)`)).rows;
  assert.equal(permissions.length, 2);
  assert.ok(permissions.every(row => row.relrowsecurity));
  const grants = (await client.query(`select has_function_privilege('anon','public.reserve_demo_ai(text,text,text,numeric,numeric,integer,integer)','execute') as anon, has_function_privilege('authenticated','public.settle_demo_ai(uuid,numeric)','execute') as authenticated`)).rows[0];
  assert.equal(grants.anon, false); assert.equal(grants.authenticated, false);
  await client.query('set local role service_role');
  const bucket = 'verify-' + crypto.randomUUID();
  const reserve = async (cost, person='synthetic', cap=2) => (await client.query('select public.reserve_demo_ai($1,$2,$3,$4,$5,$6,$7) as result', [bucket,person,'scoring',cost,1,cap,cap])).rows[0].result;
  const first = await reserve(0.6); assert.ok(first.id);
  assert.equal((await reserve(0.6)).error, 'budget');
  await client.query('select public.settle_demo_ai($1,$2)', [first.id,0.1]);
  await client.query('select public.settle_demo_ai($1,$2)', [first.id,0]); // idempotent
  assert.ok((await reserve(0.6)).id);
  assert.equal((await reserve(0.1)).error, 'daily');
  assert.ok((await reserve(0.1,'other')).id);
  console.log('Shared budget, settlement, per-client limits and RLS verified; rolled back');
} catch {
  console.error('Demo budget verification failed'); process.exitCode=1;
} finally { await client.query('rollback').catch(()=>{}); await client.end(); }
