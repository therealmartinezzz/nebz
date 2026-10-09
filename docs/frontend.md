# React ekranları

`docs/design/*.dc.html` fayllarındakı səkkiz ekran Next.js App Router və TSX ilə inteqrasiya edilib. Dizaynın IBM Plex şriftləri, rəngləri, sütunları və kart sistemi qorunur. HTML ixracı və `support.js` tətbiqə daxil edilmir; yeni UI kitabxanası əlavə edilməyib.

| İstinad | Route | React komponenti |
|---|---|---|
| Main | `/` | `src/app/ScenariosClient.tsx` |
| Call | `/call/[id]?name=...&mode=voice\|text` | `src/app/call/[id]/CallClient.tsx` |
| Report | `/report/[id]` | `src/app/report/[id]/ReportClient.tsx` |
| Dashboard | `/dashboard` | `src/app/dashboard/page.tsx` |
| Builder | `/scenarios/new` | `src/app/scenarios/new/BuilderClient.tsx` |
| Operator | `/operators/[name]` | `src/app/operators/[name]/page.tsx` |
| Review | `/review` | `src/app/review/ReviewClient.tsx` |
| Training | `/me?name=...` | `src/app/me/page.tsx` |

Əlavə `/reports` və `/operators` siyahıları detallara keçid verir. Ortaq naviqasiya aktiv route-u göstərir. Mobil enində sütunlar birləşir, cədvəllər etiketli sətirlərə çevrilir. Klaviatura focus-u, loading, xəta, boş data və 404 vəziyyətləri mövcuddur.

## Data və inteqrasiya

- `src/components/server-data.ts` yalnız `src/server/queries.ts` funksiyalarını çağırır. Frontend bazaya birbaşa çıxmır.
- Mövcud `listScenarios`, `listCalls`, `getCallReport` sorğuları istifadə edilir. Panel/profil göstəriciləri son 100 real zəngdən hesablanır; panel son 7 günə filtr edir. Fərqli meyar sayı olan ssenarilərin orta nəticəsi faizlə göstərilir.
- Dizayndakı nümunə ballar, tarixlər və saylar kodda yoxdur. Məlumat yoxdursa boş vəziyyət, bağlantı xətası varsa ayrıca xəbərdarlıq göstərilir.
- Backend `getReviewQueue()` və `getMyTraining(name)` sorğularını müqaviləyə uyğun əlavə etdikdə frontend onları avtomatik istifadə edir. İndiki fallback yalnız aşağı etibarlılıqlı zənglərdən yoxlama növbəsi qurur; etirazların tam siyahısını əldə edə bilmir.
- Hesabat `scores[].reviews` gələndə rəhbərin düzəlişini AI balının yanında göstərir. Bu bağlı qeydlər indiki backend sorğusunda hələ yoxdur.
- Etiraz və rəhbər qərarı: `POST /api/reviews`. Qaralama: `POST /api/scenarios/draft`. Ssenarinin saxlanması: `POST /api/scenarios`. Bu üç endpoint indiki repoda plan statusundadır. API olmadıqda frontend uğurlu saxlanma göstərmir və formadakı mətni saxlayır.
- Ayrı məşq təyinatı API-si yoxdur. “Məşq seç” operatorun adını ssenari seçiminə ötürür; təyinat saxlandığını və ya son tarix olduğunu iddia etmir.
- Rəhbər yoxlamasında meyar seçiləndə onun AI balı, sitatı və əsaslandırması qərar formasında birlikdə dəyişir. Aşağı etibarlılıq fallback-ında tam transkript də açılan bölmədə göstərilir.
- Qaralamadakı gizli fakt, tələ anı və həll üçün əlavə mətnlər mövcud `persona_prompt` sahəsinə birləşdirilir. `src/lib/types.ts`, API və backend faylları dəyişdirilməyib.
- Demo auth olmadan işləyir; “Məşqlərim” səhifəsi məxfilik təminatının hazır olduğunu iddia etmir.

## Yoxlama

`npm run typecheck` və `npm run build` uğurla keçdi. Desktop və 375px mobil enində route-lar, boş vəziyyətlər və formalar yoxlanıldı; üfüqi daşma yoxdur. Ssenari → mətn zəngi keçidi, boş mətn üçün göndərmə bloklanması və ssenari formasında tələb olunan seçimlər brauzerdə yoxlanıldı. Hesabat/rəhbər yoxlamasının dolu vəziyyəti, rəhbər balının göstərilməsi, qarışıq meyar sayında orta nəticə, Bakı tarixi və API-nin uğur/404/bağlantı xətası izolyasiya edilmiş sintetik yoxlamada təsdiqləndi. Bu yoxlamalar bazaya yazmır və AI çağırmır.

Səsli AI zəngi və real saxlanma bu frontend yoxlamasının əhatəsinə daxil deyil; onların işləməsi üçün uyğun API açarları və hazır backend endpoint-ləri lazımdır. Səsin başlayıb-bitməsi və danışıq indikatorlarının event adları [OpenAI Realtime server event-ləri](https://developers.openai.com/api/reference/resources/realtime/server-events) ilə yoxlanılıb.
