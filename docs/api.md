# API müqaviləsi (frontend ↔ backend)

Frontend bu forma ilə işləyir. Backend hazır olmayan yerdə frontend eyni formada mock istifadə edir.
Status: **hazır** — kodda var; **plan** — forma razılaşdırılıb, backend yazır.
Tiplər: `src/lib/types.ts`. Bütün xəta cavabları: `{ "error": "Azərbaycan dilində mesaj" }` + 4xx/5xx.

## Server sorğuları — `src/server/queries.ts`
Yalnız server komponentlərində (`page.tsx`, `"use client"` olmadan) çağırılır.

| Funksiya | Qaytarır | Ekran | Status |
|---|---|---|---|
| `listScenarios()` | `ScenarioCard[]` | 1 | hazır |
| `getCallReport(id)` | `{ call: CallRow, scores: ScoreRow[] } \| null` | 3 | hazır |
| `listCalls(limit?)` | `CallListItem[]` | 4 (müvəqqəti `/reports`) | hazır |
| `getReviewQueue()` | `ReviewItem[]` | 7 | plan |
| `getCallReport(id)` → `scores[].reviews` | hər bala bağlı `Review[]` | 3 | plan |
| `getDashboard()` | `DashboardStats` | 4 | plan |
| `getOperatorProfile(name)` | `OperatorProfile \| null` | 6 | plan |
| `getMyTraining(name)` | `TrainingView` | 8 | plan |

## HTTP endpoint-lər — `src/app/api/*`
Client komponentlərindən `fetch` ilə.

### `POST /api/customer-reply` — hazır
Mətn rejimində AI müştərinin növbəti cavabı.
`{ scenarioId: string, transcript: Line[] }` → `{ text: string }`

### `POST /api/realtime-session` — hazır
Səsli rejim üçün qısa ömürlü OpenAI açarı.
`{ scenarioId: string }` → `{ key: string }`

### `POST /api/calls` — hazır
Zəngi bitirir, Claude ilə qiymətləndirir, bazaya yazır.
`{ scenarioId, operatorName, mode: "voice"|"text", transcript: Line[], durationSec: number }` → `{ id: string }` (sonra `/report/{id}`)

### `POST /api/reviews` — plan (ekran 7 və 3)
Rəhbər düzəlişi və ya işçinin etirazı.
```ts
// sorğu
{ scoreId: string; kind: "manager" | "dispute"; newScore?: 0 | 1 | 2; comment: string }
// cavab
{ id: string }
```
`kind: "manager"` üçün `newScore` məcburidir. `kind: "dispute"` üçün `comment` boş ola bilməz.

### `POST /api/scenarios/draft` — plan (ekran 5)
Şirkət standartından Claude ssenari qaralaması hazırlayır (bazaya yazmır).
```ts
// sorğu
{ standard: string; department: string; language: "az"; customerType: string; difficulty: "low" | "medium" | "high" }
// cavab: ScenarioDraft
{
  title: string; summary: string; persona_prompt: string;
  rubric: { id: number; name: string; levels: { "0": string; "1": string; "2": string }; source: string }[] // 3–8 meyar, source = "§3" və s.
}
```

### `POST /api/scenarios` — plan (ekran 5)
Redaktə olunmuş qaralamanı saxlayır. `ScenarioDraft & { department: string }` → `{ id: string }`

## Planlanan tiplər (backend `types.ts`-ə əlavə edəcək)
```ts
type Review = { id: string; score_id: string; kind: "manager" | "dispute"; new_score: 0|1|2 | null; comment: string | null; created_at: string };

type ReviewItem = {               // ekran 7 növbəsi
  reason: "low_confidence" | "dispute";
  call: { id: string; operator_name: string; created_at: string; scenario_title: string; department: string };
  score: ScoreRow | null;          // low_confidence-də bütün zəng yoxlanır → null ola bilər
  dispute: Review | null;
  transcript_excerpt: Line[];      // sübut vaxtı ətrafında 2–4 replika
};

type DashboardStats = {
  call_count: number; avg_total: number | null; max_total: number;
  by_criterion: { criterion: number; name: string; avg: number }[];   // ən zəifi = min avg
  recent: CallListItem[];
};

type OperatorProfile = {
  name: string; call_count: number; avg_total: number | null;
  by_criterion: { criterion: number; name: string; avg: number }[];
  calls: CallListItem[];
};

type TrainingView = {
  name: string;
  last: CallRow | null;            // strengths / improvements buradan
  recommended_scenario: ScenarioCard | null;
  history: CallListItem[];
};
```
