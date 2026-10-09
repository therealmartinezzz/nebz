# API müqaviləsi (frontend ↔ backend)

Bütün tiplər: **`src/lib/types.ts`** (mənbə həqiqəti — burada yalnız xülasə).
Bütün xəta cavabları: `{ "error": "Azərbaycan dilində mesaj" }` + 4xx/5xx. Frontend `error`-u istifadəçiyə olduğu kimi göstərə bilər.
Model çağıran endpoint-lər (`/api/calls`, `/api/customer-reply`, `/api/scenarios/draft`): **503** = AI açarı qoşulmayıb (konfiqurasiya), **502** = model xətası və ya pozuk cavab (yenidən cəhd et düyməsi göstər).
Status: **hazır** — kodda var, typecheck/build keçir; real açarla sınaq sonda edilir.

## Server sorğuları — `src/server/queries.ts`
Yalnız server komponentlərində (`page.tsx`, `"use client"` olmadan) çağırılır. Client komponentə nəticəni props kimi ötür.

| Funksiya | Qaytarır | Ekran |
|---|---|---|
| `listScenarios()` | `ScenarioCard[]` | 1 |
| `getScenario(id)` | `ScenarioCard \| null` — `meta.customer_name` zəng ekranında ad üçün | 2 |
| `getCallReport(id)` | `CallReport \| null` | 3 |
| `listCalls(limit?)` | `CallListItem[]` | hesabatlar |
| `getReviewQueue()` | `ReviewItem[]` | 7 |
| `getDashboard()` | `DashboardStats` | 4 |
| `listOperators()` | `{ name, call_count }[]` | 6 (siyahı) |
| `getOperatorProfile(name)` | `OperatorProfile \| null` | 6 |
| `getMyTraining(name)` | `TrainingView` | 8 |
| `getAgreementMetrics()` | `AgreementMetrics` | keyfiyyət testi |

### Əsas qaydalar
- **Bal:** hər meyar `ScoreWithReviews`: `score` = AI balı, `manager_score` = son rəhbər balı (yoxdursa `null`), `final_score` = `manager_score ?? score`, `disputed` = cavablanmamış etiraz var.
- Hesabatda göstər: `manager_score !== null && manager_score !== score` → **"AI: 0 → Rəhbər: 2"**. `disputed` → "Etiraz baxılır".
- `CallReport.final_total` — rəhbər düzəlişləri ilə cəm; `call.total` — AI cəmi.
- **Etibarlılıq:** `call.confidence` (`high`/`low`) + `call.confidence_reason` (səbəb mətni, məs. "01:12-də transkript aydın deyil").
- **Panel/profil ortalamaları** `final_score`-dan hesablanır. Data yoxdursa `avg_*: null`, siyahılar boş — UI boş vəziyyət göstərir, nümunə rəqəm yox.
- `by_criterion` artan sıradadır: **birinci element = ən zəif meyar**.

### Ekran 7 növbəsi — `ReviewItem`
- `reason: "dispute"` — işçinin etirazı. `scores` = yalnız etiraz olunan 1 meyar, `dispute.comment` = etiraz mətni, `transcript_excerpt` = sübut vaxtı ətrafında 2–4 replika.
- `reason: "low_confidence"` — AI əmin deyil. `scores` = bütün meyarlar, `transcript_excerpt` = tam transkript. Bütün meyarlara rəhbər balı verilənə qədər növbədə qalır.
- `reason_text` — siyahıda göstərilən qısa səbəb. `key` — React `key`.
- Rəhbər qərarı: hər meyar üçün `POST /api/reviews` (`kind: "manager"`). "AI balını saxla" = `newScore` olaraq AI balını göndər. Sonra `router.refresh()`.

## HTTP endpoint-lər — `src/app/api/*`
Client komponentlərindən `fetch` ilə. Hamısı `Content-Type: application/json`.

### `POST /api/customer-reply` — hazır
`{ scenarioId, transcript: Line[] }` → `{ text }`

