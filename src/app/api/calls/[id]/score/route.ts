import { NextResponse } from "next/server";
import { scoreStoredCall } from "@/server/calls";
import { fail, isUuid } from "@/server/http";

// Saxlanılmış, amma qiymətləndirilməmiş zəngi (yenidən) qiymətləndirir. Artıq qiymətləndirilibsə dəyişmir.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return fail("Sorğu natamamdır");
  const outcome = await scoreStoredCall(req, id);
  if (!outcome) return fail("Zəng tapılmadı", 404);
  return outcome.scored ? NextResponse.json(outcome) : fail(outcome.error, outcome.status);
}
