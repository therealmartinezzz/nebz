import "server-only";
import { NextResponse } from "next/server";
import { LlmConfigError } from "./llm";

// Bütün API xətaları eyni formada: { error: "Azərbaycan dilində mesaj" } + status.
export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Model çağırışı xətasını cavaba çevirir: açar yoxdur → 503, modelin pozuk cavabı → 502 + mesajı, qalanı → 502 + ümumi mesaj. */
export function modelFailure(e: unknown, fallback: string, where: string) {
  console.error(where, e);
  if (e instanceof LlmConfigError) return fail(e.message, 503);
  if (e instanceof Error && e.message.startsWith("Model")) return fail(e.message, 502);
  return fail(fallback, 502);
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
