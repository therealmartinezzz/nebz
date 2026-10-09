import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { fail, isUuid, readJson } from "@/server/http";

// Brauzer üçün qısa ömürlü OpenAI Realtime açarı yaradır. Əsas OPENAI_API_KEY serverdə qalır.
export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) return fail("Səsli rejim qoşulmayıb (OPENAI_API_KEY yoxdur) — mətn rejimindən istifadə edin", 503);
  const body = await readJson<{ scenarioId: string }>(req);
  if (!isUuid(body?.scenarioId)) return fail("Sorğu natamamdır");
  const scenarioId = body.scenarioId;
  const { data: scenario, error } = await db()
    .from("scenarios")
    .select("persona_prompt")
    .eq("id", scenarioId)
    .maybeSingle();
  if (error || !scenario) return NextResponse.json({ error: "Ssenari tapılmadı" }, { status: 404 });

  const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: process.env.REALTIME_MODEL || "gpt-realtime",
        instructions: scenario.persona_prompt,
        audio: {
          input: {
            transcription: { model: "gpt-4o-transcribe", language: "az" },
            turn_detection: { type: "server_vad" },
          },
          output: { voice: process.env.REALTIME_VOICE || "marin" },
        },
      },
    }),
  });
  const json = await r.json();
  if (!r.ok) return NextResponse.json({ error: json?.error?.message || "Realtime xətası" }, { status: 500 });
  return NextResponse.json({ key: json.value ?? json.client_secret?.value });
}
