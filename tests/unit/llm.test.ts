import { afterEach, describe, expect, it, vi } from "vitest";
import { complete, LlmConfigError, modelName, provider } from "@/server/llm";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("provayder seçimi (LLM_PROVIDER)", () => {
  it.each([
    [{ LLM_PROVIDER: "gemini", ANTHROPIC_API_KEY: "x" }, "gemini"],
    [{ LLM_PROVIDER: "CLAUDE", ANTHROPIC_API_KEY: "" }, "claude"],
    [{ LLM_PROVIDER: "", ANTHROPIC_API_KEY: "x" }, "claude"],
    [{ LLM_PROVIDER: "", ANTHROPIC_API_KEY: "" }, "gemini"],
    [{ LLM_PROVIDER: "openai", ANTHROPIC_API_KEY: "" }, "gemini"], // naməlum dəyər → default
  ])("%j → %s", (env, expected) => {
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    expect(provider()).toBe(expected);
  });

  it("model adları: default və env ilə", () => {
    vi.stubEnv("LLM_PROVIDER", "claude");
    vi.stubEnv("CLAUDE_MODEL", "");
    expect(modelName()).toBe("claude-sonnet-5-5");
    vi.stubEnv("LLM_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash-lite");
    expect(modelName()).toBe("gemini-3.5-flash-lite");
  });
});

describe("açar yoxdursa aydın konfiqurasiya xətası (şəbəkəyə getmədən)", () => {
  const args = { system: "s", messages: [{ role: "user" as const, content: "salam" }], maxTokens: 10 };

  it("claude", async () => {
    vi.stubEnv("LLM_PROVIDER", "claude");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    await expect(complete(args)).rejects.toThrow(LlmConfigError);
    await expect(complete(args)).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it("gemini", async () => {
    vi.stubEnv("LLM_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(complete(args)).rejects.toThrow(/GEMINI_API_KEY/);
  });
});
