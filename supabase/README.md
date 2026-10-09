# Baza (Supabase / Postgres)

- `migrations/` — sxem dəyişiklikləri, nömrə sırası ilə (`0001_init.sql`, `0002_...`). Mövcud faylı dəyişmə, yenisini əlavə et.
- `seed.sql` — demo ssenarisi. Yeni bazada bir dəfə.

Ortaq demo bazası: 0001 + seed tətbiq olunub. **0002 hələ tətbiq olunmayıb** (açarlar qoşulanda backend edəcək — yeni kod 0002-siz işləməz). Yeni miqrasiyanı **backend** tətbiq edir və PR-da qeyd edir.
