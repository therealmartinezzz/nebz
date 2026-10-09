# 08 · Checkpoint və büdcə planı

**Son yenilənmə:** 9 oktyabr 2026, 17:15 (Bakı). Yeni sessiyaya keçəndə əvvəlcə bu faylı, sonra `AGENTS.md` / `CLAUDE.md`-ni oxu.

## Cari vəziyyət — 18:55 səsli sınaq düzəlişləri

Real səsli sınaqda (operator "Ayse") tapılan problemlər düzəldildi (lokal commit, push gözləyir):
- **Söhbət itirdi:** limit dolanda zəng saxlanmırdı. İndi `POST /api/calls` əvvəlcə transkripti bazaya yazır (`calls.status`, miqrasiya 0004 tətbiq olunub), sonra qiymətləndirir; xətada zəng `failed` qalır, hesabatda "İndi qiymətləndir" (`POST /api/calls/{id}/score`). Limit/bağlantı kəsiləndə zəng avtomatik saxlanılır.
- **Operator nitqi türk/yapon/ispan kimi yazılırdı:** transkripsiyaya `languageCodes: ["az"]` + bank lüğəti.
- **Müştəri cavabı hissə-hissə təkrarlanırdı:** səs aşkarlaması daha az həssas (səs-küy sözü kəsməsin) + kəsilmiş təkrar fraqmentlər transkriptdən çıxarılır.
- **"60 saniyə" mesajı 00:40-da:** limit `.env.local`-da `GEMINI_LIVE_MAX_SECONDS=40`; mesaj artıq real limiti yazır.
- `.env.local`-da açar adı səhvləri düzəldildi (`GEMINI_SCORING_MODEL`, `DEMO_AI_BUDGET_USD`, `DEMO_BUDGET_ID`).
- Testlər: 41 unit + 26 inteqrasiya keçir. Real mikrofonla təkrar sınaq lazımdır.

## Cari vəziyyət — Gemini inteqrasiyası

Aşağıdakı 16:03 qeydləri tarixi checkpoint-dir; cari qərar və nəticələr bu bölmədədir.

- PR #3 istifadəçi tərəfindən merge edilib, lokal `main` `0c4cdb8` commit-inə çəkilib. İnteqrasiya dəyişiklikləri `fe/gemini-integration` branch-indədir; istifadəçi sınaqdan sonra GitHub push-u təsdiqləyib.
- İstifadəçi bütün AI funksiyaları üçün Gemini seçib və `.env.local`-a açar əlavə edib; billing üçün $5 kredit yükləyib. Köhnə Anthropic/OpenAI env-ləri çıxarılıb.
- Mətn müştərisi: `gemini-3.5-flash-lite`. Qiymətləndirmə və ssenari qaralaması: `gemini-3.8-flash`. Səs: `gemini-3.8-live`, Kore, maksimum 60 saniyə və 10 operator replikası. Mətn məşqi 5 operator mesajı ilə məhdudlaşdırılır.
- Real açarla sintetik, bazaya yazmayan yoxlamada müştəri cavabı və ssenari qaralaması uğurludur. Live endpoint-dən bir istifadəli token alınıb, model səs və çıxış transkripti qaytarıb. Mikrofonlu tam brauzer məşqini istifadəçi yoxlamalıdır.
- İstifadəçi $5 kredit əlavə edib. Əvvəl 503 qaytaran Flash qiymətləndirməsi son real sintetik yoxlamada uğurludur: 739 giriş + 444 çıxış tokeni, 5522 ms, təxminən $0.002219. Bu, bir qısa nümunədir; keyfiyyət testi və real uzun zəng qiyməti deyil.
- Açıq demo limiti qurulub: Supabase-də RLS-li `demo_ai_budget`, `demo_ai_usage` və yalnız service_role RPC-ləri. $3.50 ortaq təxmini büdcə restart/deploy arasında qalır; mətn real token istifadəsi ilə hesablaşır, səs üçün $0.045 ehtiyat qalır. Brauzer/dəqiqə/gün limitləri və giriş/çıxış hədləri README-dədir. Schema və limit/hesablaşma/icazə yoxlaması uğurludur; yoxlama dataları rollback edilib.
- 37 unit yoxlama, TypeScript yoxlaması və production build keçib. İnsanın qiymətləndirmə keyfiyyəti testi və Vercel deploy hələ görülməlidir. Smoke skriptləri: `scripts/verify-gemini-text.ts`, `scripts/verify-gemini-live.mjs`; istifadə qaydası README-dədir.
- Ödənişli demo üçün AI Studio-da Set up billing → Prepay → minimum $5 kredit. Auto-reload söndürülə, Spend səhifəsində layihənin Monthly spend cap limiti qoyula bilər. Billing təxminən 10 dəqiqə gecikə bildiyi üçün bu, dəqiq xərc zəmanəti deyil. Açar eyni layihədədirsə dəyişməyə ehtiyac yoxdur.
- Lokal ssenari yükləmə xətası düzəlib: Node.js 20 cari Supabase SDK ilə uyğun deyildi; server Node.js 24 ilə başladılır (`package.json` engines və `.nvmrc`). Yanlış Supabase açarı istifadəçinin verdiyi yeni server secret açarı ilə yalnız `.env.local`-da dəyişilib. Real ssenari oxuması 200 qaytarır, səhifədə ssenari görünür. Açar Git-ə daxil edilmir.

