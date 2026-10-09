// Saniyəni mm:ss formatına çevirir (transkript vaxtları, zəng müddəti).
export function fmtTime(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
