import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Criterion, Line } from "@/lib/types";

// Model çağırışı mock-lanır: testlər modelin cavabına serverin necə reaksiya verdiyini yoxlayır.
const complete = vi.fn();
vi.mock("@/server/llm", () => ({ complete: (...a: unknown[]) => complete(...a) }));

const { scoreCall, customerReply, draftScenario, normalizeScenario, ScenarioValidationError } = await import("@/server/ai");

const rubric: Criterion[] = [1, 2, 3, 4, 5, 6].map((id) => ({
  id,
  name: `Meyar ${id}`,
  levels: { "0": "yox", "1": "qismən", "2": "tam" },
}));

const transcript: Line[] = [
  { role: "operator", text: "NovaBank, Aysel, necə kömək edə bilərəm?", t: 0 },
  { role: "customer", text: "Kartım bloklanıb.", t: 4 },
  { role: "operator", text: "Doğum tarixinizi deyin, zəhmət olmasa.", t: 9 },
  { role: "customer", text: "14 mart 1995.", t: 13 },
];

const fullScores = (score = 2) =>
  rubric.map((c) => ({ criterion: c.id, score, evidence: "[00:00] NovaBank, Aysel", reason: "ok" }));

// Blok gövdəsi qəsdəndir: beforeEach-dən qaytarılan funksiya vitest-də cleanup kimi çağırılır.
beforeEach(() => {
  complete.mockReset();
});

describe("scoreCall — modelə tam etibar edilmir", () => {
  it("düzgün cavabda cəmi serverdə hesablayır, etibarlılıq yüksək", async () => {
    complete.mockResolvedValue(
      JSON.stringify({
        scores: fullScores(2).map((s, i) => ({ ...s, score: i % 3 })), // 0,1,2,0,1,2
        strengths: ["Salamlaşdı"],
        improvements: ["Müddət desin"],
        training_recommendation: "Empatiya",
        confidence: "high",
        confidence_reason: null,
        total: 999, // modelin cəminə baxılmır
      })
    );
    const r = await scoreCall(rubric, transcript);
    expect(r.total).toBe(6);
    expect(r.max_total).toBe(12);
    expect(r.confidence).toBe("high");
    expect(r.confidence_reason).toBeNull();
    expect(r.scores.map((s) => s.criterion_name)).toEqual(rubric.map((c) => c.name));
    expect(r.strengths).toEqual(["Salamlaşdı"]);
  });

  it("```json bloku və əlavə mətn olsa da JSON-u çıxarır", async () => {
    complete.mockResolvedValue("Budur:\n```json\n" + JSON.stringify({ scores: fullScores(1), confidence: "high" }) + "\n```");
    const r = await scoreCall(rubric, transcript);
    expect(r.total).toBe(6);
  });

  it("aralıqdan kənar və qeyri-rəqəm balları 0–2-yə salır", async () => {
    const scores = fullScores(2);
    scores[0].score = 5;
    scores[1].score = -3;
    (scores[2] as { score: unknown }).score = "iki";
    scores[3].score = 1.6;
    complete.mockResolvedValue(JSON.stringify({ scores, confidence: "high" }));
    const r = await scoreCall(rubric, transcript);
    expect(r.scores.map((s) => s.score)).toEqual([2, 0, 0, 2, 2, 2]);
  });

  it("çatışmayan meyar → 0 bal, etibarlılıq aşağı, səbəb meyarın adı ilə", async () => {
    complete.mockResolvedValue(JSON.stringify({ scores: fullScores(2).slice(0, 5), confidence: "high" }));
    const r = await scoreCall(rubric, transcript);
    expect(r.scores[5]).toMatchObject({ score: 0, evidence: "Sübut yoxdur" });
    expect(r.confidence).toBe("low");
    expect(r.confidence_reason).toContain("Meyar 6");
  });

  it("modelin öz 'low' səbəbini saxlayır", async () => {
    complete.mockResolvedValue(
      JSON.stringify({ scores: fullScores(), confidence: "low", confidence_reason: "01:12-də transkript aydın deyil" })
    );
    const r = await scoreCall(rubric, transcript);
    expect(r.confidence).toBe("low");
    expect(r.confidence_reason).toBe("01:12-də transkript aydın deyil");
  });

  it("operatorun 2-dən az replikası → etibarlılıq aşağı", async () => {
    complete.mockResolvedValue(JSON.stringify({ scores: fullScores(), confidence: "high" }));
    const r = await scoreCall(rubric, transcript.slice(0, 2));
    expect(r.confidence).toBe("low");
    expect(r.confidence_reason).toContain("2-dən az");
  });

  it("JSON olmayan cavabda aydın xəta atır (ekran donmasın)", async () => {
    complete.mockResolvedValue("Bağışlayın, qiymətləndirə bilmirəm.");
    await expect(scoreCall(rubric, transcript)).rejects.toThrow(/^Model qiymətləndirməni/);
  });

  it("scores massiv deyilsə hamısı 0 + aşağı etibarlılıq", async () => {
    complete.mockResolvedValue(JSON.stringify({ scores: "yoxdur", confidence: "high" }));
    const r = await scoreCall(rubric, transcript);
    expect(r.total).toBe(0);
    expect(r.confidence).toBe("low");
  });

  it("modelə vaxtlı transkript və meyarlar göndərilir, JSON rejimi ilə", async () => {
    complete.mockResolvedValue(JSON.stringify({ scores: fullScores() }));
    await scoreCall(rubric, transcript);
    const arg = complete.mock.calls[0][0];
    expect(arg.json).toBe(true);
    expect(arg.messages[0].content).toContain("[00:09] OPERATOR: Doğum tarixinizi deyin");
    expect(arg.messages[0].content).toContain("6. Meyar 6");
  });
});

