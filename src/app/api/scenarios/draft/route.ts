import { NextResponse } from "next/server";
import { draftScenario, ScenarioValidationError } from "@/server/ai";
import { fail, modelFailure, readJson } from "@/server/http";
import type { ScenarioDraftInput } from "@/lib/types";

// Ekran 5: xidmət standartından ssenari qaralaması (bazaya yazmır).
export async function POST(req: Request) {
  const body = await readJson<Partial<ScenarioDraftInput>>(req);
  const standard = body?.standard?.trim() ?? "";
  if (standard.length < 30) return fail("Xidmət standartının mətnini daxil edin (ən azı bir neçə bənd)");
  if (standard.length > 20000) return fail("Standart mətni çox uzundur (maks. 20 000 simvol)");

  const difficulty = body?.difficulty === "low" || body?.difficulty === "high" ? body.difficulty : "medium";
  try {
    const draft = await draftScenario({
      standard,
      department: body?.department?.trim() || "Ümumi xidmət",
      language: "az",
      customerType: body?.customerType?.trim() || "Narazı",
      difficulty,
    });
    return NextResponse.json(draft);
  } catch (e) {
    if (e instanceof ScenarioValidationError) return fail(`AI qaralaması natamamdır: ${e.message}. Yenidən yaradın.`, 502);
    return modelFailure(e, "Qaralama hazırlanmadı, yenidən cəhd edin", "draftScenario");
  }
}
