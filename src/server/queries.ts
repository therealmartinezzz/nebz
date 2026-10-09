import "server-only";
import { db } from "./db";
import type {
  AgreementMetrics,
  CallListItem,
  CallReport,
  CallRow,
  CriterionAvg,
  DashboardStats,
  Line,
  OperatorProfile,
  Review,
  ReviewItem,
  ScenarioCard,
  Score,
  ScoreRow,
  ScoreWithReviews,
  TrainingView,
} from "@/lib/types";

// Səhifələrin (server komponentlərinin) data oxuduğu yeganə yer.
// Frontend bazaya birbaşa getmir, yalnız bu funksiyaları çağırır. Müqavilə: docs/api.md.
// Demo həcmi kiçikdir (yüzlərlə zəng), ona görə aqreqasiya JS-də edilir — sadə və yoxlanıla bilən.

const SCENARIO_COLS = "id,title,department,summary,rubric,meta";
const CALL_COLS =
  "id, scenario_id, operator_name, mode, transcript, duration_sec, status, scoring_error, total, max_total, strengths, improvements, training_recommendation, confidence, confidence_reason, model, scoring_ms, created_at, scenarios(title, department)";
const MAX_CALLS = 500;

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ---------------------------------------------------------------------------
// Bal + etiraz/rəhbər qeydləri
// ---------------------------------------------------------------------------

type ScoreJoined = ScoreRow & { reviews: Review[] | null };

