import "server-only";
import * as queries from "@/server/queries";
import type { CallListItem, ScenarioCard } from "@/lib/types";
import type { Report, ReviewItem, TrainingView } from "./contracts";

const connectionError = "Məlumatları yükləmək mümkün olmadı. Bağlantını yoxlayıb yenidən cəhd edin.";
type Result<T> = { data: T; error: string };
const futureQueries = queries as typeof queries & {
  getReviewQueue?: () => Promise<ReviewItem[]>;
  getMyTraining?: (name: string) => Promise<TrainingView>;
};

export async function readScenarios(): Promise<Result<ScenarioCard[]>> {
  try { return { data: await queries.listScenarios(), error: "" }; }
  catch { return { data: [], error: connectionError }; }
}
export async function readCalls(): Promise<Result<CallListItem[]>> {
  try { return { data: await queries.listCalls(100), error: "" }; }
  catch { return { data: [], error: connectionError }; }
}
export async function readReport(id: string): Promise<Result<Report | null>> {
  try { return { data: await queries.getCallReport(id), error: "" }; }
  catch { return { data: null, error: connectionError }; }
}
export async function readReports(calls: CallListItem[]): Promise<Result<Report[]>> {
  const results = await Promise.all(calls.map((call) => readReport(call.id)));
  return { data: results.flatMap(({ data }) => data ? [data] : []), error: results.some(({ error, data }) => error || !data) ? "Bəzi zənglərin detalları yüklənmədi. Meyar göstəriciləri hələ əlçatan deyil." : "" };
}
export async function readReviewQueue(): Promise<Result<ReviewItem[]> & { disputesAvailable: boolean }> {
  if (futureQueries.getReviewQueue) {
    try {
      const data = await futureQueries.getReviewQueue();
      const hydrated = await Promise.all(data.map(async (item) => {
        if (item.score) return item;
        const report = await readReport(item.call.id);
        return { ...item, scores: report.data?.scores ?? [], transcript: report.data?.call.transcript ?? [] };
      }));
      return { data: hydrated, error: "", disputesAvailable: true };
    } catch { return { data: [], error: connectionError, disputesAvailable: true }; }
  }
  const calls = await readCalls();
  if (calls.error) return { data: [], error: calls.error, disputesAvailable: false };
  const reports = await readReports(calls.data.filter((call) => call.confidence === "low"));
  return {
    data: reports.data.map(({ call, scores }) => ({ reason: "low_confidence", call: { id: call.id, operator_name: call.operator_name, created_at: call.created_at, scenario_title: call.scenarios?.title ?? "Ssenari", department: call.scenarios?.department ?? "" }, score: null, dispute: null, transcript_excerpt: call.transcript ?? [], scores, transcript: call.transcript ?? [] })),
    error: reports.error,
    disputesAvailable: false,
  };
}
export async function readTraining(name: string): Promise<Result<TrainingView>> {
  const empty: TrainingView = { name, last: null, recommended_scenario: null, history: [] };
  if (!name) return { data: empty, error: "" };
  if (futureQueries.getMyTraining) {
    try { return { data: await futureQueries.getMyTraining(name), error: "" }; }
    catch { return { data: empty, error: connectionError }; }
  }
  const calls = await readCalls();
  if (calls.error) return { data: empty, error: calls.error };
  const history = calls.data.filter((call) => call.operator_name === name);
  if (!history.length) return { data: empty, error: "" };
  const last = await readReport(history[0].id);
  const scenarios = await readScenarios();
  const recommendation = last.data?.call.training_recommendation?.toLocaleLowerCase("az-AZ") ?? "";
  const recommended = scenarios.data.find((scenario) => recommendation.includes(scenario.title.toLocaleLowerCase("az-AZ"))) ?? null;
  return { data: { name, history, last: last.data?.call ?? null, recommended_scenario: recommended }, error: last.error || scenarios.error };
}
