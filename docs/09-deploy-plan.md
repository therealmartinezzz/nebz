# 09 · Vercel deploy planı

**Tarix:** 9 oktyabr 2026, 19:17 (Bakı). **Son tarix: 20:00** — deploy 19:45-ə qədər bitməlidir, 15 dəq ehtiyat.

## Mövcud vəziyyət (yoxlanılıb)
- Lokal `main` GitHub-dan **5 commit irəlidir** (söhbətlərin saxlanması, səs düzəlişləri, limitlər, keyfiyyət, qiymətlər səhifəsi). Push edilməyib.
- `npm run typecheck`, 41 unit + 26 inteqrasiya testi, `npm run build` keçir.
- `vercel.json` yoxdur. Next.js 15, `src/` qovluğu, Node `24.x` (`package.json` engines + `.nvmrc`).
- Baza: Supabase **Seul** (ap-northeast-2), miqrasiyalar 0001–0004 + demo büdcə cədvəlləri tətbiq olunub. Production eyni bazanı istifadə edir — əlavə miqrasiya lazım deyil.

## Vercel faktları (rəsmi sənəd, 24.08.2026)
- Funksiya müddəti: **default 300 san, bütün planlarda** (fluid compute) → qiymətləndirmə (~24 san) və ssenari qaralaması üçün `maxDuration` lazım deyil.
- Funksiya regionu: **default `iad1` (Vaşinqton)**. Hobby planda bir region seçmək olar → `icn1` (Seul) bazaya yaxındır.
- Mikrofon yalnız HTTPS-də işləyir — Vercel domeni HTTPS-dir.

---

## Mərhələ 0 — Sizdən lazım olanlar (2 dəq)
1. Vercel hesabı var? Layihə artıq yaradılıbmı (GitHub reposuna bağlı)? Kimin hesabındadır?
2. Frontend yoldaşı hazırda `main`-ə push edir? (Konflikt olmasın deyə push-dan əvvəl xəbər verin.)
3. Bazadakı "Claude-Test" test zəngi: silinsin, qalsın?

## Mərhələ 1 — Push-dan əvvəl (lokal, 5 dəq) — mən
1. `vercel.json` əlavə et: `{ "regions": ["icn1"] }` — funksiyalar Seulda, baza sorğuları sürətli.
2. Son yoxlama: typecheck + unit + build; commit-lərdə açar axtarışı.
3. `git fetch` — GitHub-da yeni commit varsa əvvəl birləşdir (frontend yoldaşının işi itməsin).

## Mərhələ 2 — Push (1 dəq) — mən, sizin "push et" ilə
`git push origin main`. Vercel GitHub-a bağlıdırsa avtomatik deploy başlayır.

## Mərhələ 3 — Vercel qurulması (10 dəq) — siz (brauzerdə)
Layihə yoxdursa: vercel.com → **Add New → Project** → `therealmartinezzz/nebz` → Import.
- Framework: **Next.js** (avtomatik). Root Directory: **repo kökü** (boş). Build/Install: default.
- **Environment Variables** (Production + Preview), `.env.local`-dakı dəyərlərlə, **adları hərfbəhərf** (bu gün 3 adda səhv tapdıq):

| Ad | Dəyər / qeyd |
|---|---|
| `SUPABASE_URL` | `.env.local`-dan |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local`-dan (gizli) |
| `LLM_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | `.env.local`-dan (gizli) |
| `GEMINI_CUSTOMER_MODEL` | `gemini-3.8-flash` |
| `GEMINI_SCORING_MODEL` | `gemini-3.8-flash` |
| `GEMINI_DRAFT_MODEL` | `gemini-3.8-flash` |
| `GEMINI_LIVE_MODEL` | `gemini-3.8-live` |
| `GEMINI_LIVE_VOICE` | `Kore` |
| `GEMINI_LIVE_MAX_SECONDS` | `90` |
| `DEMO_AI_BUDGET_USD` | `3.5` |
| `DEMO_BUDGET_ID` | `hackathon-2026` |
| `DEMO_LIMIT_SECRET` | yeni təsadüfi sətir (tövsiyə; boşdursa service_role açarı istifadə olunur) |

- **Əlavə etmə:** `SUPABASE_DB_URL` (yalnız miqrasiya üçündür, serverə lazım deyil), `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`.
- Env əlavə ediləndən sonra **Redeploy** (env-lər yalnız yeni deploy-da oxunur).
- `vercel.json` region-u işləmirsə: Settings → Functions → Function Regions → **Seoul (icn1)**.

## Mərhələ 4 — Canlı yoxlama (10 dəq) — birlikdə
Production URL-də (HTTPS):
1. Səhifələr: `/landing`, `/`, `/dashboard`, `/reports`, `/review`, `/me`, `/pricing` — açılır, ssenari görünür.
2. **Mətn zəngi** (3 mesaj) → bitir → hesabat açılır, ballar sitatla.
3. **Səsli zəng** (mikrofon icazəsi) → Azərbaycan dilində transkript, təkrar yoxdur, limitdə avtomatik saxlanılır.
4. Hesabatdan etiraz → `/review`-da görünür → rəhbər qərarı.
5. Vercel → Deployment → **Logs**: 5xx yoxdur; `gemini-usage` sətirləri görünür.
6. Büdcə: istifadə real artır, limit $3.50.

## Mərhələ 5 — Təhvil (5 dəq)
- Demo linkini README-yə, deck-ə və təhvil formasına yaz.
- `docs/08-checkpoint-and-budget.md`-ni yenilə.
- Repo münsiflər üçün açıq olmalıdır: Public et və ya münsifləri collaborator kimi əlavə et.
- **20:00-dan sonra `main`-ə push yoxdur.**

## Riskler və cavablar
| Risk | Cavab |
|---|---|
| Env adında səhv → 503 "AI modeli qoşulmayıb" | Cədvəldən kopyala; Logs-da xəta adını yoxla |
| Build Vercel-də düşür (lokalda keçir) | Build log-u oxu; Node versiyası 24.x olmalıdır |
| Səs işləmir | Mətn rejimi ehtiyat yoldur; demo videosunu mətn zəngi ilə çək |
| Lokal testlər production büdcəsini yeyir (eyni baza və `DEMO_BUDGET_ID`) | Deploy-dan sonra lokal real AI sınaqlarını dayandır |
| Deploy pozuq çıxır | Vercel → Deployments → əvvəlki deploy → **Instant Rollback** |
| Vaxt çatmır (19:45) | Mərhələ 4-ü 1–3-cü addımla məhdudlaşdır |

## Vaxt cədvəli
| Vaxt | İş |
|---|---|
| 19:20 | Mərhələ 0 cavabları, Mərhələ 1 |
| 19:25 | Push |
| 19:25–19:35 | Vercel qurulması |
| 19:35–19:45 | Canlı yoxlama |
| 19:45–20:00 | Təhvil, ehtiyat |
