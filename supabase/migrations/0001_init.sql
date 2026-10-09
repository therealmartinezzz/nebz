-- 0001 · Əsas cədvəllər. Supabase → SQL Editor-də ardıcıllıqla işə salın (0001, 0002, ...).

create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null,
  summary text,
  persona_prompt text not null,
  rubric jsonb not null,           -- [{id, name, levels: {"0","1","2"}}]
  created_at timestamptz default now()
);

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios(id),
  operator_name text not null,
  mode text not null default 'practice',      -- practice | voice | text
  transcript jsonb not null,                   -- [{role, text, t}]
  duration_sec int,
  total int,
  max_total int,
  strengths jsonb,
  improvements jsonb,
  training_recommendation text,
  confidence text,                             -- high | low
  created_at timestamptz default now()
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references calls(id) on delete cascade,
  criterion int not null,
  criterion_name text not null,
  score int not null check (score between 0 and 2),
  evidence text,
  reason text
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  score_id uuid references scores(id) on delete cascade,
  kind text not null default 'manager',        -- manager | dispute
  new_score int check (new_score between 0 and 2),
  comment text,
  created_at timestamptz default now()
);
