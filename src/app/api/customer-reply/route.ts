import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { customerReply } from "@/server/ai";
import { fail, isUuid, readJson } from "@/server/http";
import type { Line } from "@/lib/types";

// Mətn (ehtiyat) rejimi: operator yazır, AI müştəri cavab verir.
export async function POST(req: Request) {
  const body = await readJson<{ scenarioId: string; transcript: Line[] }>(req);
  if (!body || !isUuid(body.scenarioId) || !Array.isArray(body.transcript) || !body.transcript.length) {
    return fail("Sorğu natamamdır");
  }
  const transcript = body.transcript.filter((l) => typeof l?.text === "string" && l.text.trim());

  const { data: scenario } = await db().from("scenarios").select("persona_prompt").eq("id", body.scenarioId).maybeSingle();
  if (!scenario) return fail("Ssenari tapılmadı", 404);
  try {
    const text = await customerReply(scenario.persona_prompt, transcript);
    if (!text) return fail("AI müştəri boş cavab verdi, yenidən göndərin", 502);
    return NextResponse.json({ text });
  } catch (e) {
    console.error("customer-reply", e);
    return fail("AI müştəri cavab vermədi, yenidən göndərin", 502);
  }
}