function withReviews(s: ScoreJoined): ScoreWithReviews {
  const reviews = [...(s.reviews ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const lastManager = [...reviews].reverse().find((r) => r.kind === "manager" && r.new_score !== null);
  const lastDispute = [...reviews].reverse().find((r) => r.kind === "dispute");
  const manager_score = (lastManager?.new_score ?? null) as Score | null;
  const { reviews: _omit, ...row } = s;
  return {
    ...row,
    reviews,
    manager_score,
    final_score: manager_score ?? s.score,
    // Etiraz rəhbər qərarından sonra gəlibsə (və ya qərar yoxdursa) — açıqdır.
    disputed: !!lastDispute && (!lastManager || lastManager.created_at < lastDispute.created_at),
  };
}

async function scoresFor(callIds: string[]): Promise<Map<string, ScoreWithReviews[]>> {
  const map = new Map<string, ScoreWithReviews[]>();
  if (!callIds.length) return map;
  const rows = must(
    await db().from("scores").select("*, reviews(*)").in("call_id", callIds).order("criterion")
  ) as ScoreJoined[];
  for (const r of rows) {
    const list = map.get(r.call_id) ?? [];
    list.push(withReviews(r));
    map.set(r.call_id, list);
  }
  return map;
}

const finalTotal = <F extends number | null>(scores: ScoreWithReviews[] | undefined, fallback: F) =>
  scores?.length ? scores.reduce((a, s) => a + s.final_score, 0) : fallback;

type ListItem = CallListItem & { final_total: number | null };
/** Qiymətləndirilmiş zəng: ballar var. Ortalamalar yalnız bunlardan hesablanır. */
type ScoredCall = CallRow & { total: number; max_total: number };
const isScored = (c: CallRow): c is ScoredCall => c.status === "scored" && c.total !== null && c.max_total !== null;

function toListItem(c: CallRow, scores: ScoreWithReviews[] | undefined): ListItem {
  return {
    id: c.id,
    operator_name: c.operator_name,
    total: c.total,
    max_total: c.max_total,
    confidence: c.confidence,
    duration_sec: c.duration_sec,
    created_at: c.created_at,
    mode: c.mode,
    status: c.status,
    scenarios: c.scenarios,
    final_total: isScored(c) ? finalTotal(scores, c.total) : null,
  };
}

async function loadCalls(filter?: { operator?: string }) {
  let q = db().from("calls").select(CALL_COLS).order("created_at", { ascending: false }).limit(MAX_CALLS);
  if (filter?.operator) q = q.eq("operator_name", filter.operator);
  const calls = must(await q) as unknown as CallRow[];
  const scores = await scoresFor(calls.map((c) => c.id));
  return { calls, scored: calls.filter(isScored), scores };
}

function criterionAverages(lists: ScoreWithReviews[][]): CriterionAvg[] {
  // Fərqli ssenarilərdə meyar nömrələri fərqli məna daşıya bilər — adla qruplaşdırırıq.
  const acc = new Map<string, { criterion: number; sum: number; count: number }>();
  for (const s of lists.flat()) {
    const a = acc.get(s.criterion_name) ?? { criterion: s.criterion, sum: 0, count: 0 };
    a.sum += s.final_score;
    a.count += 1;
    acc.set(s.criterion_name, a);
  }
  return [...acc.entries()]
    .map(([name, a]) => ({ criterion: a.criterion, name, avg: round1(a.sum / a.count), count: a.count }))
    .sort((x, y) => x.avg - y.avg);
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

function modeOf(xs: number[]): number | null {
  if (!xs.length) return null;
  const counts = new Map<number, number>();
  xs.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// ---------------------------------------------------------------------------
// Ekran 1, 2 · Ssenarilər
// ---------------------------------------------------------------------------

export async function listScenarios(): Promise<ScenarioCard[]> {
  return must(await db().from("scenarios").select(SCENARIO_COLS).order("created_at")) as ScenarioCard[];
}

/** Zəng ekranı üçün: ssenari adı, müştəri adı (meta.customer_name). Tapılmasa null. */
export async function getScenario(id: string): Promise<ScenarioCard | null> {
  const { data } = await db().from("scenarios").select(SCENARIO_COLS).eq("id", id).maybeSingle();
  return (data as ScenarioCard | null) ?? null;
}

// ---------------------------------------------------------------------------
// Ekran 3 · Hesabat
// ---------------------------------------------------------------------------

export async function getCallReport(id: string): Promise<CallReport | null> {
  const { data } = await db().from("calls").select(CALL_COLS).eq("id", id).maybeSingle();
  if (!data) return null;
  const call = data as unknown as CallRow;
  const scores = (await scoresFor([id])).get(id) ?? [];
  return {
    call,
    scores,
    final_total: finalTotal(scores, call.total),
    reviewed: scores.some((s) => s.manager_score !== null),
  };
}

export async function listCalls(limit = 100): Promise<ListItem[]> {
  const { calls, scores } = await loadCalls();
  return calls.slice(0, limit).map((c) => toListItem(c, scores.get(c.id)));
}

// ---------------------------------------------------------------------------
// Ekran 7 · Rəhbər yoxlaması
// ---------------------------------------------------------------------------

function excerptAround(transcript: Line[], evidence: string): Line[] {
  const m = evidence.match(/\[?(\d{1,2}):(\d{2})\]?/);
  if (!m) return transcript.slice(0, 4);
  const t = Number(m[1]) * 60 + Number(m[2]);
  const idx = transcript.findIndex((l) => l.t >= t - 1);
  const center = idx === -1 ? transcript.length - 1 : idx;
  return transcript.slice(Math.max(0, center - 2), center + 2);
}

function buildQueue(calls: CallRow[], scores: Map<string, ScoreWithReviews[]>): ReviewItem[] {
  const items: (ReviewItem & { sortAt: string })[] = [];
  for (const c of calls) {
    const list = scores.get(c.id) ?? [];
    const callInfo = {
      id: c.id,
      operator_name: c.operator_name,
      created_at: c.created_at,
      scenario_title: c.scenarios?.title ?? "",
      department: c.scenarios?.department ?? "",
      confidence_reason: c.confidence_reason,
    };
    for (const s of list.filter((x) => x.disputed)) {
      const dispute = [...s.reviews].reverse().find((r) => r.kind === "dispute")!;
      items.push({
        key: `dispute:${dispute.id}`,
        reason: "dispute",
        reason_text: `${c.scenarios?.title ?? "Zəng"} · ${s.criterion_name}: ${s.score}/2`,
        call: callInfo,
        score: s,
        scores: [s],
        dispute,
        transcript_excerpt: excerptAround(c.transcript ?? [], s.evidence),
        transcript: c.transcript ?? [],
        sortAt: dispute.created_at,
      });
    }
    // Aşağı etibarlılıq: bütün meyarlara rəhbər qərarı verilənə qədər növbədə qalır.
    if (c.confidence === "low" && list.some((s) => s.manager_score === null)) {
      items.push({
        key: `low:${c.id}`,
        reason: "low_confidence",
        reason_text: c.confidence_reason || "AI əmin deyil",
        call: callInfo,
        score: null,
        scores: list,
        dispute: null,
        transcript_excerpt: c.transcript ?? [],
        transcript: c.transcript ?? [],
        sortAt: c.created_at,
      });
    }
  }
  return items
    .sort((a, b) => b.sortAt.localeCompare(a.sortAt))
    .map(({ sortAt: _s, ...item }) => item);
}

export async function getReviewQueue(): Promise<ReviewItem[]> {
  const { scored, scores } = await loadCalls();
  return buildQueue(scored, scores);
}

// ---------------------------------------------------------------------------
// Ekran 4 · Şirkət paneli (yalnız real data — nümunə rəqəm yoxdur)
// ---------------------------------------------------------------------------

export async function getDashboard(): Promise<DashboardStats> {
  const { calls, scored, scores } = await loadCalls();
  const items = calls.map((c) => toListItem(c, scores.get(c.id)));
  const totals = scored.map((c) => finalTotal(scores.get(c.id), c.total));

  const byDept = new Map<string, number[]>();
  scored.forEach((c, i) => {
    const d = c.scenarios?.department ?? "—";
    byDept.set(d, [...(byDept.get(d) ?? []), totals[i]]);
  });

  return {
    call_count: scored.length,
    avg_total: avg(totals),
    max_total: modeOf(scored.map((c) => c.max_total)),
    low_confidence_count: scored.filter((c) => c.confidence === "low").length,
    open_review_count: buildQueue(scored, scores).length,
    by_criterion: criterionAverages(scored.map((c) => scores.get(c.id) ?? [])),
    by_department: [...byDept.entries()]
      .map(([department, totals]) => ({ department, avg_total: avg(totals)!, call_count: totals.length }))
      .sort((a, b) => b.call_count - a.call_count),
    recent: items.slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Ekran 6 · Operator profili
// ---------------------------------------------------------------------------

export async function listOperators(): Promise<{ name: string; call_count: number }[]> {
  const rows = must(await db().from("calls").select("operator_name").limit(MAX_CALLS * 4)) as {
    operator_name: string;
  }[];
  const counts = new Map<string, number>();
  rows.forEach((r) => counts.set(r.operator_name, (counts.get(r.operator_name) ?? 0) + 1));
  return [...counts.entries()].map(([name, call_count]) => ({ name, call_count })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getOperatorProfile(name: string): Promise<OperatorProfile | null> {
  const { calls, scored, scores } = await loadCalls({ operator: name });
  if (!calls.length) return null;
  const items = calls.map((c) => {
    const list = scores.get(c.id) ?? [];
    const review_status: OperatorProfile["calls"][number]["review_status"] = !isScored(c)
      ? "unscored"
      : list.some((s) => s.disputed)
        ? "disputed"
        : list.some((s) => s.manager_score !== null)
          ? "reviewed"
          : "ai";
    return { ...toListItem(c, list), review_status };
  });
  return {
    name,
    call_count: scored.length,
    avg_total: avg(scored.map((c) => finalTotal(scores.get(c.id), c.total))),
    max_total: modeOf(scored.map((c) => c.max_total)),
    by_criterion: criterionAverages(scored.map((c) => scores.get(c.id) ?? [])),
    calls: items,
    recommendations: calls
      .filter((c) => c.training_recommendation)
      .map((c) => ({ call_id: c.id, created_at: c.created_at, text: c.training_recommendation! })),
  };
}

// ---------------------------------------------------------------------------
// Ekran 8 · Məşqlərim
// ---------------------------------------------------------------------------

export async function getMyTraining(name: string): Promise<TrainingView> {
  const [{ calls, scored, scores }, scenarios] = await Promise.all([loadCalls({ operator: name }), listScenarios()]);
  const history = calls.map((c) => toListItem(c, scores.get(c.id)));
  const lastCall = scored[0] ?? null; // rəy yalnız qiymətləndirilmiş zəngdən

  // Tövsiyə: əvvəlcə hələ edilməmiş ssenari; hamısı edilibsə — faizlə ən zəif nəticəli ssenari.
  const done = new Set(calls.map((c) => c.scenario_id));
  let recommended = scenarios.find((s) => !done.has(s.id)) ?? null;
  if (!recommended && scored.length) {
    const worst = [...scored].sort(
      (a, b) =>
        finalTotal(scores.get(a.id), a.total) / (a.max_total || 1) -
        finalTotal(scores.get(b.id), b.total) / (b.max_total || 1)
    )[0];
    recommended = scenarios.find((s) => s.id === worst.scenario_id) ?? null;
  }

  return {
    name,
    last: lastCall,
    recommended_scenario: recommended,
    recommendation_text: lastCall?.training_recommendation ?? null,
    history,
  };
}

// ---------------------------------------------------------------------------
// Keyfiyyət testi · AI ilə rəhbər uyğunluğu
// ---------------------------------------------------------------------------

export async function getAgreementMetrics(): Promise<AgreementMetrics> {
  const { scored: calls, scores } = await loadCalls();
  const pairs = calls.flatMap((c) => (scores.get(c.id) ?? []).filter((s) => s.manager_score !== null));
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null);

  const byCrit = new Map<string, { criterion: number; n: number; exact: number }>();
  for (const s of pairs) {
    const a = byCrit.get(s.criterion_name) ?? { criterion: s.criterion, n: 0, exact: 0 };
    a.n += 1;
    if (s.score === s.manager_score) a.exact += 1;
    byCrit.set(s.criterion_name, a);
  }

  const reviewedCalls = calls.filter((c) => (scores.get(c.id) ?? []).some((s) => s.manager_score !== null));
  const timed = calls.map((c) => c.scoring_ms).filter((x): x is number => typeof x === "number");

  return {
    pairs: pairs.length,
    exact_pct: pct(pairs.filter((s) => s.score === s.manager_score).length, pairs.length),
    within1_pct: pct(pairs.filter((s) => Math.abs(s.score - (s.manager_score as number)) <= 1).length, pairs.length),
    mean_abs_diff_total: avg(reviewedCalls.map((c) => Math.abs(c.total - finalTotal(scores.get(c.id), c.total)))),
    by_criterion: [...byCrit.entries()].map(([name, a]) => ({
      criterion: a.criterion,
      name,
      pairs: a.n,
      exact_pct: pct(a.exact, a.n)!,
    })),
    avg_scoring_ms: timed.length ? Math.round(timed.reduce((a, b) => a + b, 0) / timed.length) : null,
    scored_calls: calls.length,
  };
}

/** Keyfiyyət testi üçün: hər zəng × meyar bir sətir (docs/test-results-template.csv ilə uyğun sahələr). */
export async function exportScoreRows() {
  const { calls, scores } = await loadCalls();
  return calls.flatMap((c) =>
    (scores.get(c.id) ?? []).map((s) => ({
      call_id: c.id,
      created_at: c.created_at,
      operator: c.operator_name,
      scenario: c.scenarios?.title ?? "",
      mode: c.mode,
      criterion: `${s.criterion} ${s.criterion_name}`,
      ai_score: s.score,
      manager_score: s.manager_score ?? "",
      match: s.manager_score === null ? "" : s.score === s.manager_score ? "1" : "0",
      disputed: s.disputed ? "1" : "0",
      confidence: c.confidence,
      confidence_reason: c.confidence_reason ?? "",
      model: c.model ?? "",
      scoring_ms: c.scoring_ms ?? "",
      evidence: s.evidence,
    }))
  );
}
