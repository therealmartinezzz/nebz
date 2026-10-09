# Nəbz

AI müştəri ilə xidmət keyfiyyəti məşqi və izah oluna bilən qiymətləndirmə. Operator AI müştəri ilə real ssenari üzrə danışır (səs və ya mətn), Gemini zəngi şirkət standartından çıxarılmış meyarlar üzrə qiymətləndirir — hər bal transkriptdən vaxt və sitatla — rəhbər son qərarı verir.

NeuroBridge.SI Baku 2026 · AI Enterprise Solutions.

## Qurulma (≈10 dəq)

Node.js 24 istifadə et (`.nvmrc`, `package.json` engines). Node.js 20-də cari Supabase SDK native WebSocket tapa bilmir və baza sorğuları başlamır.

1. `git clone <repo-url> && cd nebz`
2. `npm install`
3. `.env.example` → `.env.local` kopyala, açarları komandadan al (repoda yoxdur).
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — ortaq demo bazası (artıq qurulub)
   - `GEMINI_API_KEY` — müştəri, qiymətləndirmə, ssenari və canlı səs üçün eyni server açarı
   - `LLM_PROVIDER=gemini`; modellərin iş üzrə bölgüsü `.env.example`-dədir
   - `GEMINI_LIVE_MAX_SECONDS=60` — demo səs zəngi 60 saniyə və 10 operator replikası ilə məhdudlaşdırılır
   - `DEMO_AI_BUDGET_USD=3.5`, `DEMO_BUDGET_ID=hackathon-2026` — restart zamanı sıfırlanmayan ortaq demo büdcəsi
4. `npm run dev` → http://localhost:3000

Yeni Supabase bazası lazımdırsa: SQL Editor-də `supabase/migrations/*.sql` (sıra ilə), sonra bir dəfə `supabase/seed.sql`.
Demo limitləri üçün əlavə `scripts/demo-budget.sql` tətbiq edilməlidir: `node --env-file=.env.local scripts/setup-demo-budget.mjs` (mövcud ortaq bazada tətbiq edilib). Bu addım olmadan AI sorğuları 503 ilə bağlanır; limitsiz rejimə keçmir.

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
| Zəng (səs: Gemini Live, mətn: Gemini Flash-Lite) | `src/app/call/[id]/CallClient.tsx`, `src/components/gemini-live.ts` |
| Qısa ömürlü səs açarı | `src/app/api/realtime-session/route.ts` |
| Mətn rejimində AI müştəri | `src/app/api/customer-reply/route.ts` |
| Qiymətləndirmə + bazaya yazma | `src/app/api/calls/route.ts`, `src/server/ai.ts` |
| Hesabat və siyahı | `src/app/report/[id]/page.tsx`, `src/app/reports/page.tsx` |
| Oxuma sorğuları | `src/server/queries.ts` |
| Model provayderi və iş üzrə seçim | `src/server/llm.ts` |

Qiymətləndirmədə modelə tam etibar edilmir: hər meyar yoxlanılır, bal 0–2 aralığına salınır, cəm serverdə hesablanır. Meyar çatışmırsa və ya transkript çox qısadırsa, etibarlılıq "aşağı" olur.

## Gemini bölgüsü və səs

- Müştəri: `GEMINI_CUSTOMER_MODEL=gemini-3.5-flash-lite` (minimal thinking).
- Qiymətləndirmə: `GEMINI_SCORING_MODEL=gemini-3.8-flash` (low thinking).
- Ssenari: `GEMINI_DRAFT_MODEL=gemini-3.8-flash` (low thinking).
- Səs: `GEMINI_LIVE_MODEL=gemini-3.8-live`, `GEMINI_LIVE_VOICE=Kore`.

Əsas açar brauzerə verilmir. Server bir ssenariyə bağlı, bir dəfə istifadə edilən qısaömürlü token yaradır. Mikrofon PCM16/16 kHz göndərir, 24 kHz AI səsi Web Audio ilə səslənir; input/output transkriptləri ayrı saxlanılır. Səs kəsiləndə transkript qalır, qiymətləndirməni yenidən göndərmək mümkündür. `429` kvota, `503` müvəqqəti model yüklənməsi istifadəçiyə ayrıca bildirilir.

Vercel-də `.env.example`-dəki server dəyişənlərini əlavə et; `NEXT_PUBLIC_` prefiksi istifadə etmə. Demo auth olmadan açıqdır. Google AI Studio-da layihə spend cap $5 və auto-reload bağlı saxlanmalıdır.

## Açıq demo üçün xərc nəzarəti

