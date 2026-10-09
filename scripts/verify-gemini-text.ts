// Real Gemini ilə sintetik smoke yoxlaması: bazaya yazmır, açarları çap etmir.
// node --env-file=.env.local node_modules/vite-node/vite-node.mjs --config vitest.config.ts scripts/verify-gemini-text.ts
import { customerReply, draftScenario, scoreCall } from "../src/server/ai";
import { modelName } from "../src/server/llm";
import type { Criterion, Line } from "../src/lib/types";

const rubric: Criterion[] = [
  { id: 1, name: "Salamlaşma", levels: { "0": "Salamlaşma yoxdur", "1": "Yalnız salam", "2": "Bankın və operatorun adı, kömək təklifi" } },
  { id: 2, name: "Şəxsiyyət təsdiqi", levels: { "0": "Yoxlama yoxdur", "1": "Natamam yoxlama", "2": "Doğum tarixi və kartın son 4 rəqəmi yoxlanılır" } },
  { id: 3, name: "Problemin həlli", levels: { "0": "Həll yoxdur", "1": "Qeyri-müəyyən həll", "2": "Aydın addımlar və dəqiq müddət verilir" } },
];
const transcript: Line[] = [
  { role: "operator", text: "Salam, NovaBank, mən Ayseləm. Sizə necə kömək edə bilərəm?", t: 0 },
  { role: "customer", text: "Kartım bloklanıb, tələsirəm.", t: 4 },
  { role: "operator", text: "Narahatlığınızı anlayıram. Doğum tarixinizi və kartın son dörd rəqəmini deyin.", t: 8 },
  { role: "customer", text: "14 mart 1995, 4471.", t: 12 },
  { role: "operator", text: "Təşəkkür edirəm. Tətbiqdə Kartlar bölməsindən kartınızı seçin və Bloku aç düyməsinə basın. Əməliyyat dərhal tamamlanacaq.", t: 16 },
];

let failed = false;
for (const task of ["customer", "scoring", "draft"] as const) {
  if (process.env.GEMINI_VERIFY_TASK && process.env.GEMINI_VERIFY_TASK !== task) continue;
  const started = Date.now();
  try {
    if (task === "customer") {
      const reply = await customerReply("Sən Leyla adlı sintetik bank müştərisisən. Kartın bloklanıb. Azərbaycan dilində 1–2 cümlə danış. AI olduğunu demə.", transcript.slice(0, 1));
      if (!reply.trim()) throw new Error("Boş cavab");
    } else if (task === "scoring") {
      const result = await scoreCall(rubric, transcript);
      if (result.scores.length !== rubric.length || !result.scores.every((score) => score.evidence && score.reason)) throw new Error("Natamam hesabat");
    } else {
      const draft = await draftScenario({ standard: "§1 Bankın adı və operatorun adı ilə salamlaş, kömək təklif et. §2 Şəxsiyyəti yoxlamadan kart əməliyyatı etmə. §3 Müştərinin narahatlığını qəbul et. §4 Düzgün həll və dəqiq müddət ver. §5 Sakit və nəzakətli danış.", department: "Kart xidmətləri", language: "az", customerType: "Tələsən müştəri", difficulty: "medium" });
      if (!draft.meta.hidden_fact || !draft.meta.trap || !draft.meta.correct_path) throw new Error("Ssenari metadatası natamamdır");
    }
    console.log(JSON.stringify({ task, model: modelName(task), success: true, elapsedMs: Date.now() - started }));
  } catch (error) {
    failed = true;
    const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : null;
    console.log(JSON.stringify({ task, model: modelName(task), success: false, status, elapsedMs: Date.now() - started }));
  }
}
process.exitCode = failed ? 1 : 0;
