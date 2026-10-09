# Nəbz — agentlər üçün layihə konteksti

Bu fayl Codex (frontend) və Claude Code (backend) üçün ortaq qaydadır. İşə başlamazdan əvvəl bunu, sonra `docs/` qovluğunu oxu.

## Nə qururuq
NeuroBridge.SI Baku 2026 hackathonu, **AI Enterprise Solutions** bölməsi. Məhsul: **Nəbz** — AI müştəri ilə xidmət keyfiyyəti məşqi və qiymətləndirməsi. Operator AI müştəri ilə real ssenari üzrə danışır, Claude zəngi meyarlar üzrə qiymətləndirir, rəhbər hesabatı görür və son qərarı verir. Ətraflı: `docs/01-brief.md`.

## Vaxt
- **9 oktyabr 2026, 20:00 (Bakı) — sərt son tarix.** Bundan sonra kod dondurulur.
- 16:00-a qədər 1-ci cərgə (ssenari → zəng → qiymətləndirmə → hesabat) işləmirsə, yeni ekranları dayandır.
- 16:30–18:00 keyfiyyət testi (`docs/05-quality-testing.md`) — bu vaxt kəsilmir.

## Komanda bölgüsü
| Rol | Alət | Sahib olduğu yollar |
|---|---|---|
| **Frontend** | Codex | `src/app/**/page.tsx`, `src/app/**/*Client.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/**` |
| **Backend** | Claude Code | `src/app/api/**`, `src/server/**`, `supabase/**` |
| Ortaq | — | `src/lib/**` (tiplər, formatlama), `docs/**` |

- Başqasının yoluna toxunma. Lazımdırsa, PR təsvirində və ya mesajla soruş.
- `src/lib/types.ts` frontend ilə backend arasındakı müqavilədir: dəyişiklik lazımdırsa, backend edir.
- Frontend bazaya və ya Claude-a birbaşa getmir: yalnız `src/server/queries.ts` funksiyalarını (server komponentlərində) və `/api/*` endpoint-lərini (client komponentlərində) çağırır. Müqavilə: **`docs/api.md`**.
- Backend sorğuları və endpoint-ləri hazırdır (`docs/api.md`). Bazada data yoxdursa, UI boş vəziyyət göstərir — mock rəqəm göstərilmir.

## Struktur
```
src/
  app/            Next.js App Router: səhifələr (frontend) + api/ (backend)
  components/     Təkrar istifadə olunan UI komponentləri (frontend)
  server/         Yalnız serverdə: db.ts (Supabase), llm.ts (Claude/Gemini seçimi), ai.ts (AI müştəri + qiymətləndirmə), queries.ts (oxuma sorğuları)
  lib/            Ortaq, brauzerdə də işləyən kod: types.ts, format.ts
supabase/         migrations/ (nömrə sırası ilə) + seed.sql
docs/             Brif, qaydalar, ekran spesifikasiyaları, API müqaviləsi, design/
```
`src/server/*` faylları `import "server-only"` ilə qorunur — client komponentindən import edilsə build xəta verir. Bu qəsdəndir.

## Komandalar
```
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # PR-dan əvvəl mütləq
npm run build      # PR-dan əvvəl mütləq
```
Açarlar `.env.local` faylındadır (repoya düşmür, komandadan mesajla alınır). Şablon: `.env.example`.

## Ekranlar və status
Spesifikasiya və qəbul meyarları: `docs/03-mvp-scope.md`. Dizayn: `docs/design/*.dc.html` (brauzerdə aç, layout/mətn/rəngi oradan götür, faylı kodda istifadə etmə).

| # | Ekran | Route | Dizayn | Backend (data) | Frontend (UI) |
|---|---|---|---|---|---|
| 1 | Ssenari seçimi | `/` | Main | hazır `listScenarios` | işlək |
| 2 | Canlı zəng | `/call/[id]` | Call | hazır `getScenario` | işlək; müştəri adı sabit "Leyla M." → `meta.customer_name`; xətada "qiymətləndirir…"-də donur |
| 3 | Zəng hesabatı | `/report/[id]` | Report | hazır `getCallReport`, `POST /api/reviews` | işlək; etiraz düyməsi + "AI → Rəhbər" balı yoxdur |
| 4 | Şirkət paneli | `/dashboard` | Dashboard | hazır `getDashboard` | yoxdur (indi sadə `/reports`) |
| 5 | Ssenari yaradıcısı | `/scenarios/new` | Builder | hazır `/api/scenarios/draft`, `/api/scenarios` | yoxdur |
| 6 | Operator profili | `/operators/[name]` | Operator | hazır `getOperatorProfile` | yoxdur |
| 7 | Rəhbər yoxlaması | `/review` | Review | hazır `getReviewQueue`, `POST /api/reviews` | yoxdur — **prioritet** |
| 8 | Məşqlərim | `/me?name=` | Training | hazır `getMyTraining` | yoxdur |

Prioritet (UI): 7 → 3-ə etiraz/rəhbər balı → 2-nin xəta vəziyyəti → 5 → 4 → 6 → 8. Data formaları: `docs/api.md` + `src/lib/types.ts` — mock lazım deyil, backend hazırdır.

## UI qaydaları
- Bütün mətn **Azərbaycan dilində**. Şirkət: "NovaBank · demo".
- Üslub `src/app/globals.css` tokenlərindən: IBM Plex Sans/Mono, aksent `#0f6e66`, xəbərdarlıq `#c2410c`. Yeni rəng uydurma.
- Mobil enində işləməlidir (375px), üfüqi scroll olmasın.
- Rəng tək başına məna daşımır: bal həmişə rəqəmlə yazılır (`1/2`).
- Dizayndakı rəqəmlər (48 zəng, 8,4 və s.) **nümunədir** — kodda heç vaxt istifadə edilmir. Data yoxdursa, boş vəziyyət göstər.
- Yeni UI kitabxanası əlavə etmə (vaxt yoxdur, açıqlama tələb edir). Lazımdırsa, əvvəl soruş.

## Məhsul prinsipləri (kodda və dizaynda qorunur)
- AI bal verir, **son qərarı insan verir**.
- Hər bal transkriptdən **vaxt + sitatla** əsaslandırılır.
- **Emosiya deyil, davranış ölçülür.**
- İşçi öz nəticələrini görür və **bala etiraz edə bilər**.
- Ballar inkişaf üçündür, avtomatik cəza üçün deyil.
- Real şəxsi məlumat yoxdur: ssenarilər sintetikdir.

## Ümumi qaydalar
- Komanda ilə Azərbaycan dilində, qısa danış. Hər təklifdə 20:00-a qədər qurula bilib-bilməyəcəyini de.
- **Rəqəm uydurma.** Deck-ə yalnız real test nəticələri gedir.
- Bilinməyəni soruş, fərziyyə uydurma.
- Açarları (`.env.local`, `sk-...`, `eyJ...`) heç vaxt commit etmə, koda yazma, log-a çıxarma.
- İstifadə olunan hər model, kitabxana və şablon açıqlanır — `README.md` sonundakı siyahını yenilə.
- Git axını: `CONTRIBUTING.md`.
