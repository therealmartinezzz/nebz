import "server-only";
import { db } from "./db";
import type { CallListItem, CallRow, ScenarioCard, ScoreRow } from "@/lib/types";

// Səhifələrin (server komponentlərinin) data oxuduğu yeganə yer.
// Frontend bazaya birbaşa getmir, yalnız bu funksiyaları çağırır. Müqavilə: docs/api.md.

export async function listScenarios(): Promise<ScenarioCard[]> {
  const { data, error } = await db()
    .from("scenarios")
    .select("id,title,department,summary,rubric")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data as ScenarioCard[];
}

export async function getCallReport(id: string): Promise<{ call: CallRow; scores: ScoreRow[] } | null> {
  const supa = db();
  const { data: call } = await supa.from("calls").select("*, scenarios(title, department)").eq("id", id).single();
  if (!call) return null;
  const { data: scores } = await supa.from("scores").select("*").eq("call_id", id).order("criterion");
  return { call: call as CallRow, scores: (scores ?? []) as ScoreRow[] };
}

export async function listCalls(limit = 100): Promise<CallListItem[]> {
  const { data, error } = await db()
    .from("calls")
    .select("id, operator_name, total, max_total, confidence, duration_sec, created_at, scenarios(title)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data as unknown as CallListItem[];
}
