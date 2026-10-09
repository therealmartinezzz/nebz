import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { customerReply } from "@/server/ai";
import type { Line } from "@/lib/types";

// Mətn (ehtiyat) rejimi: operator yazır, AI müştəri cavab verir.
export async function POST(req: Request) {
  const { scenarioId, transcript } = (await req.json()) as { scenarioId: string; transcript: Line[] };
  const { data: scenario } = await db().from("scenarios").select("persona_prompt").eq("id", scenarioId).single();
  if (!scenario) return NextResponse.json({ error: "Ssenari tapılmadı" }, { status: 404 });
  try {
    const text = await customerReply(scenario.persona_prompt, transcript);
    return NextResponse.json({ text });
  } catch (e) {
    console.error("customer-reply", e);
    return NextResponse.json({ error: "AI müştəri cavab vermədi, yenidən göndərin" }, { status: 502 });
  }
}