### `POST /api/realtime-session` — hazır
`{ scenarioId }` → `{ key }`. `OPENAI_API_KEY` yoxdursa **503** + mesaj → UI mətn rejiminə keçidi təklif edir.

### `POST /api/calls` — hazır
`{ scenarioId, operatorName, mode: "voice"|"text", transcript: Line[], durationSec }` → `{ id }` → `/report/{id}`.
Model xətası → **502** + mesaj (ekran "qiymətləndirir…"-də qalmamalıdır, xətanı göstər və yenidən cəhd düyməsi ver).

### `POST /api/reviews` — hazır (ekran 7 və 3)
```ts
{ scoreId: string; kind: "manager" | "dispute"; newScore?: 0|1|2; comment?: string } → { id }
```
`manager` → `newScore` məcburi. `dispute` → `comment` məcburi.

### `POST /api/scenarios/draft` — hazır (ekran 5)
```ts
// sorğu: ScenarioDraftInput
{ standard: string; department: string; language: "az"; customerType: string; difficulty: "low"|"medium"|"high" }
// cavab: ScenarioDraft
{ title, summary, persona_prompt, rubric: [{ id, name, levels: {"0","1","2"}, source: "§3" }], meta: { customer_name, hidden_fact, trap, correct_path, ... } }
```
10–30 saniyə çəkə bilər — yüklənmə vəziyyəti göstər. Bazaya yazmır.

### `POST /api/scenarios` — hazır (ekran 5)
`ScenarioDraft & { department }` (redaktə olunmuş) → `{ id }`. Server yoxlayır: ad boş deyil, 3–8 meyar, hər səviyyə dolu; məcburi persona qaydaları yoxdursa əlavə edir. Xəta → 400 + hansı sahə.

### `GET /api/metrics` — hazır
`AgreementMetrics`: rəhbər balı olan meyarlarda AI = rəhbər faizi, ±1 faizi, cəmdə orta fərq, orta qiymətləndirmə vaxtı (ms).

### `GET /api/export` — hazır
CSV fayl: hər zəng × meyar bir sətir (AI balı, rəhbər balı, etibarlılıq, model, vaxt). Keyfiyyət testi cədvəli üçün.

## Frontend inteqrasiya qeydləri (09.10, `fe/design-screens` birləşdirildikdən sonra)
Backend frontendin `src/components/contracts.ts` formalarına uyğunlaşdırılıb: `ReviewItem.score` / `ReviewItem.transcript` əlavə olundu, `TrainingView.last` = `CallRow`, `CallListItem.final_total` optional. `getReviewQueue` və `getMyTraining` artıq mövcuddur — fallback yolları işə düşmür.
Brauzerdə yoxlanıldı: növbə (etiraz + aşağı etibarlılıq), rəhbər qərarı → növbədən çıxır, hesabatda "AI → Rəhbər", Məşqlərim.

Frontend üçün tövsiyələr (məcburi deyil, backend hazırdır):
1. **Yekun bal:** hesabat və cədvəllər `call.total` (AI) göstərir. Rəhbər düzəlişindən sonra `report.final_total` / `CallListItem.final_total` göstərmək lazımdır ("son qərar insandadır").
2. **Etiraz statusu:** hesabatda "Etiraz göndərilib" rəhbər qərarından sonra da qalır — `score.disputed` istifadə et (cavablanmamış etiraz).
3. **Sürət:** panel və operator profili hər zəng üçün ayrıca `getCallReport` çağırır (Supabase Seul regionundadır, ~0,4 s/sorğu). `getDashboard()` / `getOperatorProfile(name)` hər birini 2 sorğuda qaytarır və final ballarla hesablayır.
4. **Builder:** `POST /api/scenarios/draft` cavabında `meta.hidden_fact`, `meta.trap`, `meta.correct_path` gəlir — "Gizli fakt / Tələ / Düzgün həll" sahələrini bunlarla doldurmaq olar.
5. **Zəng ekranı:** müştəri adı üçün `getScenario(id).meta.customer_name` ("Leyla M.").
