import "server-only";
import { NextResponse } from "next/server";

// Bütün API xətaları eyni formada: { error: "Azərbaycan dilində mesaj" } + status.
export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
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
