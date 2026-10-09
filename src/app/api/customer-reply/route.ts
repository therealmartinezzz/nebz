import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { customerReply } from "@/server/ai";
import { fail, isUuid, modelFailure, readJson } from "@/server/http";
import type { Line } from "@/lib/types";
import { withDemoRequest } from '@/server/demo-budget';

// Mətn (ehtiyat) rejimi: operator yazır, AI müştəri cavab verir.
export async function POST(req: Request) {
  const body = await readJson<{ scenarioId: string; transcript: Line[] }>(req);
  if (!body || !isUuid(body.scenarioId) || !Array.isArray(body.transcript) || !body.transcript.length) {
    return fail("Sorğu natamamdır");
  }
  const transcript = body.transcript.filter((l) => (l?.role === 'operator' || l?.role === 'customer') && typeof l.text === "string" && l.text.trim());
  if (transcript.filter(l => l.role === 'operator').length > 5 || transcript.length > 10 || transcript.some(l => l.text.length > 1000) || transcript.map(l => l.text).join('').length > 16000) return fail('Demo mətn məşqi maksimum 5 operator replikasıdır; hər mesaj 1000 simvola qədər ola bilər.');

  const { data: scenario } = await db().from("scenarios").select("persona_prompt").eq("id", body.scenarioId).maybeSingle();
  if (!scenario) return fail("Ssenari tapılmadı", 404);
  try {
    const text = await withDemoRequest(req, () => customerReply(scenario.persona_prompt, transcript));
    if (!text) return fail("AI müştəri boş cavab verdi, yenidən göndərin", 502);
    return NextResponse.json({ text });
  } catch (e) {
    return modelFailure(e, "AI müştəri cavab vermədi, yenidən göndərin", "customer-reply");
  }
}
