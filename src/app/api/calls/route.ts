import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { scoreCall } from "@/server/claude";
import type { Line, Scenario } from "@/lib/types";

// Zəng bitəndə: transkripti qiymətləndirir və hamısını bazaya yazır.
export async function POST(req: Request) {
  const body = (await req.json()) as {
    scenarioId: string;
    operatorName: string;
    mode: "voice" | "text";
    transcript: Line[];
    durationSec: number;
  };
  const transcript = body.transcript.filter((l) => l.text?.trim());
  if (transcript.length < 2) {
    return NextResponse.json({ error: "Transkript çox qısadır, qiymətləndirmək mümkün deyil" }, { status: 400 });
  }

  const supa = db();
  const { data: scenario } = await supa.from("scenarios").select("*").eq("id", body.scenarioId).single<Scenario>();
  if (!scenario) return NextResponse.json({ error: "Ssenari tapılmadı" }, { status: 404 });

  const result = await scoreCall(scenario.rubric, transcript);

  const { data: call, error } = await supa
    .from("calls")
    .insert({
      scenario_id: scenario.id,
      operator_name: body.operatorName || "Operator",
      mode: body.mode,
      transcript,
      duration_sec: Math.round(body.durationSec),
      total: result.total,
      max_total: result.max_total,
      strengths: result.strengths,
      improvements: result.improvements,
      training_recommendation: result.training_recommendation,
      confidence: result.confidence,
    })
    .select("id")
    .single();
  if (error || !call) return NextResponse.json({ error: error?.message || "Yazma xətası" }, { status: 500 });

  await supa.from("scores").insert(result.scores.map((s) => ({ ...s, call_id: call.id })));
  return NextResponse.json({ id: call.id });
}
