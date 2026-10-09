import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { scoreCall } from "@/server/ai";
import { modelName, provider } from "@/server/llm";
import { fail, isUuid, modelFailure, readJson } from "@/server/http";
import type { Line, Scenario } from "@/lib/types";
import { withDemoRequest } from '@/server/demo-budget';

type Body = {
  scenarioId: string;
  operatorName: string;
  mode: "voice" | "text";
  transcript: Line[];
  durationSec: number;
};

// Zəng bitəndə: transkripti qiymətləndirir və hamısını bazaya yazır.
export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  if (!body || !isUuid(body.scenarioId) || !Array.isArray(body.transcript)) return fail("Sorğu natamamdır");

  const transcript = body.transcript
    .filter((l) => (l?.role === "operator" || l?.role === "customer") && typeof l.text === "string" && l.text.trim())
    .map((l) => ({ role: l.role, text: l.text.trim(), t: Math.max(0, Number(l.t) || 0) }));
  if (transcript.length < 2) return fail("Transkript çox qısadır, qiymətləndirmək mümkün deyil");
  if (transcript.length > 100 || transcript.map(l => l.text).join('').length > 16000) return fail('Demo transkripti çox uzundur (maksimum 16 000 simvol).');

  const supa = db();
  const { data: scenario } = await supa.from("scenarios").select("*").eq("id", body.scenarioId).maybeSingle<Scenario>();
  if (!scenario) return fail("Ssenari tapılmadı", 404);

  // "Zəng bitdikdən hesabata qədər" vaxtı — keyfiyyət testində insanla müqayisə üçün ölçülür.
  const started = Date.now();
  let result;
  try {
    result = await withDemoRequest(req, () => scoreCall(scenario.rubric, transcript));
  } catch (e) {
    return modelFailure(e, "Qiymətləndirmə alınmadı, yenidən cəhd edin", "scoreCall");
  }
  const scoring_ms = Date.now() - started;

  const { data: call, error } = await supa
    .from("calls")
    .insert({
      scenario_id: scenario.id,
      operator_name: body.operatorName?.trim() || "Operator",
      mode: body.mode === "voice" ? "voice" : "text",
      transcript,
      duration_sec: Math.round(Number(body.durationSec) || 0),
      total: result.total,
      max_total: result.max_total,
      strengths: result.strengths,
      improvements: result.improvements,
      training_recommendation: result.training_recommendation,
      confidence: result.confidence,
      confidence_reason: result.confidence_reason,
      model: `${provider()}:${modelName()}`,
      scoring_ms,
    })
    .select("id")
    .single();
  if (error || !call) return fail(error?.message || "Yazma xətası", 500);

  const { error: scoresError } = await supa.from("scores").insert(result.scores.map((s) => ({ ...s, call_id: call.id })));
  if (scoresError) {
    await supa.from("calls").delete().eq("id", call.id); // yarımçıq hesabat qalmasın
    return fail(scoresError.message, 500);
  }
  return NextResponse.json({ id: call.id });
}
