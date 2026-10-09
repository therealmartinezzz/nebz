# 03 · MVP əhatəsi və ekran spesifikasiyaları

Dizayn faylları: `docs/design/` (ekran nömrələri eynidir). Data modeli: `supabase/migrations/` — cədvəllər `scenarios`, `calls`, `scores`, `reviews`.

## Status
| # | Ekran | Dizayn | Kod | Bu gün? |
|---|---|---|---|---|
| 1 | Ssenari seçimi | `Main.dc.html` | ✅ `src/app/page.tsx` | işlək |
| 2 | Canlı zəng | `Call.dc.html` | ✅ `src/app/call/[id]/` | işlək (səs test olunmalıdır) |
| 3 | Zəng hesabatı | `Report.dc.html` | ✅ `src/app/report/[id]/` | işlək (etiraz UI yoxdur) |
| 4 | Şirkət paneli | `Dashboard.dc.html` | ⬜ (sadə siyahı: `src/app/reports/`) | real test datası ilə |
| 5 | Ssenari yaradıcısı | `Builder.dc.html` | ⬜ | sadə versiya |
| 6 | Operator profili | `Operator.dc.html` | ⬜ | data varsa |
| 7 | Rəhbər yoxlaması | `Review.dc.html` | ⬜ | **bəli, prioritet** |
| 8 | Məşqlərim (işçi) | `Training.dc.html` | ⬜ | vaxt qalsa |

## Ümumi
- Dil: Azərbaycan. Üslub: `src/app/globals.css` tokenləri (IBM Plex Sans/Mono, teal `#0f6e66`, narıncı xəbərdarlıq `#c2410c`).
- Mobil enində işləməlidir. Rəng tək başına məna daşımır (bal həmişə rəqəmlə yazılır).
- Auth yoxdur (demo). Şirkət: "NovaBank · demo".

## 7 · Rəhbər yoxlaması (~1,5 saat)
**Məqsəd:** AI-ın əmin olmadığı balları və etirazları insan qərarına çıxarmaq; düzəlişlər keyfiyyət testinin datası olur.
- Route: `/review`. Növbə: `calls.confidence = 'low'` olan zənglər + `reviews.kind = 'dispute'` qeydləri.
- Detal: meyar, AI balı, AI-ın sübutu və səbəbi, transkriptdən fraqment, etiraz mətni (varsa).
- Rəhbər 0/1/2 seçir + şərh → `reviews` cədvəlinə `kind='manager'`, `new_score`, `comment` yazılır.
- Hesabatda (3) düzəldilmiş bal AI balının yanında göstərilir: "AI: 0 → Rəhbər: 2".
- Hesabatda "Bala etiraz et" düyməsi → meyar seçimi + mətn → `reviews` (`kind='dispute'`).
- API: `POST /api/reviews` `{scoreId, kind, newScore?, comment}`.
- **Qəbul meyarı:** aşağı etibarlılıqlı zəng növbədə görünür; düzəliş saxlanılır və hesabatda əks olunur; AI ilə rəhbər uyğunluğunu hesablamaq üçün data çıxarıla bilir.

## 5 · Ssenari yaradıcısı (~2 saat, sadə versiya)
**Məqsəd:** AI-ın töhfəsini göstərmək — şirkət standartından ssenari və meyar yaratmaq.
- Route: `/scenarios/new`. Giriş: standart mətni (textarea), departament, dil, müştəri tipi, çətinlik.
- `POST /api/scenarios/draft` → Claude JSON qaytarır: `title, summary, persona_prompt, rubric[{id,name,levels{0,1,2},source}]`. `source` = standartın bəndi (§3 və s.).
- Qaralama formada redaktə olunur → "Təsdiqlə" → `scenarios` cədvəlinə yazılır → 1-ci ekranda görünür.
- Server tərəfində yoxlama: rubric 3–8 meyar, hər səviyyə boş deyil, persona_prompt "AI olduğunu demə" və "Azərbaycan dilində danış" qaydalarını ehtiva edir.
- **Qəbul meyarı:** yeni ssenari yaradılır, onunla zəng edilir və hesabat alınır.
- Vaxt yoxdursa: PDF/DOCX yükləmə yoxdur, yalnız mətn.

## 6 · Operator profili (~1 saat)
- Route: `/operators/[name]` (auth olmadığı üçün `calls.operator_name` ilə qruplaşdırılır).
- Göstəricilər: zəng sayı, orta bal, meyarlar üzrə orta, zəng tarixçəsi (hesabata link), təyin edilmiş məşqlər.
- Trend yalnız real data varsa; nümunə rəqəm göstərilmir.

## 8 · Məşqlərim (~1 saat)
- Route: `/me?name=...`. İşçinin öz son hesabatları, rəy (strengths/improvements), növbəti tövsiyə olunan ssenari → "Məşqə başla" 2-ci ekrana keçir.
- Məxfilik qeydi: nəticələri yalnız işçi və birbaşa rəhbəri görür.

## 4 · Şirkət paneli
- Real test zənglərindən: zəng sayı, orta bal, meyarlar üzrə orta (ən zəif meyar vurğulanır), son zənglər.
- Dizayndakı rəqəmlər (48 zəng, 8,4 və s.) **nümunədir** — kodda istifadə edilməməlidir.

## MVP-yə daxil deyil
Telefoniya ilə real zənglər, rus dili, CRM/ATS inteqrasiyası, auth/rollar, video/emosiya analizi (qəsdən yoxdur).
