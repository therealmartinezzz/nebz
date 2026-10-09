import type { Line } from "@/lib/types";

// İki transkript axını ayrı gəlir: birinin hissələri digərinin mətninə qarışmır.
export class LiveTranscript {
  private entries: Line[] = [];
  private active: Partial<Record<Line["role"], number>> = {};

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
  interrupt() { delete this.active.customer; }
  snapshot(): Line[] {
    return this.entries.filter((line) => line.text.trim()).map((line) => ({ ...line, text: line.text.trim() })).sort((a, b) => a.t - b.t);
  }
}