describe("customerReply", () => {
  it("ardıcıl eyni rollu replikaları birləşdirir və cavabı təmizləyir", async () => {
    complete.mockResolvedValue("  Salam, kartım bloklanıb.  ");
    const text = await customerReply("Sən Leylasan.", [
      { role: "operator", text: "Salam", t: 0 },
      { role: "operator", text: "Eşidirsiniz?", t: 3 },
    ]);
    expect(text).toBe("Salam, kartım bloklanıb.");
    const arg = complete.mock.calls[0][0];
    expect(arg.messages).toEqual([{ role: "user", content: "Salam\nEşidirsiniz?" }]);
    expect(arg.system).toContain("Sən Leylasan.");
  });
});

describe("normalizeScenario — server yoxlaması (ekran 5)", () => {
  const rubric4 = [1, 2, 3, 4].map((i) => ({
    name: `M${i}`,
    levels: { "0": "a", "1": "b", "2": "c" },
    source: `§${i}`,
  }));
  const persona = "Sən NovaBank müştərisisən. Kartın bloklanıb, tələsirsən, amma təhqir etmirsən. Qısa danış.";

  it("düzgün qaralamanı qəbul edir, id-ləri 1..n edir, məcburi qaydaları əlavə edir", () => {
    const s = normalizeScenario({ title: " Test ", summary: "x", persona_prompt: persona, rubric: rubric4 });
    expect(s.title).toBe("Test");
    expect(s.rubric.map((c) => c.id)).toEqual([1, 2, 3, 4]);
    expect(s.persona_prompt).toMatch(/AI olduğunu demə/);
    expect(s.persona_prompt).toMatch(/Azərbaycan dilində danış/);
    expect(s.persona_prompt).toMatch(/ilk sözünü gözlə/);
  });

  it("qaydalar artıq varsa təkrar əlavə etmir", () => {
    const p = persona + " AI olduğunu demə. Yalnız Azərbaycan dilində danış. Operatorun ilk sözünü gözlə.";
    const s = normalizeScenario({ title: "T", summary: "", persona_prompt: p, rubric: rubric4 });
    expect(s.persona_prompt).toBe(p);
  });

  it("source boşdursa 'ümumi' yazır", () => {
    const r = rubric4.map((c) => ({ ...c, source: "" }));
    expect(normalizeScenario({ title: "T", summary: "", persona_prompt: persona, rubric: r }).rubric[0].source).toBe("ümumi");
  });

  it.each([
    ["2 meyar", { rubric: rubric4.slice(0, 2) }, /3–8/],
    ["9 meyar", { rubric: [...rubric4, ...rubric4, rubric4[0]] }, /3–8/],
    ["boş səviyyə", { rubric: [{ ...rubric4[0], levels: { "0": "a", "1": "", "2": "c" } }, ...rubric4.slice(1)] }, /1-ci meyar/],
    ["boş ad", { title: "  " }, /adı boşdur/],
    ["qısa persona", { persona_prompt: "Sən müştərisən." }, /çox qısadır/],
    ["rubric yoxdur", { rubric: undefined }, /3–8/],
  ])("rədd edir: %s", (_n, patch, msg) => {
    const base = { title: "T", summary: "", persona_prompt: persona, rubric: rubric4 as unknown };
    expect(() => normalizeScenario({ ...base, ...patch })).toThrow(ScenarioValidationError);
    expect(() => normalizeScenario({ ...base, ...patch })).toThrow(msg);
  });
});

describe("draftScenario", () => {
  it("model cavabını ScenarioDraft-a çevirir, meta-ya giriş parametrlərini yazır", async () => {
    complete.mockResolvedValue(
      JSON.stringify({
        title: "Gecikən köçürmə",
        summary: "Müştərinin köçürməsi 3 gündür çatmayıb.",
        customer_name: "Rauf Ə.",
        hidden_fact: "SWIFT yoxlamasında saxlanılıb",
        trap: "Dəqiq tarix tələb edir",
        correct_path: "Yoxlama → status → dəqiq müddət",
        persona_prompt: "Sən Rauf Əliyevsən, köçürmən gecikib, narazısan. Yalnız soruşulanda məlumat ver. Qısa danış.",
        rubric: [1, 2, 3].map((i) => ({ id: 9, name: `K${i}`, levels: { "0": "a", "1": "b", "2": "c" }, source: `§${i}` })),
      })
    );
    const d = await draftScenario({
      standard: "1. Salamlaş. 2. Yoxla. 3. Dəqiq müddət de.",
      department: "Köçürmələr",
      language: "az",
      customerType: "Narazı",
      difficulty: "high",
    });
    expect(d.title).toBe("Gecikən köçürmə");
    expect(d.rubric.map((c) => c.id)).toEqual([1, 2, 3]);
    expect(d.meta).toMatchObject({ customer_name: "Rauf Ə.", difficulty: "high", customer_type: "Narazı", language: "az" });
    expect(d.meta.standard).toContain("Dəqiq müddət");
    expect(complete.mock.calls[0][0].messages[0].content).toContain("Çətinlik: yüksək");
  });

  it("modelin pis qaralamasını validasiya xətası ilə rədd edir", async () => {
    complete.mockResolvedValue(JSON.stringify({ title: "X", persona_prompt: "qısa", rubric: [] }));
    await expect(
      draftScenario({ standard: "x".repeat(40), department: "D", language: "az", customerType: "T", difficulty: "low" })
    ).rejects.toBeInstanceOf(ScenarioValidationError);
  });
});