- Mətn məşqi maksimum 5 operator replikası, hər mesaj 1000 simvol; qiymətləndirmə transkripti 16 000 simvola qədərdir. Əvvəlki replikalar itirilmir.
- Qaralama üçün maksimum 6000 simvol; hazır ssenarilərdən istifadə əlavə qaralama xərci yaratmır. Hesabatlara baxmaq və CSV endirmək AI çağırmır.
- Eyni brauzer üçün 24 saatda 120 müştəri cavabı, 4 qiymətləndirmə, 2 qaralama, 2 səs sessiyası. Dəqiqə limitləri müvafiq olaraq 12/2/1/1-dir. Serverin imzaladığı HttpOnly cookie istifadə edilir; ortaq Wi-Fi-da müxtəlif brauzerlər limiti paylaşmır. Bu auth deyil: cookie silinməsi ilə fərdi limiti keçmək olar; ortaq büdcə bütün sorğular üçün qalır.
- Supabase RPC eyni büdcə sətrini tranzaksiyada kilidləyir: paralel serverlər və restart limitdən yan keçmir. Mətn sorğusundan əvvəl ehtiyat ayrılır, uğurda real tokenlərlə hesablaşır; xəta/itmiş metadata zamanı ehtiyat geri qaytarılmır. Model sorğusu avtomatik təkrarlanmır.
- Səs tokeninə $0.045 ehtiyat ayrılır və geri qaytarılmır. Qiymətləndirmə əlavə hesablanır. Bu konfiqurasiya yalnız səs istifadə edilərsə təxminən 60–70 qısa tamamlanmış məşqə imkan verir; qarışıq istifadədə say dəyişir.
- $3.50 həddi cari modellərin qiymətlərinə əsaslanan tətbiq hesabıdır, Google balansı deyil. Birbaşa CLI sorğuları bu büdcəyə daxil deyil. Səsin 60 saniyəlik bağlanması brauzerdə icra olunur; tokenin expiry-si açıq socket-in vaxtında bağlanmasına sərt zəmanət vermir. Billing cap və balansı da izləmək lazımdır.
- Model dəyişəndə qiymət hesabını da yenilə. `DEMO_BUDGET_ID`-ni dəyişmək yeni büdcə açır; deploy-lar eyni ID istifadə etməlidir.

Limitlərin AI xərci olmadan yoxlanması: `node --env-file=.env.local scripts/verify-demo-budget.mjs` (sintetik tranzaksiya rollback edilir).

## Testlər

```
npm test                  # unit: model cavablarının yoxlanması, ssenari validasiyası, provayder seçimi (açar lazım deyil)
npm run test:integration  # real Supabase + mock model: zəng → hesabat → etiraz → rəhbər → növbə → panel → metrika → eksport → ssenari yaradıcısı
```
İnteqrasiya testi `.env.local`-dakı bazaya yazır və yaratdığı datanı (`TEST-*` operatorları, test ssenariləri) sonda silir. Real model çağırılmır.

Real Gemini yoxlamaları ayrıca və ödəniş/kvota sərf edə bilər; bazaya yazmır:
```
node --env-file=.env.local node_modules/vite-node/vite-node.mjs --config vitest.config.ts scripts/verify-gemini-text.ts
node scripts/verify-gemini-live.mjs <scenario-id>  # localhost:3000 işləməlidir; mikrofon açılmır
```

## Komanda üçün
- **Vəziyyət və büdcə planı (checkpoint):** [`docs/08-checkpoint-and-budget.md`](docs/08-checkpoint-and-budget.md)
- Agent/komanda qaydaları: [`AGENTS.md`](AGENTS.md) (Codex və Claude Code bunu oxuyur)
- Git axını: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Frontend ↔ backend müqaviləsi: [`docs/api.md`](docs/api.md)
- Ekranlar və qəbul meyarları: [`docs/03-mvp-scope.md`](docs/03-mvp-scope.md)
- Səkkiz React ekranı, route-lar və frontend inteqrasiyasının statusu: [`docs/frontend.md`](docs/frontend.md)

## Açıqlama (hackathon qaydası)

**Modellər:** Gemini 3.5 Flash-Lite — mətn müştəri; Gemini 3.8 Flash — qiymətləndirmə və ssenari; Gemini 3.8 Live — səs və canlı transkript. Köhnə Claude mətn provayderi uyğunluq üçün kodda qalır; Gemini demo konfiqurasiyasında istifadə edilmir. Real keyfiyyət testi hansı modellə aparılırsa, təhvildə həmin model göstərilir.
**Kitabxanalar:** Next.js, React, TypeScript, @supabase/supabase-js, @anthropic-ai/sdk, @google/genai, server-only. Yalnız inkişaf üçün: Vitest (testlər), pg (miqrasiya skripti).
**Xidmətlər:** Supabase (Postgres), Vercel (hostinq).
**Şrift:** IBM Plex Sans / Mono (Google Fonts).
**Data:** sintetik ssenari; real şəxsi məlumat yoxdur.
**Alətlər:** kod Claude Code və Codex köməyi ilə yazılıb.
