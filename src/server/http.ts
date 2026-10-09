import "server-only";
import { NextResponse } from "next/server";
import { LlmConfigError } from "./llm";
import { DemoBudgetError } from './demo-budget';

// Bütün API xətaları eyni formada: { error: "Azərbaycan dilində mesaj" } + status.
export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Model çağırışı xətasını istifadəçi mesajına və statusa çevirir: açar yoxdur → 503, modelin pozuk cavabı → 502 + mesajı, qalanı → 502 + ümumi mesaj. */
export function describeModelFailure(e: unknown, fallback: string, where: string): { message: string; status: number } {
  const status = typeof e === "object" && e !== null && "status" in e ? Number(e.status) : undefined;
  // SDK xətasında sorğu URL-i/açar ola bilər. Yalnız təhlükəsiz metadata yazılır.
  console.error(where, { name: e instanceof Error ? e.name : "Error", status });
  if (e instanceof LlmConfigError) return { message: e.message, status: 503 };
  if (e instanceof DemoBudgetError) return { message: e.message, status: e.status };
  if (status === 429) return { message: "Gemini sorğu limiti dolub. AI Studio-da layihənin kvotasını və billing vəziyyətini yoxlayın, sonra yenidən cəhd edin.", status: 429 };
  if (status === 401 || status === 403) return { message: "AI açarının icazəsi yoxdur. Layihənin API açarını və xidmət icazələrini yoxlayın.", status: 503 };
  if (status === 404) return { message: "Seçilən AI modeli bu layihə üçün əlçatan deyil. Model konfiqurasiyasını yoxlayın.", status: 503 };
  if (status === 503) return { message: "Gemini hazırda çox yüklənib. Bir qədər gözləyib yenidən cəhd edin; transkript saxlanılır.", status: 503 };
  if (e instanceof Error && e.message.startsWith("Model")) return { message: e.message, status: 502 };
  return { message: fallback, status: 502 };
}

export function modelFailure(e: unknown, fallback: string, where: string) {
  const { message, status } = describeModelFailure(e, fallback, where);
  return fail(message, status);
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
