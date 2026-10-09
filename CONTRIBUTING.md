# İş axını (2 nəfər, 1 gün)

## Branch-lər
- `main` — həmişə işlək. Demo (Vercel) buradan yayımlanır. Birbaşa push etmə.
- `fe/<qısa-ad>` — frontend (məs. `fe/review-screen`)
- `be/<qısa-ad>` — backend (məs. `be/reviews-api`)

## Dövr
1. `git checkout main && git pull`
2. `git checkout -b fe/review-screen`
3. Kiçik hissə qur (≤ 1 saat iş). Öz yollarından kənara çıxma (`AGENTS.md` → Komanda bölgüsü).
4. `npm run typecheck && npm run build` — xətasız olmalıdır.
5. Commit: `fe: review növbəsi ekranı`, `be: POST /api/reviews`, `docs: ...`, `fix: ...`
6. `git push -u origin fe/review-screen` → GitHub-da Pull Request → digər üzv baxır → **Squash and merge**.
7. Merge-dən sonra hər ikiniz: `git checkout main && git pull`.

Tez-tez (hər 1–1,5 saatdan bir) merge et — gec merge = konflikt.

## Konflikt olsa
`git checkout fe/x && git pull origin main` → konflikti həll et → typecheck → push. Başqasının faylında konflikt varsa, onunla danış.

## Son tarix
- **19:30** — son merge. 19:30–20:00 yalnız demo yoxlaması və təhvil.
- 20:00-dan sonra `main`-ə heç nə getmir.

## Açarlar
`.env.local` heç vaxt commit olunmur (`.gitignore`-da). Açarları komanda daxilində şəxsi mesajla paylaş. Təsadüfən commit olunubsa — dərhal de, açar Supabase/Anthropic/OpenAI-da yenilənməlidir.
