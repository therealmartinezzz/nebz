import type { Line } from "@/lib/types";

// Müqayisə üçün: kiçik hərf, durğu işarələri və boşluqlar olmadan.
const norm = (s: string) => s.toLocaleLowerCase("az-AZ").replace(/[^\p{L}\p{N}]+/gu, "");
const commonPrefix = (a: string, b: string) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

// İki transkript axını ayrı gəlir: birinin hissələri digərinin mətninə qarışmır.
export class LiveTranscript {
  private entries: Line[] = [];
  private active: Partial<Record<Line["role"], number>> = {};
  private interrupted = new Set<number>();

  append(role: Line["role"], text: string | undefined, finished: boolean | undefined, t: number) {
    if (text) {
      let index = this.active[role];
      if (index === undefined) {
        index = this.entries.length;
        this.entries.push({ role, text: "", t });
        this.active[role] = index;
      }
      this.entries[index].text += text;
    }
    if (finished) delete this.active[role];
    return this.snapshot();
  }

  completeTurn() { this.active = {}; }

  /** Operator müştərinin sözünü kəsdi: yarımçıq cavab işarələnir, model onu adətən yenidən deyir. */
  interrupt() {
    const index = this.active.customer;
    if (index !== undefined) this.interrupted.add(index);
    delete this.active.customer;
  }

  snapshot(): Line[] {
    const customers = this.entries.map((line, i) => ({ i, n: norm(line.text) })).filter(({ i }) => this.entries[i].role === "customer");
    // Kəsilmiş cavab müştərinin başqa (daha tam) cavabında artıq varsa — təkrar kimi çıxarılır.
    const duplicate = (i: number) => {
      if (!this.interrupted.has(i)) return false;
      const own = norm(this.entries[i].text);
      if (!own) return true;
      return customers.some(({ i: j, n }) => j !== i && n.length > own.length && (n.includes(own) || commonPrefix(own, n) >= Math.max(8, own.length * 0.6)));
    };
    return this.entries
      .map((line, i) => ({ line, i }))
      .filter(({ line, i }) => line.text.trim() && !duplicate(i))
      .map(({ line }) => ({ ...line, text: line.text.trim() }))
      .sort((a, b) => a.t - b.t);
  }
}
