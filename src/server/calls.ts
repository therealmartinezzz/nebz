import "server-only";
import { db } from "./db";
import { scoreCall } from "./ai";
import { modelName, provider } from "./llm";
import { describeModelFailure } from "./http";
import { withDemoRequest } from "./demo-budget";
import type { CallStatus, Line, Scenario } from "@/lib/types";

export type ScoreOutcome =
  | { id: string; scored: true }
  | { id: string; scored: false; error: string; status: number };

/**
 * Saxlanılmış zəngi qiymətləndirir. Uğurda ballar yazılır və status = scored;
 * xətada status = failed + scoring_error (transkript itmir, sonra yenidən cəhd olunur).
 */
export async function scoreStoredCall(req: Request, callId: string): Promise<ScoreOutcome | null> {
  const supa = db();
  const { data: call } = await supa
    .from("calls")
    .select("id, status, transcript, scenarios(rubric)")
    .eq("id", callId)
    .maybeSingle<{ id: string; status: CallStatus; transcript: Line[]; scenarios: Pick<Scenario, "rubric"> | null }>();
  if (!call) return null;
  if (call.status === "scored") return { id: call.id, scored: true };
  const rubric = call.scenarios?.rubric;
  if (!rubric?.length) return markFailed(call.id, "Ssenarinin meyarları tapılmadı", 404);

  await supa.from("calls").update({ status: "pending", scoring_error: null }).eq("id", call.id);

  // "Zəng bitdikdən hesabata qədər" vaxtı — keyfiyyət testində insanla müqayisə üçün ölçülür.
  const started = Date.now();
  let result;
  try {
    result = await withDemoRequest(req, () => scoreCall(rubric, call.transcript));
  } catch (e) {
    const { message, status } = describeModelFailure(e, "Qiymətləndirmə alınmadı, yenidən cəhd edin", "scoreCall");
    return markFailed(call.id, message, status);
  }
  const scoring_ms = Date.now() - started;

  // Təkrar cəhddə köhnə yarımçıq ballar qalmasın.
  await supa.from("scores").delete().eq("call_id", call.id);
  const { error: scoresError } = await supa.from("scores").insert(result.scores.map((s) => ({ ...s, call_id: call.id })));
  if (scoresError) return markFailed(call.id, `Ballar yazılmadı: ${scoresError.message}`, 500);

  const { error } = await supa
    .from("calls")
    .update({
      status: "scored",
      scoring_error: null,
      total: result.total,
      max_total: result.max_total,
      strengths: result.strengths,
      improvements: result.improvements,
      training_recommendation: result.training_recommendation,
      confidence: result.confidence,
      confidence_reason: result.confidence_reason,
      model: `${provider()}:${modelName("scoring")}`,
      scoring_ms,
    })
    .eq("id", call.id);
  if (error) return markFailed(call.id, `Nəticə yazılmadı: ${error.message}`, 500);
  return { id: call.id, scored: true };
}

async function markFailed(id: string, error: string, status: number): Promise<ScoreOutcome> {
  await db().from("calls").update({ status: "failed", scoring_error: error }).eq("id", id);
  return { id, scored: false, error, status };
}
