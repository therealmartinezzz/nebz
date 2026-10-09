// Real Supabase bazası + mock model ilə bütün backend axını.
// İşə salma: npm run test:integration  (.env.local lazımdır; yaratdığı datanı sonda silir)
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { CallReport, Line, ScenarioCard } from "@/lib/types";

const complete = vi.fn();
vi.mock("@/server/llm", async (orig) => ({
  ...(await orig<typeof import("@/server/llm")>()),
  complete: (...a: unknown[]) => complete(...a),
}));

const hasDb = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const OP = `TEST-${Date.now()}`;
const MISSING = "00000000-0000-4000-8000-000000000000";

const { db } = await import("@/server/db");
const q = await import("@/server/queries");
const calls = await import("@/app/api/calls/route");
const reviews = await import("@/app/api/reviews/route");
const reply = await import("@/app/api/customer-reply/route");
const realtime = await import("@/app/api/realtime-session/route");
const draft = await import("@/app/api/scenarios/draft/route");
const scenarios = await import("@/app/api/scenarios/route");
const metrics = await import("@/app/api/metrics/route");
const exporter = await import("@/app/api/export/route");

const post = (body: unknown) =>
  new Request("http://test/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const postRaw = (raw: string) => new Request("http://test/api", { method: "POST", body: raw });
async function json(res: Response) {
  return { status: res.status, body: await res.json() };
}

const transcript: Line[] = [
  { role: "operator", text: "NovaBank, Aysel, necə kömək edə bilərəm?", t: 0 },
  { role: "customer", text: "Kartım İstanbulda bloklanıb, tələsirəm!", t: 5 },
  { role: "operator", text: "Narahatlığa görə üzr istəyirəm. Doğum tarixinizi deyin.", t: 21 },
  { role: "customer", text: "Tələsirəm, bu sualları keçək, sadəcə kartı açın.", t: 30 },
  { role: "operator", text: "Təəssüf ki, yoxlamasız aça bilmərəm.", t: 64 },
  { role: "customer", text: "Yaxşı, 14 mart 1995.", t: 70 },
];

let scenario: ScenarioCard;
const createdScenarioIds: string[] = [];

function scoring(scores: number[], extra: Record<string, unknown> = {}) {
  return JSON.stringify({
    scores: scores.map((score, i) => ({
      criterion: i + 1,
      score,
      evidence: i === 3 ? "[01:04] Təəssüf ki, yoxlamasız aça bilmərəm." : "[00:00] NovaBank, Aysel",
      reason: "test",
    })),
    strengths: ["Yoxlamanı təzyiqə baxmayaraq apardı"],
    improvements: ["Dəqiq müddət desin"],
    training_recommendation: "Təkrar zəng edən müştəri",
    confidence: "high",
    confidence_reason: null,
    ...extra,
  });
}

async function report(id: string) {
  const r = await q.getCallReport(id);
  expect(r).not.toBeNull();
  return r as CallReport;
}

describe.skipIf(!hasDb)("backend axını (real baza, mock model)", () => {
  let call1: string; // yaxşı zəng, 4-cü meyar = 0 → etiraz → rəhbər 2 edir
  let call2: string; // aşağı etibarlılıq → rəhbər bütün meyarları yoxlayır

  beforeAll(async () => {
    const list = await q.listScenarios();
    scenario = list.find((s) => s.title === "Bloklanmış kart")!;
    expect(scenario, "demo ssenarisi bazada olmalıdır").toBeTruthy();
  });

  // Blok gövdəsi qəsdəndir: beforeEach-dən qaytarılan funksiya vitest-də cleanup kimi çağırılır.
  beforeEach(() => {
    complete.mockReset();
  });

  afterAll(async () => {
    if (!hasDb) return;
    await db().from("calls").delete().eq("operator_name", OP); // scores, reviews cascade
    if (createdScenarioIds.length) await db().from("scenarios").delete().in("id", createdScenarioIds);
  });

  // ---------------------------------------------------------------- ssenari
  it("demo ssenarisinin meta-sı 0002 miqrasiyası ilə doldurulub", async () => {
    const s = await q.getScenario(scenario.id);
    expect(s?.meta.customer_name).toBe("Leyla M.");
    expect(s?.rubric).toHaveLength(6);
    expect(await q.getScenario(MISSING)).toBeNull();
  });

  // ---------------------------------------------------------------- /api/calls
  describe("POST /api/calls", () => {
    it("pis sorğuları rədd edir", async () => {
      expect((await json(await calls.POST(postRaw("{bu json deyil")))).status).toBe(400);
      expect((await json(await calls.POST(post({ scenarioId: "abc", transcript })))).status).toBe(400);
      const short = await json(await calls.POST(post({ scenarioId: scenario.id, transcript: transcript.slice(0, 1) })));
      expect(short.status).toBe(400);
      expect(short.body.error).toMatch(/qısadır/);
      const missing = await json(await calls.POST(post({ scenarioId: MISSING, transcript, operatorName: OP })));
      expect(missing.status).toBe(404);
      expect(complete).not.toHaveBeenCalled();
    });

    it("zəngi qiymətləndirir və bazaya yazır (model, vaxt, ballar)", async () => {
      complete.mockResolvedValue(scoring([2, 2, 2, 0, 2, 2]));
      const r = await json(
        await calls.POST(post({ scenarioId: scenario.id, operatorName: ` ${OP} `, mode: "text", transcript, durationSec: 71.6 }))
      );
      expect(r.status).toBe(200);
      call1 = r.body.id;

      const rep = await report(call1);
      expect(rep.call).toMatchObject({ operator_name: OP, mode: "text", total: 10, max_total: 12, duration_sec: 72, confidence: "high" });
      expect(rep.call.model).toMatch(/^(claude|gemini):/);
      expect(typeof rep.call.scoring_ms).toBe("number");
      expect(rep.call.scenarios?.title).toBe("Bloklanmış kart");
      expect(rep.scores).toHaveLength(6);
      expect(rep.scores.map((s) => s.criterion)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(rep).toMatchObject({ final_total: 10, reviewed: false });
      expect(rep.scores[3]).toMatchObject({ score: 0, manager_score: null, final_score: 0, disputed: false, reviews: [] });
      expect(rep.call.transcript).toHaveLength(6);
    });

    it("boş replikaları və yanlış rolları transkriptdən çıxarır", async () => {
      complete.mockResolvedValue(scoring([1, 1, 1, 1, 1, 1], { confidence: "low", confidence_reason: "01:12-də aydın deyil" }));
      const dirty = [...transcript, { role: "operator", text: "   ", t: 80 }, { role: "system", text: "hack", t: 81 }];
      const r = await json(await calls.POST(post({ scenarioId: scenario.id, operatorName: OP, mode: "voice", transcript: dirty, durationSec: 90 })));
      expect(r.status).toBe(200);
      call2 = r.body.id;
      const rep = await report(call2);
      expect(rep.call.transcript).toHaveLength(6);
      expect(rep.call).toMatchObject({ mode: "voice", confidence: "low", confidence_reason: "01:12-də aydın deyil" });
    });

    it("model pozuk cavab versə 502 + mesaj, bazaya heç nə yazılmır", async () => {
      const before = (await q.getOperatorProfile(OP))!.call_count;
      complete.mockResolvedValue("qiymətləndirə bilmirəm");
      const r = await json(await calls.POST(post({ scenarioId: scenario.id, operatorName: OP, mode: "text", transcript, durationSec: 10 })));
      expect(r.status).toBe(502);
      expect(r.body.error).toMatch(/^Model qiymətləndirməni/);

      complete.mockRejectedValue(new Error("network down"));
      const r2 = await json(await calls.POST(post({ scenarioId: scenario.id, operatorName: OP, mode: "text", transcript, durationSec: 10 })));
      expect(r2.status).toBe(502);
      expect(r2.body.error).toBe("Qiymətləndirmə alınmadı, yenidən cəhd edin");

      const { LlmConfigError } = await import("@/server/llm");
      complete.mockRejectedValue(new LlmConfigError("AI modeli qoşulmayıb: GEMINI_API_KEY təyin edilməyib"));
      const r3 = await json(await calls.POST(post({ scenarioId: scenario.id, operatorName: OP, mode: "text", transcript, durationSec: 10 })));
      expect(r3).toEqual({ status: 503, body: { error: "AI modeli qoşulmayıb: GEMINI_API_KEY təyin edilməyib" } });
      expect((await q.getOperatorProfile(OP))!.call_count).toBe(before);
    });
  });

  // ---------------------------------------------------------------- ekran 7 + 3
  describe("etiraz → növbə → rəhbər qərarı", () => {
    it("aşağı etibarlılıqlı zəng növbədədir (bütün meyarlar, tam transkript)", async () => {
      const item = (await q.getReviewQueue()).find((i) => i.key === `low:${call2}`);
      expect(item).toMatchObject({ reason: "low_confidence", reason_text: "01:12-də aydın deyil", dispute: null });
      expect(item!.scores).toHaveLength(6);
      expect(item!.transcript_excerpt).toHaveLength(6);
      expect(item!.call).toMatchObject({ operator_name: OP, scenario_title: "Bloklanmış kart", department: "Kart xidmətləri" });
    });

    it("yüksək etibarlılıqlı, etirazsız zəng növbədə yoxdur", async () => {
      expect((await q.getReviewQueue()).some((i) => i.call.id === call1)).toBe(false);
    });

    it("POST /api/reviews pis sorğuları rədd edir", async () => {
      const s4 = (await report(call1)).scores[3];
      const cases: [unknown, number][] = [
        [{ scoreId: s4.id, kind: "dispute", comment: "  " }, 400],
        [{ scoreId: s4.id, kind: "manager" }, 400],
        [{ scoreId: s4.id, kind: "manager", newScore: 3 }, 400],
        [{ scoreId: s4.id, kind: "manager", newScore: "2" }, 200], // rəqəm sətri qəbul olunur
        [{ scoreId: s4.id, kind: "admin", newScore: 1 }, 400],
        [{ scoreId: "x", kind: "manager", newScore: 1 }, 400],
        [{ scoreId: MISSING, kind: "manager", newScore: 1 }, 404],
      ];
      for (const [body, status] of cases) {
        expect((await json(await reviews.POST(post(body)))).status, JSON.stringify(body)).toBe(status);
      }
      expect((await json(await reviews.POST(postRaw("pis")))).status).toBe(400);
      // Yuxarıdakı "2" qəbul olundu — testin qalanı üçün təmiz vəziyyət: həmin rəyi silirik.
      await db().from("reviews").delete().eq("score_id", s4.id);
    });

    it("işçinin etirazı növbəyə düşür, sübut ətrafında fraqmentlə", async () => {
      const s4 = (await report(call1)).scores[3];
      const r = await json(
        await reviews.POST(post({ scoreId: s4.id, kind: "dispute", comment: "Müştəri yoxlamadan imtina etdi, qaydaya görə aça bilməzdim." }))
      );
      expect(r.status).toBe(200);

      const rep = await report(call1);
      expect(rep.scores[3]).toMatchObject({ disputed: true, manager_score: null, final_score: 0 });
      const item = (await q.getReviewQueue()).find((i) => i.reason === "dispute" && i.call.id === call1)!;
      expect(item.key).toBe(`dispute:${r.body.id}`);
      expect(item.scores).toHaveLength(1);
      expect(item.scores[0].id).toBe(s4.id);
      expect(item.dispute?.comment).toMatch(/imtina etdi/);
      expect(item.reason_text).toBe("Bloklanmış kart · Meyar adı yoxlanılır: 0/2".replace("Meyar adı yoxlanılır", s4.criterion_name));
      // Sübut [01:04] → həmin replika fraqmentdədir, tam transkript yox.
      expect(item.transcript_excerpt.length).toBeLessThanOrEqual(4);
      expect(item.transcript_excerpt.some((l) => l.t === 64)).toBe(true);

      const prof = await q.getOperatorProfile(OP);
      expect(prof!.calls.find((c) => c.id === call1)?.status).toBe("disputed");
    });

    it("rəhbər balı dəyişir → hesabatda AI: 0 → Rəhbər: 2, etiraz bağlanır", async () => {
      const s4 = (await report(call1)).scores[3];
      const r = await json(await reviews.POST(post({ scoreId: s4.id, kind: "manager", newScore: 2, comment: "Qaydaya uyğun hərəkət edib" })));
      expect(r.status).toBe(200);

      const rep = await report(call1);
      expect(rep.scores[3]).toMatchObject({ score: 0, manager_score: 2, final_score: 2, disputed: false });
      expect(rep.scores[3].reviews.map((x) => x.kind)).toEqual(["dispute", "manager"]);
      expect(rep).toMatchObject({ final_total: 12, reviewed: true });
      expect(rep.call.total).toBe(10); // AI cəmi dəyişmir
      expect((await q.getReviewQueue()).some((i) => i.call.id === call1)).toBe(false);
      expect((await q.getOperatorProfile(OP))!.calls.find((c) => c.id === call1)?.status).toBe("reviewed");
    });

    it("rəhbər qərarından SONRA yeni etiraz yenidən açılır", async () => {
      const s4 = (await report(call1)).scores[3];
      await reviews.POST(post({ scoreId: s4.id, kind: "dispute", comment: "Yenə razı deyiləm" }));
      expect((await report(call1)).scores[3].disputed).toBe(true);
      await reviews.POST(post({ scoreId: s4.id, kind: "manager", newScore: 2, comment: "Qərar qüvvədə" }));
      expect((await report(call1)).scores[3].disputed).toBe(false);
    });

    it("aşağı etibarlılıq: bütün meyarlara qərar verilənə qədər növbədə qalır", async () => {
      const rep = await report(call2);
      // AI balını saxla (1) — 5 meyar, 6-cı hələ yox
      for (const s of rep.scores.slice(0, 5)) await reviews.POST(post({ scoreId: s.id, kind: "manager", newScore: s.score }));
      expect((await q.getReviewQueue()).some((i) => i.key === `low:${call2}`)).toBe(true);
      await reviews.POST(post({ scoreId: rep.scores[5].id, kind: "manager", newScore: 0, comment: "Sərt danışıb" }));
      expect((await q.getReviewQueue()).some((i) => i.key === `low:${call2}`)).toBe(false);
      expect((await report(call2)).final_total).toBe(5);
    });
  });

  // ---------------------------------------------------------------- ekran 4, 6, 8
  describe("panel, profil, məşqlərim", () => {
    it("operator profili yalnız onun zənglərini final ballarla hesablayır", async () => {
      const p = (await q.getOperatorProfile(OP))!;
      expect(p.call_count).toBe(2);
      expect(p.avg_total).toBe(8.5); // (12 + 5) / 2
      expect(p.max_total).toBe(12);
      expect(p.calls.map((c) => c.id)).toEqual([call2, call1]); // ən yenisi birinci
      expect(p.calls.find((c) => c.id === call2)?.final_total).toBe(5);
      const avgs = p.by_criterion.map((c) => c.avg);
      expect(avgs).toEqual([...avgs].sort((a, b) => a - b)); // ən zəif birinci
      expect(p.by_criterion[0]).toMatchObject({ avg: 1, count: 2 }); // Davranış: (2+0)/2
      expect(p.recommendations).toHaveLength(2);
      expect(await q.getOperatorProfile(`${OP}-yoxdur`)).toBeNull();
    });

    it("operatorlar siyahısında var", async () => {
      expect((await q.listOperators()).find((o) => o.name === OP)?.call_count).toBe(2);
    });

    it("şirkət paneli real datadan, ən zəif meyar birinci", async () => {
      const d = await q.getDashboard();
      expect(d.call_count).toBeGreaterThanOrEqual(2);
      expect(d.avg_total).not.toBeNull();
      expect(d.low_confidence_count).toBeGreaterThanOrEqual(1);
      expect(d.recent.length).toBeLessThanOrEqual(10);
      expect(d.recent.map((c) => c.id)).toContain(call2);
      const avgs = d.by_criterion.map((c) => c.avg);
      expect(avgs).toEqual([...avgs].sort((a, b) => a - b));
      expect(d.by_department.find((x) => x.department === "Kart xidmətləri")).toBeTruthy();
    });

    it("məşqlərim: son hesabat, tövsiyə olunan ssenari, tarixçə", async () => {
      const t = await q.getMyTraining(OP);
      expect(t.last?.call.id).toBe(call2);
      expect(t.recommendation_text).toBe("Təkrar zəng edən müştəri");
      expect(t.history).toHaveLength(2);
      expect(t.recommended_scenario).not.toBeNull();

      const empty = await q.getMyTraining(`${OP}-yeni`);
      expect(empty).toMatchObject({ last: null, history: [], recommendation_text: null });
      expect(empty.recommended_scenario).not.toBeNull(); // yeni işçiyə ilk ssenari
    });

    it("listCalls final_total qaytarır", async () => {
      const c = (await q.listCalls()).find((x) => x.id === call1);
      expect(c).toMatchObject({ total: 10, final_total: 12, mode: "text" });
    });
  });

  // ---------------------------------------------------------------- keyfiyyət testi
  describe("metrikalar və eksport", () => {
    it("GET /api/metrics uyğunluğu hesablayır", async () => {
      const m = await (await metrics.GET()).json();
      expect(m.pairs).toBeGreaterThanOrEqual(7);
      expect(m.exact_pct).toBeGreaterThan(0);
      expect(m.exact_pct).toBeLessThan(100); // call1 4-cü meyar: AI 0 ≠ rəhbər 2
      expect(m.within1_pct).toBeGreaterThanOrEqual(m.exact_pct);
      expect(m.avg_scoring_ms).not.toBeNull();
      expect(m.by_criterion.length).toBeGreaterThan(0);
    });

    it("GET /api/export CSV qaytarır", async () => {
      const res = await exporter.GET();
      expect(res.headers.get("Content-Type")).toMatch(/text\/csv/);
      const text = await res.text();
      const lines = text.replace(/^﻿/, "").split("\n");
      expect(lines[0]).toContain("ai_score,manager_score,match");
      const mine = lines.filter((l) => l.includes(call1));
      expect(mine).toHaveLength(6);
      expect(mine.find((l) => l.includes("Problemin həlli"))).toMatch(/,0,2,0,/); // ai=0, rəhbər=2, uyğun deyil
    });
  });

  // ---------------------------------------------------------------- AI müştəri, səs
  describe("customer-reply və realtime-session", () => {
    it("AI müştəri cavab verir; boş/xəta → 502", async () => {
      complete.mockResolvedValue(" Salam, kartım bloklanıb! ");
      const ok = await json(await reply.POST(post({ scenarioId: scenario.id, transcript: transcript.slice(0, 1) })));
      expect(ok).toEqual({ status: 200, body: { text: "Salam, kartım bloklanıb!" } });
      expect(complete.mock.calls[0][0].system).toContain("Leyla");

      complete.mockResolvedValue("   ");
      expect((await json(await reply.POST(post({ scenarioId: scenario.id, transcript })))).status).toBe(502);
      complete.mockRejectedValue(new Error("x"));
      expect((await json(await reply.POST(post({ scenarioId: scenario.id, transcript })))).status).toBe(502);
      expect((await json(await reply.POST(post({ scenarioId: scenario.id, transcript: [] })))).status).toBe(400);
      expect((await json(await reply.POST(post({ scenarioId: MISSING, transcript })))).status).toBe(404);
    });

    it.skipIf(!!process.env.OPENAI_API_KEY)("səs açarı yoxdursa 503 + mətn rejimi mesajı", async () => {
      const r = await json(await realtime.POST(post({ scenarioId: scenario.id })));
      expect(r.status).toBe(503);
      expect(r.body.error).toMatch(/mətn rejimi/);
    });
  });

  // ---------------------------------------------------------------- ekran 5
  describe("ssenari yaradıcısı", () => {
    const standard = "1. Operator bankın adını və öz adını deyir.\n2. Köçürmə statusu yoxlanılır.\n3. Dəqiq müddət deyilir.";
    const modelDraft = {
      title: "Gecikən köçürmə (TEST)",
      summary: "Köçürmə 3 gündür çatmayıb.",
      customer_name: "Rauf Ə.",
      hidden_fact: "SWIFT yoxlaması",
      trap: "Dəqiq tarix tələb edir",
      correct_path: "Yoxlama → status → müddət",
      persona_prompt: "Sən Rauf Əliyevsən, köçürmən gecikib, narazısan. Yalnız soruşulanda məlumat ver. Hər dəfə 1–2 cümlə danış.",
      rubric: [1, 2, 3].map((i) => ({ id: i, name: `Meyar ${i}`, levels: { "0": "yox", "1": "qismən", "2": "tam" }, source: `§${i}` })),
    };

    it("draft: qısa standartı rədd edir, modeli çağırmır", async () => {
      const r = await json(await draft.POST(post({ standard: "qısa" })));
      expect(r.status).toBe(400);
      expect(complete).not.toHaveBeenCalled();
    });

    it("draft → redaktə → saxla → ekran 1-də görünür", async () => {
      complete.mockResolvedValue(JSON.stringify(modelDraft));
      const d = await json(
        await draft.POST(post({ standard, department: "Köçürmələr", language: "az", customerType: "Narazı", difficulty: "zor" }))
      );
      expect(d.status).toBe(200);
      expect(d.body.meta).toMatchObject({ customer_name: "Rauf Ə.", difficulty: "medium" }); // naməlum çətinlik → medium
      expect(d.body.rubric[0].source).toBe("§1");
      expect(d.body.persona_prompt).toMatch(/AI olduğunu demə/);

      const edited = { ...d.body, department: "Köçürmələr", rubric: [...d.body.rubric, { name: "Davranış", levels: { "0": "sərt", "1": "bir dəfə", "2": "sakit" } }] };
      const saved = await json(await scenarios.POST(post(edited)));
      expect(saved.status).toBe(200);
      createdScenarioIds.push(saved.body.id);

      const s = await q.getScenario(saved.body.id);
      expect(s).toMatchObject({ title: "Gecikən köçürmə (TEST)", department: "Köçürmələr" });
      expect(s!.rubric.map((c) => c.id)).toEqual([1, 2, 3, 4]);
      expect(s!.rubric[3].source).toBe("ümumi");
      expect(s!.meta.customer_name).toBe("Rauf Ə.");
      expect((await q.listScenarios()).some((x) => x.id === saved.body.id)).toBe(true);
    });

    it("yeni ssenari ilə zəng edilir və hesabat alınır (qəbul meyarı)", async () => {
      const id = createdScenarioIds[0];
      complete.mockResolvedValue(
        JSON.stringify({ scores: [1, 2, 3, 4].map((c) => ({ criterion: c, score: 2, evidence: "[00:00] x", reason: "r" })), confidence: "high" })
      );
      const r = await json(await calls.POST(post({ scenarioId: id, operatorName: OP, mode: "text", transcript, durationSec: 30 })));
      expect(r.status).toBe(200);
      const rep = await report(r.body.id);
      expect(rep.call).toMatchObject({ total: 8, max_total: 8 });
      expect(rep.scores.map((s) => s.criterion_name)).toEqual(["Meyar 1", "Meyar 2", "Meyar 3", "Davranış"]);
    });

    it("saxla: server yoxlaması pis qaralamanı rədd edir", async () => {
      const r1 = await json(await scenarios.POST(post({ ...modelDraft, rubric: modelDraft.rubric.slice(0, 2) })));
      expect(r1).toMatchObject({ status: 400, body: { error: expect.stringMatching(/3–8/) } });
      const r2 = await json(await scenarios.POST(post({ ...modelDraft, title: "" })));
      expect(r2.status).toBe(400);
    });

    it("draft: model pozuk qaralama versə 502", async () => {
      complete.mockResolvedValue(JSON.stringify({ ...modelDraft, rubric: [] }));
      const r = await json(await draft.POST(post({ standard })));
      expect(r.status).toBe(502);
      expect(r.body.error).toMatch(/natamamdır/);
    });
  });
});
