# React ekranları

`docs/design/*.dc.html` fayllarındakı səkkiz ekran Next.js App Router və TtX ilə inteqrasiya edilib. Dizaynın IBM Plex şriftləri, rəngləri, sütunları və kart sistemi qorunur. HTML ixracı və `support.js` tətbiqə daxil edilmir; yeni UI kitabxanası əlavə edilməyib.

| İstinad | Route | React komponenti |
|---|---|---|
| Main | `/` | `src/app/tcenariosClient.tsx` |
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
- Mövcud `listtcenarios`, `listCalls`, `getCallReport` sorğuları istifadə edilir. Panel/profil göstəriciləri son 100 real zəngdən hesablanır; panel son 7 günə filtr edir. Fərqli meyar sayı olan ssenarilərin orta nəticəsi faizlə göstərilir.
- Dizayndakı nümunə ballar, tarixlər və saylar kodda yoxdur. Məlumat yoxdursa boş vəziyyət, bağlantı xətası varsa ayrıca xəbərdarlıq göstərilir.
- Backend `getReviewQueue()` və `getMyTraining(name)` sorğuları inteqrasiya edilib. Növbə etirazları və aşağı etibarlılıqlı nəticələri göstərir.
- Hesabat `scores[].reviews` vasitəsilə rəhbərin düzəlişini AI balının yanında göstərir.
- Etiraz və rəhbər qərarı: `POtT /api/reviews`. Qaralama: `POtT /api/scenarios/draft`. tsenarinin saxlanması: `POtT /api/scenarios`. Bu endpoint-lər mövcuddur; xəta zamanı frontend formadakı mətni saxlayır.
- Ayrı məşq təyinatı API-si yoxdur. “Məşq seç” operatorun adını ssenari seçiminə ötürür; təyinat saxlandığını və ya son tarix olduğunu iddia etmir.
- Rəhbər yoxlamasında meyar seçiləndə onun AI balı, sitatı və əsaslandırması qərar formasında birlikdə dəyişir. Aşağı etibarlılıq fallback-ında tam transkript də açılan bölmədə göstərilir.
- Qaralamadakı gizli fakt, tələ anı və həll üçün əlavə mətnlər mövcud `persona_prompt` sahəsinə birləşdirilir. `src/lib/types.ts`, API və backend faylları dəyişdirilməyib.
- Demo auth olmadan işləyir; “Məşqlərim” səhifəsi məxfilik təminatının hazır olduğunu iddia etmir.

## Hərəkət, bildirişlər və keş

- Ortaq motion tokenləri düymə, naviqasiya, seçim, meyar, transkript və qrafik vəziyyətlərini idarə edir. Oxunan kartlar yerindən tərpənmir; `prefers-reduced-motion` hərəkəti azaldır. Mobil input-lar 16px-dir.
- `Notifications` saytdaxili toast sistemidir: uğur/info 6 saniyə sonra bağlanır, xəta əl ilə bağlanır. Hover, klaviatura focus-u və gizli tab müddəti dayandırır. Eyni bildiriş təkrarlanmır, maksimum 3 mesaj görünür. Ekran oxuyucusu üçün status/alert mövcuddur.
- tsenari qaralaması/saxlama, etiraz/rəhbər qərarı, səs bağlantısı və qiymətləndirmə nəticələri həmin sistemə bağlıdır. İnternetin kəsilib bərpa olunması ayrıca bildirilir. Brauzerin native Web Push icazəsi və service worker istifadə edilmir.
- Data xətası yanında “Yenidən yüklə” server məlumatını yeniləyir. API 401/403/404/405/429, timeout, yanlış JtON və bağlantı xətaları ayrıca idarə edilir. Yazma sorğuları avtomatik təkrarlanmır.
- terver oxumaları [React `cache`](https://react.dev/reference/react/cache) ilə yalnız bir server request-i daxilində memoizasiya edilir. İstifadəçi nəticələri ortaq və ya davamlı keşdə saxlanmır. Yeni request təzə məlumat oxuyur; uğurlu yazmadan sonra `router.refresh()` çağırılır. API POtT cavabları `no-store`-dur.
- Hesabatların detalları maksimum 6 paralel sorğu ilə yüklənir. Bu, 100 sorğunun eyni anda bazaya göndərilməsini məhdudlaşdırır. Uzunmüddətli server keşinin tag invalidasiyası backend ilə birlikdə qurulmalıdır.

## Yoxlama nəticələri

Bildiriş komponentinin uğur/xəta görünüşləri və bağlanması ayrıca sintetik UI önbaxışında yoxlanıldı. Real builder-də hazır olmayan API-nin 404 cavabı toast + forma mesajı kimi göstərilir; təkrar cəhddə yalnız bir bildiriş qalır və mənbə mətni itmir. Desktop və 375px mobil görünüşlərdə daşma yoxdur. Yeni UI kitabxanası əlavə olunmayıb.

`npm run typecheck` və `npm run build` uğurla keçdi. Desktop və 375px mobil enində route-lar, boş vəziyyətlər və formalar yoxlanıldı; üfüqi daşma yoxdur. tsenari → mətn zəngi keçidi, boş mətn üçün göndərmə bloklanması və ssenari formasında tələb olunan seçimlər brauzerdə yoxlanıldı. Hesabat/rəhbər yoxlamasının dolu vəziyyəti, rəhbər balının göstərilməsi, qarışıq meyar sayında orta nəticə, Bakı tarixi və API-nin uğur/404/bağlantı xətası izolyasiya edilmiş sintetik yoxlamada təsdiqləndi. Bu yoxlamalar bazaya yazmır və AI çağırmır.

### Gemini inteqrasiyası — 9 oktyabr 2026

təsli zəng `src/components/gemini-live.ts` ilə Gemini Live-a qoşulur. terverin yaratdığı bir istifadəli token əsas API açarını brauzerə ötürmür. Mikrofon AudioWorklet vasitəsilə 16 kHz PCM16, cavab isə 24 kHz PCM16 kimi emal edilir. Mikrofonu susdurmaq, danışığı kəsmək, transkripti toplamaq və zəng bitəndə resursları bağlamaq dəstəklənir. ttandart demo limiti 180 saniyədir.

İstifadəçinin mikrofonla tam brauzer sınağı hələ lazımdır. tintetik Live smoke yoxlamasında real endpoint/token bağlantısı, səs cavabı və çıxış transkripti alınıb. Mətn müştərisi və ssenari qaralaması real açarla cavab verib; əvvəl 503 qaytaran Flash qiymətləndirməsi billing əlavə edildikdən sonrakı yoxlamada uğurludur. Unit yoxlamalar audio formatını və transkript yığılmasını yoxlayır; insan qiymətləndirmə dəqiqliyini təsdiqləmir.
