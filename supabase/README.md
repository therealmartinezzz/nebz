# Baza (Supabase / Postgres)

- `migrations/` — sxem dəyişiklikləri, nömrə sırası ilə (`0001_init.sql`, `0002_...`). Mövcud faylı dəyişmə, yenisini əlavə et.
- `seed.sql` — demo ssenarisi. Yeni bazada bir dəfə.

Ortaq demo bazası: 0001–0003 + seed tətbiq olunub (09.10.2026).

**Yeni miqrasiya:** `npm run db:migrate` (`.env.local` → `SUPABASE_DB_URL`, session pooler). Tətbiq olunanlar `_migrations` cədvəlində saxlanılır, təkrar işə salmaq təhlükəsizdir.

**Təhlükəsizlik:** bütün cədvəllərdə RLS yanılıdır, policy yoxdur (0003) — anon/publishable açarla giriş yoxdur. Tətbiq yalnız serverdə `service_role` ilə işləyir.
