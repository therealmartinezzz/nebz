# 05 · Keyfiyyət testi planı (20 bal)

Vaxt: 16:30–18:00. Bu blok kəsilmir.

## Dizayn
- 2 komanda üzvü operator rolunu oynayır, hər biri aşağıdakı 8 davranışın hər birini bir dəfə ifa edir → **16 zəng**.
- Hər zəngi başqa bir üzv AI nəticəsini **görmədən** eyni meyarlarla qiymətləndirir (`test-results-template.csv`).
- Mümkünsə yarısı səsli, yarısı mətn rejimində — səs tanımanın təsirini ayırmaq üçün.

## 8 operator davranışı
1. Mükəmməl operator
2. Şəxsiyyət yoxlamasını buraxan
3. Sərt danışan, sözü kəsən
4. Yanlış məlumat verən
5. Problemi həll etməyən ("geri zəng edərik")
6. Empatiyasız, amma texniki cəhətdən düzgün
7. Salamlaşmadan birbaşa işə keçən
8. Qarışıq: yaxşı başlayıb sonda səbirsizləşən

Hər davranış üçün **gözlənilən** meyar ballarını testdən əvvəl yaz (məs. #2 → meyar 2 = 0).

## Ölçülənlər (deck-ə gedir)
- Meyar üzrə AI = insan üst-üstə düşmə faizi (dəqiq uyğunluq) və ±1 daxilində uyğunluq.
- Ümumi balda orta mütləq fərq.
- Gözlənilən "tələ" pozuntularını (#2, #4) AI neçə dəfə tutdu.
- Etibarlılıq "aşağı" olan zənglər və səbəbi.
- **2–3 konkret uğursuzluq nümunəsi** (transkript fraqmenti + niyə səhv oldu).
- Vaxt müqayisəsi: insanın bir zəngi dinləyib qiymətləndirməsi (ölç, təxmin etmə) vs Nəbz (zəng bitdikdən hesabata qədər saniyə).

## Qaydalar
- Uğursuzluqları gizlətmə — bal kartı dürüst uğursuzluğu mükafatlandırır.
- Rəqəmləri yalnız bu testdən götür. Kiçik nümunə (16 zəng) olduğunu deck-də açıq yaz.
