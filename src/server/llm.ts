import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { reserveDemo, settleDemo } from './demo-budget';

// Mətn modeli üçün tək giriş nöqtəsi. Provayder env ilə seçilir:
//   LLM_PROVIDER=claude  → CLAUDE_MODEL  (default claude-sonnet-5-5), ANTHROPIC_API_KEY
//   LLM_PROVIDER=gemini  → GEMINI_*_MODEL (müştəri / qiymətləndirmə / qaralama), GEMINI_API_KEY
// LLM_PROVIDER verilməyibsə: ANTHROPIC_API_KEY varsa claude, yoxsa gemini.

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type LlmTask = "customer" | "scoring" | "draft";

type CompleteArgs = {
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
  json?: boolean; // cavabın JSON olması gözlənilir
  task?: LlmTask;
};

export function provider(): "claude" | "gemini" {
  const p = process.env.LLM_PROVIDER?.toLowerCase();
  if (p === "claude" || p === "gemini") return p;
  return process.env.ANTHROPIC_API_KEY ? "claude" : "gemini";
}

export function modelName(task: LlmTask = "scoring") {
  if (provider() === "claude") return process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
  const models = {
    customer: process.env.GEMINI_CUSTOMER_MODEL,
    scoring: process.env.GEMINI_SCORING_MODEL,
    draft: process.env.GEMINI_DRAFT_MODEL,
  };
  return models[task] || process.env.GEMINI_MODEL || (task === "customer" ? "gemini-3.5-flash-lite" : "gemini-3.8-flash");
}

/** Açar və ya konfiqurasiya yoxdur — route-lar bunu 503 kimi qaytarır (model xətası 502-dən fərqli). */
export class LlmConfigError extends Error {}

let anthropic: Anthropic | null = null;
let gemini: GoogleGenAI | null = null;

export async function complete({ system, messages, maxTokens, json, task = "scoring" }: CompleteArgs): Promise<string> {
  if (provider() === "claude") {
    if (!process.env.ANTHROPIC_API_KEY) throw new LlmConfigError("AI modeli qoşulmayıb: ANTHROPIC_API_KEY təyin edilməyib");
    anthropic ??= new Anthropic();
    const res = await anthropic.messages.create({ model: modelName(task), max_tokens: maxTokens, system, messages });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new LlmConfigError("AI modeli qoşulmayıb: GEMINI_API_KEY təyin edilməyib");
  const inputBytes = Buffer.byteLength(system + messages.map(m => m.content).join(''), 'utf8');
  if (inputBytes > 48_000) throw new Error('Model üçün mətn çox uzundur. Daha qısa məşq və ya xidmət standartı seçin.');
  const outputLimit = maxTokens * 2;
  const price = task === 'customer' ? { input: 0.30, output: 2.50 } : { input: 0.75, output: 3.75 };
  // UTF-8 baytları ilə ehtiyat hesablanır; uğurlu cavab real token istifadəsi ilə hesablaşır.
  const ticket = await reserveDemo(task, ((inputBytes + 2048) * price.input + outputLimit * price.output) / 1_000_000);
  gemini ??= new GoogleGenAI({ apiKey, httpOptions: { timeout: 70_000, retryOptions: { attempts: 1 } } });
  const res = await gemini.models.generateContent({
    model: modelName(task),
    contents: messages.map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
    config: {
      abortSignal: AbortSignal.timeout(75_000),
      systemInstruction: system,
      // Düşünmə və cavab üçün məhdud ehtiyat; uzun JSON kəsilərsə xəta göstərilir.
      maxOutputTokens: outputLimit,
      thinkingConfig: { thinkingLevel: task === "customer" ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW },
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  });
  const usage = res.usageMetadata;
  if (usage?.promptTokenCount !== undefined && usage.totalTokenCount !== undefined) {
    const output = Math.max(0, usage.totalTokenCount - usage.promptTokenCount);
    await settleDemo(ticket, (usage.promptTokenCount * price.input + output * price.output) / 1_000_000);
    console.info('gemini-usage', { task, inputTokens: usage.promptTokenCount, outputTokens: output });
  }
  return res.text ?? "";
}
