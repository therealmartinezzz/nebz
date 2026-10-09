import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

// Mətn modeli üçün tək giriş nöqtəsi. Provayder env ilə seçilir:
//   LLM_PROVIDER=claude  → CLAUDE_MODEL  (default claude-sonnet-5-5), ANTHROPIC_API_KEY
//   LLM_PROVIDER=gemini  → GEMINI_MODEL  (default gemini-3.8-flash),  GEMINI_API_KEY
// LLM_PROVIDER verilməyibsə: ANTHROPIC_API_KEY varsa claude, yoxsa gemini.

export type ChatMessage = { role: "user" | "assistant"; content: string };

type CompleteArgs = {
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
  json?: boolean; // cavabın JSON olması gözlənilir
};

export function provider(): "claude" | "gemini" {
  const p = process.env.LLM_PROVIDER?.toLowerCase();
  if (p === "claude" || p === "gemini") return p;
  return process.env.ANTHROPIC_API_KEY ? "claude" : "gemini";
}

export function modelName() {
  return provider() === "claude"
    ? process.env.CLAUDE_MODEL || "claude-sonnet-5-5"
    : process.env.GEMINI_MODEL || "gemini-3.8-flash";
}

let anthropic: Anthropic | null = null;
let gemini: GoogleGenAI | null = null;

export async function complete({ system, messages, maxTokens, json }: CompleteArgs): Promise<string> {
  if (provider() === "claude") {
    anthropic ??= new Anthropic();
    const res = await anthropic.messages.create({ model: modelName(), max_tokens: maxTokens, system, messages });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY təyin edilməyib");
  gemini ??= new GoogleGenAI({ apiKey });
  const res = await gemini.models.generateContent({
    model: modelName(),
    contents: messages.map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
    config: {
      systemInstruction: system,
      // Gemini düşünmə tokenlərini də bu limitə sayır — cavab kəsilməsin deyə ehtiyatla böyük saxlanılır.
      maxOutputTokens: maxTokens * 4,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  });
  return res.text ?? "";
}
