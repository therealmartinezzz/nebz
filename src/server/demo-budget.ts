import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

type Task = 'customer' | 'scoring' | 'draft' | 'voice';
const requestClient = new AsyncLocalStorage<string>();
export class DemoBudgetError extends Error {
  constructor(message: string, public status = 429) { super(message); }
}
export async function withDemoRequest<T>(_req: Request, fn: () => Promise<T>) {
  const secret = process.env.DEMO_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new DemoBudgetError('Demo limiti konfiqurasiya edilməyib.', 503);
  const jar = await cookies();
  const sign = (id: string) => createHmac('sha256', secret).update(id).digest('hex');
  const [candidate, signature] = (jar.get('nebz-demo')?.value || '').split('.');
  let id = candidate;
  if (!/^[a-f0-9-]{36}$/.test(candidate || '') || !/^[a-f0-9]{64}$/.test(signature || '') || !timingSafeEqual(Buffer.from(signature), Buffer.from(sign(candidate)))) {
    id = randomUUID();
    jar.set('nebz-demo', `${id}.${sign(id)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/' });
  }
  return requestClient.run(sign(id), fn);
}
export async function reserveDemo(task: Task, cost: number) {
  const client = requestClient.getStore();
  // Birbaşa server/CLI smoke yoxlaması açıq HTTP istifadəçisi deyil.
  if (!client) return null;
  const caps = { customer: [120, 12], scoring: [4, 2], draft: [2, 1], voice: [2, 1] };
  const budget = Number(process.env.DEMO_AI_BUDGET_USD || 3.5);
  if (!Number.isFinite(budget) || budget <= 0) throw new DemoBudgetError('Demo büdcəsi konfiqurasiya edilməyib.', 503);
  const { data, error } = await db().rpc('reserve_demo_ai', {
    p_bucket: process.env.DEMO_BUDGET_ID || 'hackathon-2026', p_client: client, p_task: task,
    p_cost: cost, p_budget: budget, p_daily: caps[task][0], p_minute: caps[task][1],
  });
  if (error || !data) throw new DemoBudgetError('Demo limiti yoxlanılmadı. Bir qədər sonra yenidən cəhd edin.', 503);
  if (data.error === 'budget') throw new DemoBudgetError('Demonun AI büdcəsi bitib. Mövcud hesabatları görə və endirə bilərsiniz.');
  if (data.error) throw new DemoBudgetError('Bu bağlantı üçün demo limiti dolub. Bir qədər sonra yenidən cəhd edin.');
  return String(data.id);
}
export async function settleDemo(id: string | null, cost: number) {
  if (!id) return;
  const { error } = await db().rpc('settle_demo_ai', { p_id: id, p_actual: cost });
  // Hesablaşma xətasında əvvəlki ehtiyat qalır; limit boşaldılmır.
  if (error) console.error('demo-budget-settlement', { failed: true });
}
