# Nəbz

AI müştəri ilə xidmət keyfiyyəti məşqi və izah oluna bilən qiymətləndirmə. Operator AI müştəri ilə real ssenari üzrə danışır (səs və ya mətn), Claude zəngi şirkət standartından çıxarılmış meyarlar üzrə qiymətləndirir — hər bal transkriptdən vaxt və sitatla — rəhbər son qərarı verir.

NeuroBridge.SI Baku 2026 · AI Enterprise Solutions.

## Qurulma (≈10 dəq)

1. `git clone <repo-url> && cd nebz`
2. `npm install`
3. `.env.example` → `.env.local` kopyala, açarları komandadan al (repoda yoxdur).
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — ortaq demo bazası (artıq qurulub)
   - `ANTHROPIC_API_KEY` **və ya** `GEMINI_API_KEY` — qiymətləndirmə və mətn rejimi (`LLM_PROVIDER`)
   - `OPENAI_API_KEY` — yalnız səsli rejim
4. `npm run dev` → http://localhost:3000

Yeni Supabase bazası lazımdırsa: SQL Editor-də `supabase/migrations/*.sql` (sıra ilə), sonra bir dəfə `supabase/seed.sql`.

**Demo linki:** GitHub reposunu Vercel-ə import et (root = repo kökü), eyni env dəyişənlərini Vercel-ə əlavə et. Mikrofon yalnız `https` və ya `localhost`-da işləyir.

## Struktur

```
src/app/          səhifələr + api/ route-ları (Next.js App Router)
src/components/   UI komponentləri
src/server/       yalnız server: Supabase, Claude, data sorğuları
src/lib/          ortaq tiplər və formatlama
supabase/         miqrasiyalar + seed
docs/             brif, hackathon qaydaları, ekran spesifikasiyaları, API müqaviləsi, dizayn
```

| Hissə | Fayl |
|---|---|
| Ssenari seçimi | `src/app/page.tsx` |
| Zəng (səs: OpenAI Realtime WebRTC, mətn: Claude) | `src/app/call/[id]/CallClient.tsx` |
| Qısa ömürlü səs açarı | `src/app/api/realtime-session/route.ts` |
| Mətn rejimində AI müştəri | `src/app/api/customer-reply/route.ts` |
| Qiymətləndirmə + bazaya yazma | `src/app/api/calls/route.ts`, `src/server/ai.ts` |
| Hesabat və siyahı | `src/app/report/[id]/page.tsx`, `src/app/reports/page.tsx` |
| Oxuma sorğuları | `src/server/queries.ts` |
| Model provayderi (Claude / Gemini) | `src/server/llm.ts` |

Qiymətləndirmədə modelə tam etibar edilmir: hər meyar yoxlanılır, bal 0–2 aralığına salınır, cəm serverdə hesablanır. Meyar çatışmırsa və ya transkript çox qısadırsa, etibarlılıq "aşağı" olur.

## Testlər

```
npm test                  # unit: model cavablarının yoxlanması, ssenari validasiyası, provayder seçimi (açar lazım deyil)
npm run test:integration  # real Supabase + mock model: zəng → hesabat → etiraz → rəhbər → növbə → panel → metrika → eksport → ssenari yaradıcısı
```
İnteqrasiya testi `.env.local`-dakı bazaya yazır və yaratdığı datanı (`TEST-*` operatorları, test ssenariləri) sonda silir. Real model çağırılmır.

## Komanda üçün
- **Vəziyyət və büdcə planı (checkpoint):** [`docs/08-checkpoint-and-budget.md`](docs/08-checkpoint-and-budget.md)
- Agent/komanda qaydaları: [`AGENTS.md`](AGENTS.md) (Codex və Claude Code bunu oxuyur)
- Git axını: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Frontend ↔ backend müqaviləsi: [`docs/api.md`](docs/api.md)
- Ekranlar və qəbul meyarları: [`docs/03-mvp-scope.md`](docs/03-mvp-scope.md)
- Səkkiz React ekranı, route-lar və frontend inteqrasiyasının statusu: [`docs/frontend.md`](docs/frontend.md)

## Açıqlama (hackathon qaydası)

**Modellər:** Claude Sonnet 5.5 (Anthropic) və ya Gemini 3.8 Flash (Google) — qiymətləndirmə və mətn rejimində müştəri (`LLM_PROVIDER` ilə seçilir; demoda hansının işlədiyi təhvildə qeyd olunur); OpenAI gpt-realtime + gpt-4o-transcribe — səsli rejim.
**Kitabxanalar:** Next.js, React, TypeScript, @supabase/supabase-js, @anthropic-ai/sdk, @google/genai, server-only. Yalnız inkişaf üçün: Vitest (testlər), pg (miqrasiya skripti).
**Xidmətlər:** Supabase (Postgres), Vercel (hostinq).
**Şrift:** IBM Plex Sans / Mono (Google Fonts).
**Data:** sintetik ssenari; real şəxsi məlumat yoxdur.
**Alətlər:** kod Claude Code və Codex köməyi ilə yazılıb.
