import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Criterion, CriterionScore, Line, ScoreResult } from "@/lib/types";
import { fmtTime } from "@/lib/format";

const client = new Anthropic();
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";

function textOf(res: Anthropic.Message) {
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// Mətn rejimi: AI müştərinin növbəti cavabı.
export async function customerReply(persona: string, transcript: Line[]) {
  const messages = transcript.map((l) => ({
    role: l.role === "operator" ? ("user" as const) : ("assistant" as const),
    content: l.text,
  }));
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: persona + "\n\nYalnız müştərinin sözlərini yaz, təsvir və ya qeyd əlavə etmə.",
    messages,
  });
  return textOf(res).trim();
}

const SYSTEM = `Sən çağrı mərkəzi keyfiyyət auditorusan. Sənə bank operatoru (OPERATOR) ilə müştəri (MÜŞTƏRİ) arasındakı zəngin transkripti verilir. Yalnız OPERATORU qiymətləndir.

Qaydalar:
- Hər meyara yalnız 0, 1 və ya 2 bal ver, meyarın səviyyə təsvirlərinə uyğun.
- "evidence" sahəsinə transkriptdən operatorun dəqiq sözlərini vaxtı ilə yaz, məsələn: "[00:21] Narahatlığa görə üzr istəyirəm". Sübut yoxdursa "Sübut yoxdur" yaz.
- Emosiya, xarakter və ya şəxsiyyət haqqında nəticə çıxarma. Yalnız deyilənləri və edilənləri qiymətləndir.
- Transkript qeyri-müəyyəndirsə, natamamdırsa və ya səs tanıma xətası görünürsə, "confidence": "low" yaz.
- Bütün mətnlər Azərbaycan dilində olsun.

Yalnız bu JSON-u qaytar, başqa heç nə yazma:
{"scores":[{"criterion":1,"score":0,"evidence":"...","reason":"..."}],"strengths":["..."],"improvements":["..."],"training_recommendation":"...","confidence":"high"}`;

export async function scoreCall(rubric: Criterion[], transcript: Line[]): Promise<ScoreResult> {
  const rubricText = rubric
    .map((c) => `${c.id}. ${c.name}\n   0: ${c.levels["0"]}\n   1: ${c.levels["1"]}\n   2: ${c.levels["2"]}`)
    .join("\n");
  const transcriptText = transcript
    .map((l) => `[${fmtTime(l.t)}] ${l.role === "operator" ? "OPERATOR" : "MÜŞTƏRİ"}: ${l.text}`)
    .join("\n");

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    messages: [
      { role: "user", content: `MEYARLAR:\n${rubricText}\n\nTRANSKRİPT:\n${transcriptText}` },
    ],
  });

  const raw = textOf(res);
  const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));

  // Modelə tam etibar etmirik: hər meyarı yoxlayır, balı 0–2 aralığına salır, cəmi özümüz hesablayırıq.
  let confidence: "high" | "low" = parsed.confidence === "low" ? "low" : "high";
  const scores: CriterionScore[] = rubric.map((c) => {
    const s = (parsed.scores || []).find((x: { criterion: number }) => Number(x.criterion) === c.id);
    if (!s) confidence = "low";
    const n = Math.min(2, Math.max(0, Math.round(Number(s?.score ?? 0)))) as 0 | 1 | 2;
    return {
      criterion: c.id,
      criterion_name: c.name,
      score: n,
      evidence: String(s?.evidence ?? "Sübut yoxdur"),
      reason: String(s?.reason ?? "Model bu meyarı qiymətləndirmədi"),
    };
  });
  if (transcript.filter((l) => l.role === "operator").length < 2) confidence = "low";

  return {
    scores,
    total: scores.reduce((a, s) => a + s.score, 0),
    max_total: rubric.length * 2,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
    training_recommendation: String(parsed.training_recommendation ?? ""),
    confidence,
  };
}
