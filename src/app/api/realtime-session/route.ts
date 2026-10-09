import { NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { db } from "@/server/db";
import { fail, isUuid, modelFailure, readJson } from "@/server/http";
import { reserveDemo, withDemoRequest } from '@/server/demo-budget';

export const runtime = "nodejs";

// Əsas açar serverdə qalır; token bir ssenari və bir qısa səs sessiyası üçündür.
export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) return fail("Səsli rejim qoşulmayıb (GEMINI_API_KEY yoxdur) — mətn rejimindən istifadə edin", 503);
  const body = await readJson<{ scenarioId: string }>(req);
  if (!isUuid(body?.scenarioId)) return fail("Sorğu natamamdır");
  const { data: scenario, error } = await db().from("scenarios")
    .select("persona_prompt").eq("id", body.scenarioId).maybeSingle();
  if (error || !scenario) return fail("Ssenari tapılmadı", 404);

  const model = process.env.GEMINI_LIVE_MODEL || "gemini-3.8-live";
  const voice = process.env.GEMINI_LIVE_VOICE || "Kore";
  const requestedLimit = Number(process.env.GEMINI_LIVE_MAX_SECONDS || 60);
  const maxDurationSec = Number.isFinite(requestedLimit) ? Math.max(10, Math.min(60, Math.round(requestedLimit))) : 60;
  const maxOperatorTurns = 10;
  try {
    // Səs istifadəsi brauzerdədir; qısa demo üçün ehtiyat geri qaytarılmır.
    await withDemoRequest(req, () => reserveDemo('voice', 0.045));
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: "v1beta" } });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        newSessionExpireTime: new Date(Date.now() + 30_000).toISOString(),
        expireTime: new Date(Date.now() + (maxDurationSec + 30) * 1000).toISOString(),
        liveConnectConstraints: {
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: scenario.persona_prompt + "\nYalnız Azərbaycan dilində danış. Operatorun ilk sözünü gözlə. Bu 60 saniyəlik qısa məşqdir. Hər dəfə yalnız bir qısa cümlə ilə cavab ver, uzun izah vermə.",
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        },
      },
    });
    if (!token.name) throw new Error("Token yaradılmadı");
    return NextResponse.json({ key: token.name, model, maxDurationSec, maxOperatorTurns }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return modelFailure(e, "Gemini səs sessiyası yaradılmadı. Mətn rejimi ilə davam edə bilərsiniz.", "realtime-session");
  }
}
