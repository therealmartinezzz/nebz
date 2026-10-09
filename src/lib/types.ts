// Frontend ↔ backend müqaviləsi. Dəyişiklikləri backend edir və docs/api.md-ni yeniləyir.

export type Score = 0 | 1 | 2;
export type Confidence = "high" | "low";
export type CallMode = "voice" | "text";

export type Criterion = {
  id: number;
  name: string;
  levels: Record<"0" | "1" | "2", string>;
  source?: string; // standartın bəndi ("§3"), ssenari yaradıcısında doldurulur
};

export type ScenarioMeta = {
  customer_name?: string; // zəng ekranında göstərilən ad, məs. "Leyla M."
  customer_type?: string;
  difficulty?: "low" | "medium" | "high";
  language?: "az";
  hidden_fact?: string;
  trap?: string;
  correct_path?: string;
  standard?: string; // ssenarinin yaradıldığı xidmət standartı mətni
};

export type Scenario = {
  id: string;
  title: string;
  department: string;
  summary: string | null;
  persona_prompt: string;
  rubric: Criterion[];
  meta: ScenarioMeta;
};

export type Line = { role: "operator" | "customer"; text: string; t: number };

export type CriterionScore = {
  criterion: number;
  criterion_name: string;
  score: Score;
  evidence: string;
  reason: string;
};

export type ScoreResult = {
  scores: CriterionScore[];
  total: number;
  max_total: number;
  strengths: string[];
  improvements: string[];
  training_recommendation: string;
  confidence: Confidence;
  confidence_reason: string | null;
};

// ---- Bazadan oxunan sətirlər (src/server/queries.ts qaytarır) ----

export type ScenarioCard = Pick<Scenario, "id" | "title" | "department" | "summary" | "rubric" | "meta">;

export type Review = {
  id: string;
  score_id: string;
  kind: "manager" | "dispute";
  new_score: Score | null;
  comment: string | null;
  created_at: string;
};

export type ScoreRow = CriterionScore & { id: string; call_id: string };

/** AI balı + ona bağlı etiraz/rəhbər qeydləri. final_score = son rəhbər balı, yoxdursa AI balı. */
export type ScoreWithReviews = ScoreRow & {
  reviews: Review[];
  manager_score: Score | null;
  final_score: Score;
  disputed: boolean; // cavablanmamış etiraz var
};

export type CallRow = {
  id: string;
  scenario_id: string;
  operator_name: string;
  mode: CallMode;
  transcript: Line[];
  duration_sec: number | null;
  total: number; // AI cəmi
  max_total: number;
  strengths: string[] | null;
  improvements: string[] | null;
  training_recommendation: string | null;
  confidence: Confidence;
  confidence_reason: string | null;
  model: string | null;
  scoring_ms: number | null;
  created_at: string;
  scenarios: { title: string; department: string } | null;
};

export type CallReport = {
  call: CallRow;
  scores: ScoreWithReviews[];
  final_total: number; // rəhbər düzəlişləri ilə cəm
  reviewed: boolean; // ən azı bir rəhbər qərarı var
};

export type CallListItem = Pick<
  CallRow,
  "id" | "operator_name" | "total" | "max_total" | "confidence" | "duration_sec" | "created_at" | "mode"
> & {
  scenarios: { title: string; department: string } | null;
  /** Backend həmişə doldurur; optional-dır ki, CallRow da CallListItem kimi istifadə oluna bilsin. */
  final_total?: number;
};

export type CriterionAvg = { criterion: number; name: string; avg: number; count: number };

// ---- Ekran 7 · Rəhbər yoxlaması ----

export type ReviewItem = {
  key: string; // siyahı açarı: "dispute:<reviewId>" və ya "low:<callId>"
  reason: "dispute" | "low_confidence";
  reason_text: string; // növbədə göstərilən qısa səbəb
  call: {
    id: string;
    operator_name: string;
    created_at: string;
    scenario_title: string;
    department: string;
    confidence_reason: string | null;
  };
  score: ScoreWithReviews | null; // dispute: etiraz olunan meyar; low_confidence: null (bütün zəng)
  scores: ScoreWithReviews[]; // dispute: [score]; low_confidence: bütün meyarlar
  dispute: Review | null;
  transcript_excerpt: Line[]; // dispute: sübut vaxtı ətrafı; low_confidence: tam transkript
  transcript: Line[]; // həmişə tam transkript
};

// ---- Ekran 4 · Şirkət paneli ----

export type DashboardStats = {
  call_count: number;
  avg_total: number | null; // final ballarla
  max_total: number | null; // ən çox rast gələn max_total (ssenarilər eyni meyar sayındadırsa, dəqiq)
  low_confidence_count: number;
  open_review_count: number;
  by_criterion: CriterionAvg[]; // avg artan sıra ilə — birinci = ən zəif
  by_department: { department: string; avg_total: number; call_count: number }[];
  recent: CallListItem[];
};

// ---- Ekran 6 · Operator profili ----

export type OperatorProfile = {
  name: string;
  call_count: number;
  avg_total: number | null;
  max_total: number | null;
  by_criterion: CriterionAvg[];
  calls: (CallListItem & { status: "ai" | "reviewed" | "disputed" })[];
  recommendations: { call_id: string; created_at: string; text: string }[];
};

// ---- Ekran 8 · Məşqlərim ----

export type TrainingView = {
  name: string;
  last: CallRow | null; // son zəng (strengths / improvements / training_recommendation)
  recommended_scenario: ScenarioCard | null;
  recommendation_text: string | null;
  history: CallListItem[];
};

// ---- Ekran 5 · Ssenari yaradıcısı ----

export type ScenarioDraftInput = {
  standard: string;
  department: string;
  language: "az";
  customerType: string;
  difficulty: "low" | "medium" | "high";
};

export type ScenarioDraft = {
  title: string;
  summary: string;
  persona_prompt: string;
  rubric: (Criterion & { source: string })[];
  meta: ScenarioMeta;
};

// ---- Keyfiyyət testi ----

export type AgreementMetrics = {
  pairs: number; // rəhbər balı olan meyar sayı
  exact_pct: number | null;
  within1_pct: number | null;
  mean_abs_diff_total: number | null; // zəng üzrə cəmlərdə
  by_criterion: { criterion: number; name: string; pairs: number; exact_pct: number }[];
  avg_scoring_ms: number | null;
  scored_calls: number;
};
