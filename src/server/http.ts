import "server-only";
import { NextResponse } from "next/server";
import { LlmConfigError } from "./llm";
import { DemoBudgetError } from './demo-budget';

// Bütün API xətaları eyni formada: { error: "Azərbaycan dilində mesaj" } + status.
export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Model çağırışı xətasını cavaba çevirir: açar yoxdur → 503, modelin pozuk cavabı → 502 + mesajı, qalanı → 502 + ümumi mesaj. */
export function modelFailure(e: unknown, fallback: string, where: string) {
  const status = typeof e === "object" && e !== null && "status" in e ? Number(e.status) : undefined;
  // SDK xətasında sorğu URL-i/açar ola bilər. Yalnız təhlükəsiz metadata yazılır.
  console.error(where, { name: e instanceof Error ? e.name : "Error", status });
  if (e instanceof LlmConfigError) return fail(e.message, 503);
  if (e instanceof DemoBudgetError) return fail(e.message, e.status);
  if (status === 429) return fail("Gemini sorğu limiti dolub. AI Studio-da layihənin kvotasını və billing vəziyyətini yoxlayın, sonra yenidən cəhd edin.", 429);
  if (status === 401 || status === 403) return fail("AI açarının icazəsi yoxdur. Layihənin API açarını və xidmət icazələrini yoxlayın.", 503);
  if (status === 404) return fail("Seçilən AI modeli bu layihə üçün əlçatan deyil. Model konfiqurasiyasını yoxlayın.", 503);
  if (status === 503) return fail("Gemini hazırda çox yüklənib. Bir qədər gözləyib yenidən cəhd edin; transkript saxlanılır.", 503);
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
