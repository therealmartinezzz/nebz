-- 0004 · Hər zəng (qiymətləndirmə alınmasa da) bazaya yazılır.
-- status: pending = transkript saxlanılıb, qiymətləndirilir; scored = ballar var; failed = qiymətləndirmə alınmayıb (yenidən cəhd oluna bilər).
alter table calls add column if not exists status text not null default 'scored';
alter table calls add column if not exists scoring_error text;
do $$ begin
  alter table calls add constraint calls_status_check check (status in ('pending', 'scored', 'failed'));
exception when duplicate_object then null; end $$;
create index if not exists calls_status_idx on calls (status);
