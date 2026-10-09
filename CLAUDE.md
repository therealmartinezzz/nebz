@AGENTS.md

# Claude Code: backend rolu

Bu sessiya **backend** tərəfidir: `src/app/api/**`, `src/server/**`, `supabase/**` və `src/lib/types.ts` müqaviləsi. Frontend Codex-də başqa kompüterdə işləyir — onun yollarına (`page.tsx`, `*Client.tsx`, `components/`, `globals.css`) yalnız açıq razılıqla toxun.

## Backend qaydaları
- Yeni endpoint və ya sorğu əlavə edəndə əvvəl `docs/api.md`-ni yenilə (statusu "plan" → "hazır"), sonra kod. Frontend ona baxıb işləyir.
- Model çıxışına tam etibar etmə: JSON-u yoxla, balı 0–2 aralığına sal, cəmi serverdə hesabla, xətada aydın Azərbaycan dilində mesajla 4xx/5xx qaytar (heç vaxt boş və ya HTML cavab).
- Sxem dəyişikliyi = yeni fayl `supabase/migrations/000N_*.sql`. Ortaq demo bazasına tətbiq et və PR-da qeyd et. `seed.sql`-i təkrar işə salma.
- Bazaya qoşulma: birbaşa `db.<ref>.supabase.co` hostu IPv6-dır, Windows-da işləmir — session pooler istifadə et (`.env.local` → `SUPABASE_DB_URL`).
- Claude modeli: `CLAUDE_MODEL` env (default `claude-sonnet-5-5`).
