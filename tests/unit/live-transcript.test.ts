import { describe, expect, it } from "vitest";
import { LiveTranscript } from "@/components/live-transcript";

// 09.10 real səsli sınaqdakı hal: müştərinin sözü səs-küylə kəsilir, model cavabı yenidən deyir.
describe("LiveTranscript — kəsilmiş müştəri cavabları təkrarlanmır", () => {
  it("kəsilmiş cavab növbəti tam cavabın başlanğıcıdırsa çıxarılır", () => {
    const tr = new LiveTranscript();
    tr.append("operator", "salam", true, 1);
    tr.append("customer", "Salam, İstanbuldayam və kartım", false, 3);
    tr.interrupt();
    tr.append("operator", "bəli", true, 4);
    tr.append("customer", "Salam, İstanbuldayam, kartım bloklanıb və mağazada ödəniş edə bilmirəm.", true, 6);
    expect(tr.snapshot().map((l) => l.text)).toEqual([
      "salam",
      "bəli",
      "Salam, İstanbuldayam, kartım bloklanıb və mağazada ödəniş edə bilmirəm.",
    ]);
  });

  it("əvvəlki tam cavabın içində olan kəsilmiş fraqment çıxarılır", () => {
    const tr = new LiveTranscript();
    tr.append("customer", "Salam, İstanbuldayam, kartım bloklanıb və mağazada ödəniş edə bilmirəm.", true, 6);
    tr.completeTurn();
    tr.append("customer", "...kartım bloklanıb və", false, 9);
    tr.interrupt();
    expect(tr.snapshot().filter((l) => l.role === "customer")).toHaveLength(1);
  });

  it("kəsilmiş, amma yeni məzmunlu cavab saxlanılır (operator onu eşidib)", () => {
    const tr = new LiveTranscript();
    tr.append("customer", "Tələsirəm, bu sualları keçək, sadəcə kartı açın.", false, 11);
    tr.interrupt();
    tr.append("customer", "Yaxşı, doğum tarixim 14 mart 1995-dir.", true, 20);
    expect(tr.snapshot().map((l) => l.text)).toEqual([
      "Tələsirəm, bu sualları keçək, sadəcə kartı açın.",
      "Yaxşı, doğum tarixim 14 mart 1995-dir.",
    ]);
  });

  it("kəsilməyən təkrar cavablara toxunmur", () => {
    const tr = new LiveTranscript();
    tr.append("customer", "Kartım bloklanıb.", true, 1);
    tr.completeTurn();
    tr.append("customer", "Kartım bloklanıb, kömək edin.", true, 5);
    expect(tr.snapshot()).toHaveLength(2);
  });
});
