import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { LiveTranscript } from "@/components/live-transcript";

describe("Gemini səs transkripti", () => {
  it("operator transkripti gec gələndə danışığın başlanma vaxtı ilə sıralanır", () => {
    const transcript = new LiveTranscript();
    transcript.append("customer", "Kartım bloklanıb.", true, 5);
    transcript.append("operator", "Sizə necə kömək edə bilərəm?", true, 1);
    expect(transcript.snapshot().map((line) => line.role)).toEqual(["operator", "customer"]);
  });
  it("qarışıq gələn input/output hissələri ayrı rollarda saxlanır, növbəti növbəyə birləşmir", () => {
    const transcript = new LiveTranscript();
    transcript.append("operator", "Salam, ", false, 1);
    transcript.append("customer", "Kartım ", false, 2);
    transcript.append("operator", "NovaBank.", true, 3);
    transcript.append("customer", "bloklanıb.", true, 4);
    transcript.completeTurn();
    transcript.append("operator", "Doğum tarixinizi deyin.", true, 6);
    expect(transcript.snapshot()).toEqual([
      { role: "operator", text: "Salam, NovaBank.", t: 1 },
      { role: "customer", text: "Kartım bloklanıb.", t: 2 },
      { role: "operator", text: "Doğum tarixinizi deyin.", t: 6 },
    ]);
  });

  it("kəsilən cavab itmir, yeni AI cavabı ona əlavə edilmir", () => {
    const transcript = new LiveTranscript();
    transcript.append("customer", "Mən ", false, 2);
    transcript.interrupt();
    transcript.append("operator", "Bir dəqiqə.", true, 3);
    transcript.append("customer", "Yaxşı.", true, 4);
    expect(transcript.snapshot().map((line) => line.text)).toEqual(["Mən", "Bir dəqiqə.", "Yaxşı."]);
  });
});

describe("mikrofon PCM formatı", () => {
  function capture(rate: number) {
    const messages: { buffer: ArrayBuffer; level: number }[] = [];
    let Processor: new () => { process(inputs: Float32Array[][]): boolean };
    const context = vm.createContext({
      sampleRate: rate,
      AudioWorkletProcessor: class { port = { postMessage: (message: { buffer: ArrayBuffer; level: number }) => messages.push(message) }; },
      registerProcessor: (_name: string, processor: typeof Processor) => { Processor = processor; },
    });
    vm.runInContext(readFileSync("public/audio/pcm-capture.js", "utf8"), context);
    return { processor: new Processor!(), messages };
  }

  it.each([16000, 48000])("%i Hz mikrofon 100 ms üçün 1600 PCM16 sample yaradır", (rate) => {
    const { processor, messages } = capture(rate);
    processor.process([[new Float32Array(rate / 10).fill(0.5)]]);
    expect(messages).toHaveLength(1);
    expect(messages[0].buffer.byteLength).toBe(3200);
    const view = new DataView(messages[0].buffer);
    expect(view.getInt16(0, true)).toBe(16384);
    expect(view.getInt16(3198, true)).toBe(16384);
    expect(messages[0].level).toBeCloseTo(0.5);
  });

  it("səssiz bloklar da göndərilir ki, server danışığın bitməsini aşkar etsin", () => {
    const { processor, messages } = capture(16000);
    processor.process([[new Float32Array(1600)]]);
    expect(messages).toHaveLength(1);
    expect(messages[0].level).toBe(0);
    expect(new Uint8Array(messages[0].buffer).every((byte) => byte === 0)).toBe(true);
  });
});
