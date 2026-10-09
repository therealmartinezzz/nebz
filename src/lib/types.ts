export type Criterion = {
  id: number;
  name: string;
  levels: Record<"0" | "1" | "2", string>;
};

export type Scenario = {
  id: string;
  title: string;
  department: string;
  summary: string | null;
  persona_prompt: string;
  rubric: Criterion[];
};

export type Line = { role: "operator" | "customer"; text: string; t: number };

export type CriterionScore = {
  criterion: number;
  criterion_name: string;
  score: 0 | 1 | 2;
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
  confidence: "high" | "low";
};

// ---- Bazadan oxunan sətirlər (src/server/queries.ts qaytarır) ----

export type ScenarioCard = Pick<Scenario, "id" | "title" | "department" | "summary" | "rubric">;

export type CallRow = {
  id: string;
  scenario_id: string;
  operator_name: string;
  mode: "voice" | "text";
  transcript: Line[];
  duration_sec: number | null;
  total: number;
  max_total: number;
  strengths: string[] | null;
  improvements: string[] | null;
  training_recommendation: string | null;
  confidence: "high" | "low";
  created_at: string;
  scenarios: { title: string; department: string } | null;
};

export type ScoreRow = CriterionScore & { id: string; call_id: string };

export type CallListItem = Pick<
  CallRow,
  "id" | "operator_name" | "total" | "max_total" | "confidence" | "duration_sec" | "created_at"
> & { scenarios: { title: string } | null };
