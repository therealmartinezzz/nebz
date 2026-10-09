import type { CallListItem, ScoreRow } from "@/lib/types";

export const number = (value: number, digits = 1) => new Intl.NumberFormat("az-AZ", { maximumFractionDigits: digits }).format(value);
export const date = (value: string, time = false) => new Intl.DateTimeFormat("az-AZ", { timeZone: "Asia/Baku", day: "2-digit", month: "2-digit", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(new Date(value));
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("az-AZ") || "OP";
export function decodeRouteName(value: string) {
  try { return decodeURIComponent(value); }
  catch { return value; }
}
export const resultPercent = (call: Pick<CallListItem, "total" | "max_total">) => call.max_total > 0 ? call.total / call.max_total * 100 : null;
export function averageResult(calls: CallListItem[]) {
  const values = calls.map(resultPercent).filter((value): value is number => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
export function criterionAverages(scores: ScoreRow[]) {
  const groups = new Map<string, { total: number; count: number }>();
  for (const score of scores) {
    const entry = groups.get(score.criterion_name) ?? { total: 0, count: 0 };
    entry.total += score.score;
    entry.count++;
    groups.set(score.criterion_name, entry);
  }
  return [...groups].map(([label, { total, count }]) => ({ label, value: total / count, max: 2 })).sort((a, b) => b.value - a.value);
}
export function practiceHref(scenarioId: string, name: string, mode = "voice") {
  return `/call/${encodeURIComponent(scenarioId)}?${new URLSearchParams({ name, mode })}`;
}
