import type { CallListItem, CallRow, Line, ScenarioCard, ScoreRow } from "@/lib/types";

// Frontend adapters for the planned contracts in docs/api.md; shared backend types stay in src/lib/types.ts.
export type Review = { id: string; score_id: string; kind: "manager" | "dispute"; new_score: 0 | 1 | 2 | null; comment: string | null; created_at: string };
export type Report = { call: CallRow; scores: (ScoreRow & { reviews?: Review[] })[] };
export type ReviewItem = {
  reason: "low_confidence" | "dispute";
  call: { id: string; operator_name: string; created_at: string; scenario_title: string; department: string };
  score: ScoreRow | null;
  dispute: Review | null;
  transcript_excerpt: Line[];
  scores?: ScoreRow[];
  transcript?: Line[];
};
export type TrainingView = { name: string; last: CallRow | null; recommended_scenario: ScenarioCard | null; history: CallListItem[] };
export type ScenarioDraft = {
  title: string;
  summary: string;
  persona_prompt: string;
  rubric: { id: number; name: string; levels: Record<"0" | "1" | "2", string>; source: string }[];
};
