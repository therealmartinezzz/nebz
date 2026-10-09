import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { fail, isUuid, readJson } from "@/server/http";

type Body = { scoreId: string; kind: "manager" | "dispute"; newScore?: number; comment?: string };

// Ekran 7 (rəhbər qərarı) və ekran 3 (işçinin etirazı).
// manager: newScore məcburidir (AI balını saxlamaq = AI balını göndərmək). dispute: comment məcburidir.
export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  if (!body || !isUuid(body.scoreId)) return fail("Sorğu natamamdır");
  if (body.kind !== "manager" && body.kind !== "dispute") return fail("kind 'manager' və ya 'dispute' olmalıdır");

  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) : "";
  let newScore: number | null = null;
  if (body.kind === "manager") {
    newScore = Number(body.newScore);
    if (![0, 1, 2].includes(newScore)) return fail("Rəhbər balı 0, 1 və ya 2 olmalıdır");
  } else if (!comment) {
    return fail("Etirazın səbəbini yazın");
  }

  const supa = db();
  const { data: score } = await supa.from("scores").select("id").eq("id", body.scoreId).maybeSingle();
  if (!score) return fail("Bal tapılmadı", 404);

  const { data, error } = await supa
    .from("reviews")
    .insert({ score_id: body.scoreId, kind: body.kind, new_score: newScore, comment: comment || null })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message || "Yazma xətası", 500);
  return NextResponse.json({ id: data.id });
}
