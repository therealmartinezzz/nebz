import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { scoreStoredCall } from "@/server/calls";
import { fail, isUuid, readJson } from "@/server/http";
import type { Line } from "@/lib/types";

type Body = {
  scenarioId: string;
  operatorName: string;
  mode: "voice" | "text";
  transcript: Line[];
  durationSec: number;
};

// Zəng bitəndə: əvvəlcə transkripti saxlayır (heç bir söhbət itmir), sonra qiymətləndirir.
// Cavab: { id, scored: true } və ya { id, scored: false, error } — hər iki halda zəng bazadadır, /report/{id} açılır.
export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  if (!body || !isUuid(body.scenarioId) || !Array.isArray(body.transcript)) return fail("Sorğu natamamdır");

  const transcript = body.transcript
    .filter((l) => (l?.role === "operator" || l?.role === "customer") && typeof l.text === "string" && l.text.trim())
    .map((l) => ({ role: l.role, text: l.text.trim(), t: Math.max(0, Number(l.t) || 0) }));
  if (transcript.length < 2) return fail("Transkript çox qısadır, qiymətləndirmək mümkün deyil");
  if (transcript.length > 100 || transcript.map(l => l.text).join('').length > 16000) return fail('Demo transkripti çox uzundur (maksimum 16 000 simvol).');

  const supa = db();
  const { data: scenario } = await supa.from("scenarios").select("id").eq("id", body.scenarioId).maybeSingle();
  if (!scenario) return fail("Ssenari tapılmadı", 404);

  const { data: call, error } = await supa
    .from("calls")
    .insert({
      scenario_id: scenario.id,
      operator_name: body.operatorName?.trim() || "Operator",
      mode: body.mode === "voice" ? "voice" : "text",
      transcript,
      duration_sec: Math.round(Number(body.durationSec) || 0),
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !call) return fail(error?.message || "Yazma xətası", 500);

  const outcome = await scoreStoredCall(req, call.id);
  if (!outcome) return fail("Zəng tapılmadı", 404);
  return NextResponse.json(outcome.scored ? outcome : { id: outcome.id, scored: false, error: outcome.error });
}
