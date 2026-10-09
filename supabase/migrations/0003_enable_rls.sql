-- 0003 · RLS yandırılır, policy yoxdur → anon/publishable açarla heç bir cədvələ giriş yoxdur.
-- Tətbiq yalnız serverdə service_role açarı ilə işləyir (RLS-i keçir), ona görə heç nə pozulmur.
alter table scenarios enable row level security;
alter table calls enable row level security;
alter table scores enable row level security;
alter table reviews enable row level security;
alter table _migrations enable row level security;
