import { NextResponse } from "next/server";
import { getAgreementMetrics } from "@/server/queries";

export const dynamic = "force-dynamic";

// Keyfiyyət testi: AI ilə rəhbər uyğunluğu və qiymətləndirmə vaxtı (real datadan).
export async function GET() {
  return NextResponse.json(await getAgreementMetrics());
}
