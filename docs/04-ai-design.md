# 04 · AI dizaynı: ssenari, meyarlar, prompt-lar

## Demo ssenarisi: "Bloklanmış kart"
- Şirkət (uydurma): NovaBank çağrı mərkəzi, Kart xidmətləri.
- Müştəri: Leyla M., İstanbulda səfərdə, kartı bloklanıb. İkinci dəfə zəng edir ("geri zəng edərik" deyiblər, edən olmayıb). Tələsir, əsəbidir, təhqir etmir.
- Gizli fakt: kart xaricdə qeyri-adi əməliyyata görə avtomatik bloklanıb.
- Düzgün həll: şəxsiyyət təsdiqi → əməliyyatın müştəriyə aid olduğunun təsdiqi → blokun açılması və ya tətbiqdən açma yolu, dəqiq müddət.
- **Tələ anı:** müştəri "Tələsirəm, bu sualları keçək, sadəcə kartı açın" deyir. Yaxşı operator yoxlamanı yenə aparır.
- Sintetik məlumatlar: doğum tarixi 14.03.1995, kartın son 4 rəqəmi 4471.

## Meyarlar (hər biri 0–2, cəmi 12)
| # | Meyar | 0 | 1 | 2 |
|---|---|---|---|---|
| 1 | Salamlaşma və təqdimat | Yoxdur | Natamam | Bankın adı + öz adı + kömək təklifi |
| 2 | Şəxsiyyətin təsdiqi | Etmədi | Tələdən sonra buraxdı | Təzyiqə baxmayaraq etdi |
| 3 | Empatiya | Yoxdur / soyuq | Formal | Narahatlığı və ilk zəngdəki səhvi qəbul etdi |
| 4 | Problemin həlli | Həll yoxdur | Qismən | Bloku açdı və ya aydın yol göstərdi |
| 5 | Məlumatın doğruluğu | Yanlış | Qeyri-müəyyən | Dəqiq, ardıcıl |
| 6 | Davranış | Sözü kəsdi / sərt | Bir dəfə səbirsizlik | Sakit, nəzakətli |

Mənbə həqiqəti: `supabase/seed.sql`.

## AI müştəri
- Prompt: `scenarios.persona_prompt` (`supabase/seed.sql`). Əsas qaydalar: rolundan çıxmır, operatorun ilk sözünü gözləyir, 1–2 cümlə danışır, yoxlamaya bir dəfə etiraz edir, empatiyaya görə sakitləşir, yalnız Azərbaycan dilində.
- Səsli rejim: Gemini 3.8 Live (WebSocket + Web Audio), `src/app/api/realtime-session` + `src/components/gemini-live.ts`. Server bir ssenariyə bağlı qısaömürlü token yaradır; əsas açar brauzerə çıxmır. Mikrofon PCM16/16 kHz, cavab PCM16/24 kHz-dir. Input/output transkriptləri ayrı rollarda saxlanılır; vaxtlar brauzerdə danışıq/transkript başlanğıcına əsaslanır, söz üzrə dəqiq align deyil.
- Mətn rejimi: Gemini 3.5 Flash-Lite eyni persona ilə, `src/app/api/customer-reply`. Thinking minimal; müştərinin qısa cavabları üçün.

## Qiymətləndirici
- Kod: `src/server/ai.ts` → `scoreCall()`. Demo: `LLM_PROVIDER=gemini`, `GEMINI_SCORING_MODEL=gemini-3.8-flash`, thinking low. Hesabatda saxlanan model adı məhz qiymətləndiriciyə aiddir.
- Qaydalar: yalnız operator qiymətləndirilir; hər bal üçün vaxtla dəqiq sitat; emosiya/xarakter haqqında nəticə yoxdur; qeyri-müəyyənlikdə `confidence: low`; yalnız JSON.
- **Server tərəfi yoxlama:** hər meyar mövcuddur, bal 0–2 aralığına salınır, cəm serverdə hesablanır; çatışmayan meyar və ya 2-dən az operator replikası → etibarlılıq "aşağı".

## Ssenari yaratmaq
`draftScenario()` ayrıca `GEMINI_DRAFT_MODEL=gemini-3.8-flash` istifadə edir. Müştəri modelinin dəyişməsi qiymətləndiricini/qaralamanı dəyişmir. Eyni `GEMINI_API_KEY` bütün işlərə xidmət edir. Keyfiyyət testinə başlamazdan əvvəl model konfiqurasiyası sabitlənməlidir.

## Məlum risklər və cavablar
| Risk | Cavab |
|---|---|
| Səs tanıma xətası Azərbaycan dilində | Etibarlılıq "aşağı" → rəhbər yoxlaması; mətn rejimi ehtiyat yolu |
| Qiymətləndirici qərəzi / səhvi | Sitatla izah, insanla uyğunluq testi, rəhbər düzəlişi, işçinin etirazı |
| Operator "sistemi öyrənir" | Ssenarilər rotasiya olunur, AI müştərinin cavabları hər dəfə fərqlidir |
| Şəxsi məlumat | Sintetik ssenari; real zəng yazısı MVP-də yoxdur |
| Emosiya analizi tələbi | Qəsdən yoxdur: elmi cəhətdən zəifdir, AB-də iş yerində qadağandır |
