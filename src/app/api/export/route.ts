import { exportScoreRows } from "@/server/queries";

export const dynamic = "force-dynamic";

// Keyfiyyət testi: bütün zəng × meyar ballarını CSV kimi verir (Excel/Sheets-də açılır).
export async function GET() {
  const rows = await exportScoreRows();
  const cols = rows.length ? Object.keys(rows[0]) : ["call_id"];
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc((r as Record<string, unknown>)[c])).join(","))].join("\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nebz-scores-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
