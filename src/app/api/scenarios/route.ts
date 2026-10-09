import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { normalizeScenario, ScenarioValidationError } from "@/server/ai";
import { fail, readJson } from "@/server/http";
import type { ScenarioDraft } from "@/lib/types";

// Ekran 5: redaktə olunmuş qaralamanı yoxlayıb saxlayır → ekran 1-də görünür.
export async function POST(req: Request) {
  const body = await readJson<ScenarioDraft & { department?: string }>(req);
  if (!body) return fail("Sorğu natamamdır");

  let scenario;
  try {
    scenario = normalizeScenario(body);
  } catch (e) {
    if (e instanceof ScenarioValidationError) return fail(e.message);
    throw e;
  }

  const { data, error } = await db()
    .from("scenarios")
    .insert({
      title: scenario.title,
      department: body.department?.trim() || "Ümumi xidmət",
      summary: scenario.summary || null,
      persona_prompt: scenario.persona_prompt,
      rubric: scenario.rubric,
      meta: scenario.meta,
    })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message || "Yazma xətası", 500);
  return NextResponse.json({ id: data.id });
}
