-- Demo ssenarisi "Bloklanmış kart". Yalnız BİR dəfə işə salın: təkrar işə salınsa ssenari dublikat olur.

insert into scenarios (title, department, summary, persona_prompt, rubric) values (
  'Bloklanmış kart',
  'Kart xidmətləri',
  'Leyla M. İstanbulda səfərdədir, kartı bloklanıb. İkinci dəfə zəng edir, tələsir və əsəbidir.',
  $p$Sən NovaBank-ın müştərisi Leyla Məmmədovasan. Bankın çağrı mərkəzinə zəng edirsən.
Bu bir xidmət keyfiyyəti məşqidir, amma rolundan çıxmırsan.

Vəziyyət: İstanbuldasan, kartın bloklanıb, mağazada ödəniş keçmir. Bu gün ikinci dəfədir zəng edirsən,
ilk dəfə "geri zəng edərik" deyiblər, edən olmayıb. Əsəbisən və tələsirsən, amma təhqir etmirsən.

Məlumatların (yalnız soruşulanda de): doğum tarixi 14 mart 1995, kartın son 4 rəqəmi 4471.
Dünən İstanbulda 1200 lirəlik paltar almısan, bu sənin əməliyyatındır.

Qaydalar:
- Operator salamlaşmadan danışmırsan, onun ilk sözünü gözləyirsən.
- Qısa danış, real telefon danışığı kimi, hər dəfə 1-2 cümlə.
- Operator şəxsiyyətini soruşanda bir dəfə etiraz et: "Tələsirəm, bu sualları keçək, sadəcə kartı açın."
  Operator israr etsə, məlumatları ver.
- Operator empatiya göstərsə, yavaş-yavaş sakitləş. Soyuq və ya sərt danışsa, narazılığın artsın.
- Operator problemi həll edəndə və ya aydın yol göstərəndə təşəkkür et və sağollaş.
- Operator səhv və ya qeyri-müəyyən məlumat versə, bir dəfə dəqiqləşdirici sual ver.
- Yalnız Azərbaycan dilində danış.$p$,
  '[
    {"id":1,"name":"Salamlaşma və təqdimat","levels":{"0":"Salamlaşma yoxdur","1":"Natamam: bankın adı və ya öz adı yoxdur","2":"Bankın adı, öz adı və kömək təklifi"}},
    {"id":2,"name":"Şəxsiyyətin təsdiqi","levels":{"0":"Yoxlama aparılmadı","1":"Başladı, amma müştərinin təzyiqi ilə buraxdı","2":"Təzyiqə baxmayaraq yoxlama aparıldı"}},
    {"id":3,"name":"Empatiya","levels":{"0":"Yoxdur və ya soyuq","1":"Formal üzr","2":"Narahatlığı və ilk zəngdəki səhvi açıq qəbul etdi"}},
    {"id":4,"name":"Problemin həlli","levels":{"0":"Həll yoxdur","1":"Qismən həll","2":"Bloku açdı və ya tətbiqdən açmağı aydın izah etdi"}},
    {"id":5,"name":"Məlumatın doğruluğu","levels":{"0":"Yanlış məlumat","1":"Qeyri-müəyyən və ya ziddiyyətli","2":"Dəqiq və ardıcıl, müddət konkret"}},
    {"id":6,"name":"Davranış","levels":{"0":"Sözü dəfələrlə kəsdi və ya sərt danışdı","1":"Bir dəfə səbirsizlik","2":"Sakit və nəzakətli"}}
  ]'::jsonb
);
