-- Ortaq demo büdcəsi: yalnız server service_role istifadə edir.
create table if not exists public.demo_ai_budget (
  bucket text primary key,
  reserved_usd numeric not null default 0 check (reserved_usd >= 0)
);
create table if not exists public.demo_ai_usage (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  client_hash text not null,
  task text not null,
  reserved_usd numeric not null,
  settled boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists demo_ai_usage_client_time on public.demo_ai_usage (bucket, client_hash, task, created_at);
alter table public.demo_ai_budget enable row level security;
alter table public.demo_ai_usage enable row level security;
revoke all on public.demo_ai_budget, public.demo_ai_usage from anon, authenticated;
grant select, insert, update on public.demo_ai_budget, public.demo_ai_usage to service_role;

create or replace function public.reserve_demo_ai(
  p_bucket text, p_client text, p_task text, p_cost numeric,
  p_budget numeric, p_daily integer, p_minute integer
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare used numeric; ticket uuid;
begin
  if p_cost <= 0 or p_budget <= 0 or p_daily < 1 or p_minute < 1 then
    raise exception 'Invalid budget configuration';
  end if;
  insert into public.demo_ai_budget(bucket) values(p_bucket) on conflict do nothing;
  select reserved_usd into used from public.demo_ai_budget where bucket=p_bucket for update;
  if used + p_cost > p_budget then return jsonb_build_object('error','budget'); end if;
  if (select count(*) from public.demo_ai_usage where bucket=p_bucket and client_hash=p_client and task=p_task and created_at > now()-interval '24 hours') >= p_daily then
    return jsonb_build_object('error','daily');
  end if;
  if (select count(*) from public.demo_ai_usage where bucket=p_bucket and client_hash=p_client and task=p_task and created_at > now()-interval '1 minute') >= p_minute then
    return jsonb_build_object('error','minute');
  end if;
  insert into public.demo_ai_usage(bucket,client_hash,task,reserved_usd) values(p_bucket,p_client,p_task,p_cost) returning id into ticket;
  update public.demo_ai_budget set reserved_usd=used+p_cost where bucket=p_bucket;
  return jsonb_build_object('id',ticket);
end $$;

create or replace function public.settle_demo_ai(p_id uuid, p_actual numeric)
returns void language plpgsql security invoker set search_path = '' as $$
declare entry public.demo_ai_usage%rowtype; entry_bucket text;
begin
  select bucket into entry_bucket from public.demo_ai_usage where id=p_id;
  if entry_bucket is null then return; end if;
  perform 1 from public.demo_ai_budget where bucket=entry_bucket for update;
  select * into entry from public.demo_ai_usage where id=p_id for update;
  if entry.settled or p_actual < 0 then return; end if;
  update public.demo_ai_budget set reserved_usd=greatest(0,reserved_usd-entry.reserved_usd+p_actual) where bucket=entry.bucket;
  update public.demo_ai_usage set settled=true, reserved_usd=p_actual where id=p_id;
end $$;
revoke execute on function public.reserve_demo_ai(text,text,text,numeric,numeric,integer,integer) from public, anon, authenticated;
revoke execute on function public.settle_demo_ai(uuid,numeric) from public, anon, authenticated;
grant execute on function public.reserve_demo_ai(text,text,text,numeric,numeric,integer,integer) to service_role;
grant execute on function public.settle_demo_ai(uuid,numeric) to service_role;