Billing mənbəyi: https://ai.google.dev/gemini-api/docs/billing

## Tarixi qeyd — 16:03

---

## 1. Hardayıq (checkpoint)

### ⚠️ Vaxt nəzarət nöqtəsi
`CLAUDE.md` qaydası: **16:00-a qədər 1-ci cərgə işləmirsə, 2-ci cərgəni dayandır.**
16:03 vəziyyəti: 1-ci cərgənin kodu tamdır və testdən keçir, **amma real AI açarı ilə bir dəfə də işə salınmayıb** (açar yoxdur). Növbəti iş — yeni ekran deyil, **açarı qoşub mətn rejimində real zəng etmək**. 16:30–18:00 keyfiyyət testi bloku kəsilmir.

### Git
| Branch | Nə var | Remote |
|---|---|---|
| `main` | ilkin struktur + `be/llm-provider` (PR #1 merge olunub) | ✅ |
| `fe/design-screens` | frontend: 8 ekranın React versiyası (Codex) | ✅ |
| `be/core-api` | bütün backend API + 55 test | yalnız lokal (`integrate/fe-be`-nin içindədir) |
| **`integrate/fe-be`** | **hamısı birlikdə: main + frontend + backend + inteqrasiya düzəlişləri** | push olunur → PR ilə `main`-ə |

**Növbəti addım:** GitHub-da `integrate/fe-be` → `main` PR aç, merge et. Frontend yoldaşı sonra `git pull origin main` edib davam edir.

### Hazır olanlar
- **Backend (hamısı):** `docs/api.md`-dəki bütün sorğu və endpoint-lər — zəng qiymətləndirmə, etiraz, rəhbər qərarı, yoxlama növbəsi, panel, operator profili, məşqlərim, ssenari yaradıcısı (qaralama + saxlama), metrikalar (`/api/metrics`), CSV eksport (`/api/export`).
- **Model qatı:** `src/server/llm.ts` — `LLM_PROVIDER=claude|gemini`, açar yoxdursa 503, model xətası 502.
- **Frontend:** 8 ekran (ilkin versiya, inkişaf davam edir). Backend-ə qoşulub, brauzerdə yoxlanılıb: növbə → rəhbər qərarı → hesabatda "AI → Rəhbər" → məşqlərim.
- **Baza (Supabase, Seul regionu):** miqrasiyalar 0001–0003 tətbiq olunub, demo ssenarisi "Bloklanmış kart" var, **RLS yanılıdır** (anon açarla giriş bağlıdır). Test datası yoxdur (təmizdir).
- **Testlər:** `npm test` (29 unit), `npm run test:integration` (26, real baza + mock model). Hamısı keçir.

### Hazır olmayanlar / açıq məsələlər
| # | Məsələ | Kim | Vaxt |
|---|---|---|---|
| 1 | `code/.env.local` → kök qovluğa `.env.local` köçürülməlidir (auto rejim mənə icazə vermədi) | siz | 1 dəq |
| 2 | **AI açarı yoxdur** — Gemini (pulsuz) və ya Claude ($5). Bax: büdcə planı ↓ | siz | 5 dəq |
| 3 | Real açarla ilk mətn zəngi: müştəri rolu Azərbaycan dilində necədir, qiymətləndirmə nə qədər çəkir | backend | 15 dəq |
| 4 | Model bölgüsü (müştəri = Flash-Lite, qiymətləndirmə = Flash) — **təsdiq gözləyir** | backend | 10 dəq |
| 5 | Səsli rejim: OpenAI açarı yoxdur (büdcədən kənar). Gemini Live alternativi — ≈2 saat | qərar | — |
| 6 | Frontend tövsiyələri: yekun bal (`final_total`), etiraz statusu (`disputed`), panelin sürəti (`getDashboard`), Builder sahələrinin doldurulması — `docs/api.md` sonu | frontend | — |
| 7 | Keyfiyyət testi: 16 zəng, `docs/05-quality-testing.md`, nəticələr `/api/export` və `/api/metrics`-dən | komanda | 16:30–18:00 |
| 8 | Vercel deploy (demo linki) + env dəyişənləri | komanda | 20 dəq |
| 9 | Pitch deck, ≤2 dəq video, açıqlama | komanda | 20:00-a qədər |

### Yeni sessiyada işə başlamaq
```bash
git fetch origin && git checkout integrate/fe-be   # və ya merge-dən sonra main
npm install
npm run typecheck && npm test
npm run test:integration    # .env.local kökdə olmalıdır
npm run dev                 # http://localhost:3000
```
Yeni miqrasiya: `npm run db:migrate`. Yaddaş qaydası: **istifadəçi deməsə push etmə.**

---

## 2. Büdcə planı (limit: ≤10 AZN ≈ $5.9)

### Bizim istifadə həcmimiz
| İş | Sorğu sayı |
|---|---|
| Bir mətn zəngi | ≈10–12 sorğu (hər müştəri cavabı 1 sorğu + qiymətləndirmə 1 sorğu) |
| Keyfiyyət testi | 16 zəng ≈ 180–200 sorğu |
| İnkişaf/demo sınaqları | ≈20–30 zəng ≈ 250–350 sorğu |
| Ssenari yaradıcısı | qaralama başına 1 sorğu |

### Modellər (rəsmi qiymətlər, 9 okt 2026)
| Model | Pulsuz? | Qiymət (1M token, giriş / çıxış) | Qeyd |
|---|---|---|---|
| `gemini-3.8-flash` | ✅ | $0.75 / $3.75 | Pulsuz limit **≈20 sorğu/gün** (təsdiqlənməyib) |
| `gemini-3.5-flash-lite` | ✅ | $0.30 / $2.50 | Pulsuz limit **≈500 sorğu/gün** (təsdiqlənməyib) |
| `gemini-3.8-live` (səs) | ✅ | ≈$0.005/dəq giriş, $0.018/dəq çıxış | Azərbaycan dili rəsmi siyahıda (99 dil), sessiya maks. 15 dəq |
| `claude-haiku-5-5` | kiçik başlanğıc kredit | $0.10 / $0.50 | ən ucuz Claude |
| `claude-sonnet-5-5` | kiçik başlanğıc kredit | $2 / $10 | qiymətləndirmə üçün güclü |
| OpenAI `gpt-realtime` (səs) | ❌ | ≈$0.077/dəq danışıq | büdcədən kənar → **çıxarıldı** |

**Pulsuz limitlər haqqında:** Google per-model cədvəl dərc etmir; limitlər hər layihə üçün AI Studio-da görünür (aistudio.google.com/rate-limit). Yuxarıdakı 20/500 rəqəmləri üçüncü tərəf mənbədəndir (sentyabr 2026) — **açarı yaradanda real rəqəmi yoxla və bu cədvəli yenilə.**
Pulsuz Gemini səviyyəsində göndərilən data Google tərəfindən məhsul təkmilləşdirməsi üçün istifadə oluna bilər — datamız sintetikdir, deck-də bir cümlə ilə qeyd et.
Claude: minimum yükləmə $5 (≈8,5 AZN); Pro abunəsi API açarı vermir.

### Bir zəngin təxmini xərci (ölçülməyib — real rəqəm Usage panelindən götürülməlidir)
Fərziyyə: bir zəngdə ≈18k giriş + ≈2k çıxış token. Model "düşünmə" tokenləri və Azərbaycan dilinin tokenləşməsi bunu artıra bilər.
| Variant | Zəng başına | 50 zəng |
|---|---|---|
| Gemini pulsuz (limit daxilində) | $0 | $0 |
| Gemini 3.5 Flash-Lite (ödənişli) | ≈$0.01 | ≈$0.5 |
| Claude Haiku 5.5 (hər ikisi) | ≈$0.003 | ≈$0.15 |
| Claude Sonnet 5.5 (hər ikisi) | ≈$0.06 | ≈$3 |
| Claude: müştəri Haiku + qiymətləndirmə Sonnet | ≈$0.02–0.03 | ≈$1–1.5 |

### Qərar (tövsiyə)
1. **Plan A — pulsuz hibrid (0 AZN):** müştəri rolu `gemini-3.5-flash-lite`, qiymətləndirmə `gemini-3.8-flash` (zəng başına 1 sorğu → gündə ~20 zəng, 16 test zəngi sığır). Kodda bölgü üçün ≈10 dəq backend dəyişikliyi lazımdır (təsdiq gözləyir).
2. **Plan B — $5 Claude (≈8,5 AZN):** Gemini-nin Azərbaycan dilində keyfiyyəti zəifdirsə və ya limitə dəyiriksə. Müştəri Haiku 5.5 + qiymətləndirmə Sonnet 5.5 → $5 ≈ 150+ zəng, gündəlik limit yoxdur. Keçid: `.env.local`-da `LLM_PROVIDER=claude`.
3. **Səs:** OpenAI yoxdur. Gemini Live pulsuz və Azərbaycan dilini dəstəkləyir, amma zəng ekranı + session endpoint yenidən yazılmalıdır (≈2 saat). Yalnız mətn axını real açarla işlədikdən və keyfiyyət testi planlandıqdan sonra. Yoxsa demo mətn rejimində, deck-də dürüst qeyd.
4. **Keyfiyyət testi hansı modellə edilirsə, deck-də o yazılır.** Test başladıqdan sonra modeli dəyişmə. Hər zəngdə model adı `calls.model`-də saxlanılır.

### `.env.local` nümunəsi (Plan A)
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=<aistudio açarı>
GEMINI_MODEL=gemini-3.8-flash
```

---

## 3. Mənbələr
- Gemini qiymətlər: https://ai.google.dev/gemini-api/docs/pricing
- Gemini modellər: https://ai.google.dev/gemini-api/docs/models
- Gemini limitlər: https://ai.google.dev/gemini-api/docs/rate-limits
- Live API (dillər, 15 dəq): https://ai.google.dev/gemini-api/docs/live-api/capabilities
- Ephemeral tokenlər (brauzer üçün səs): https://ai.google.dev/gemini-api/docs/ephemeral-tokens
- Gemini TTS dilləri: https://ai.google.dev/gemini-api/docs/speech-generation
- Gemini ölkələr: https://ai.google.dev/available_regions
- Pulsuz RPD (üçüncü tərəf, təsdiqlənməyib): https://www.scriptbyai.com/gemini-api-free-tier-limits/
- Pulsuz səviyyə dəyişiklikləri (üçüncü tərəf): https://agentdeals.dev/vendor/google-gemini-api
- Claude modellər: https://platform.claude.com/docs/en/about-claude/models/overview
- Claude qiymətlər: https://platform.claude.com/docs/en/about-claude/pricing
- OpenAI Realtime qiymət (üçüncü tərəf): https://www.forasoft.com/blog/article/openai-realtime-api-pricing
