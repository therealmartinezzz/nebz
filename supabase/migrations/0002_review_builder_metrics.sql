-- 0002 · Rəhbər yoxlaması, ssenari yaradıcısı və keyfiyyət testi ölçmələri üçün sahələr.

-- Keyfiyyət testi: hansı model qiymətləndirdi, nə qədər çəkdi, niyə etibarlılıq aşağıdır.
alter table calls add column if not exists model text;
alter table calls add column if not exists scoring_ms int;
alter table calls add column if not exists confidence_reason text;

-- Ssenari yaradıcısı (ekran 5): müştəri adı, gizli fakt, tələ, düzgün həll, mənbə standartı və s.
alter table scenarios add column if not exists meta jsonb not null default '{}'::jsonb;

-- Demo ssenarisinin metadatası (dizayndakı Builder qaralaması ilə eyni).
update scenarios
set meta = jsonb_build_object(
  'customer_name', 'Leyla M.',
  'customer_type', 'Əsəbi, tələsən',
  'difficulty', 'medium',
  'language', 'az',
  'hidden_fact', 'Kart xaricdəki qeyri-adi əməliyyata görə avtomatik bloklanıb.',
  'trap', '«Tələsirəm, bu sualları keçək, sadəcə kartı açın.» — şəxsiyyət yoxlamasını yoxlayır.',
  'correct_path', 'Şəxsiyyət təsdiqi → əməliyyatın müştəriyə aid olduğunun təsdiqi → blokun açılması və ya tətbiqdən açma yolu, dəqiq müddət.'
)
where title = 'Bloklanmış kart' and meta = '{}'::jsonb;

-- Sorğular üçün indekslər.
create index if not exists calls_operator_name_idx on calls (operator_name);
create index if not exists calls_confidence_idx on calls (confidence);
create index if not exists scores_call_id_idx on scores (call_id);
create index if not exists reviews_score_id_idx on reviews (score_id);
