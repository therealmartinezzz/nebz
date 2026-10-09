# 01 · Layihə brifi

## Problem
Bank, telekom, pərakəndə kimi şirkətlər xidmət keyfiyyətini çox vaxt yalnız **şikayət gələndən sonra** öyrənir. Klassik keyfiyyət yoxlaması (insan dinləyici və ya "gizli müştəri" xidməti) bahadır, yavaşdır, az sayda zəngi əhatə edir və nəticə yoxlayan insandan asılıdır. Operatorların real çətin situasiyalarda məşq etmək imkanı da azdır.

## Həll
AI müştəri operatorla real iş ssenarisi üzrə danışır (məsələn: kartı bloklanmış, tələsən, əsəbi müştəri). Zəngdən sonra Claude operatoru şirkətin öz xidmət standartından çıxarılmış meyarlar üzrə qiymətləndirir. Hər bal transkriptdən sitatla əsaslandırılır. Rəhbər hesabatı görür, şübhəli balları yoxlayır, işçiyə məşq təyin edir.

## Kimlər üçün
- **Alıcı:** çağrı mərkəzi rəhbəri, keyfiyyət (QA) və təlim departamenti.
- **İstifadəçi:** operator (məşq edir, rəy alır, etiraz edir) və rəhbər (nəticələri görür, qərar verir).
- İlk hədəf seqment: həcmli çağrı mərkəzi olan banklar və telekom şirkətləri.

## Fərqlənmə
- Müsahibə sualı deyil, **işin özü** yoxlanılır: dialoq real vaxtda dəyişir, hazır cavabı əzbərləmək olmur.
- Meyarlar şirkətin **öz standartının bəndlərinə** bağlıdır, bal izah oluna bilir.
- **Azərbaycan dilində** səsli məşq.
- İnsan nəzarəti dizaynın içindədir: etibarlılıq, etiraz, rəhbər düzəlişi.

## Dəyər metrikası (münsiflər üçün)
Əsas metrika: **AI balının insan qiymətləndiricinin balı ilə üst-üstə düşmə faizi** (meyar üzrə) və **bir zəngin qiymətləndirilməsinə sərf olunan vaxt** (insan vs Nəbz). Hər ikisi bu gün test zənglərindən ölçülür — `05-quality-testing.md`.

## Pitch cümləsi
"Şirkətlər işçinin müştəri ilə necə danışdığını şikayət gələndə öyrənir. Biz bunu hər gün ölçürük və zəif yerləri dərhal məşqə çeviririk."

## İdeyanın təkamülü (kontekst üçün)
1. Başlanğıc: AI ilə ilkin işə qəbul müsahibəsi. Bazar doludur (HireVue və b.), fərqlənmə zəif idi.
2. Pivot: müsahibə sualları əvəzinə rol oyunu ilə iş nümunəsinin yoxlanması.
3. Son istiqamət: mövcud işçilər üçün xidmət keyfiyyəti məşqi və qiymətləndirməsi.
