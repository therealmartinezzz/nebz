import "server-only";
import type {
  Criterion,
  CriterionScore,
  Line,
  ScenarioDraft,
  ScenarioDraftInput,
  ScenarioMeta,
  ScoreResult,
} from "@/lib/types";
import { fmtTime } from "@/lib/format";
import { complete, type ChatMessage } from "./llm";

// Modelin cavabından JSON obyektini çıxarır (```json bloku və ya əlavə mətn olsa da).
function parseJson(raw: string, what: string) {
  try {
    return JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  } catch {
    throw new Error(`Model ${what} düzgün formatda qaytarmadı, yenidən cəhd edin`);
  }
}

// ---------------------------------------------------------------------------
// AI müştəri (mətn rejimi)
// ---------------------------------------------------------------------------

export async function customerReply(persona: string, transcript: Line[]) {
  // Ardıcıl eyni rollu replikaları birləşdiririk (məs. cavab alınmayanda operator iki dəfə yazıb).
  const messages: ChatMessage[] = [];
  for (const l of transcript) {
    const role = l.role === "operator" ? "user" : "assistant";
    const last = messages[messages.length - 1];
    if (last?.role === role) last.content += "\n" + l.text;
    else messages.push({ role, content: l.text });
  }
  const text = await complete({
    task: "customer",
    system: persona + "\n\nYalnız müştərinin sözlərini yaz, təsvir və ya qeyd əlavə etmə.",
    messages,
    maxTokens: 200,
  });
  return text.trim();
}

// ---------------------------------------------------------------------------
// Qiymətləndirmə
// ---------------------------------------------------------------------------

const SCORING_SYSTEM = `Sən çağrı mərkəzi keyfiyyət auditorusan. Sənə operator (OPERATOR) ilə müştəri (MÜŞTƏRİ) arasındakı zəngin transkripti verilir. Yalnız OPERATORU qiymətləndir.

Qaydalar:
- Hər meyara yalnız 0, 1 və ya 2 bal ver, meyarın səviyyə təsvirlərinə uyğun.
- "evidence" sahəsinə transkriptdən operatorun dəqiq sözlərini vaxtı ilə yaz, məsələn: "[00:21] Narahatlığa görə üzr istəyirəm". Sübut yoxdursa "Sübut yoxdur" yaz.
- Emosiya, xarakter və ya şəxsiyyət haqqında nəticə çıxarma. Yalnız deyilənləri və edilənləri qiymətləndir.
- Transkript qeyri-müəyyəndirsə, natamamdırsa və ya səs tanıma xətası görünürsə, "confidence": "low" yaz və "confidence_reason" sahəsində qısa səbəbi vaxtla göstər (məs. "01:12-də transkript aydın deyil"). Əks halda "confidence_reason": null.
- Bütün mətnlər Azərbaycan dilində olsun.

Yalnız bu JSON-u qaytar, başqa heç nə yazma:
{"scores":[{"criterion":1,"score":0,"evidence":"...","reason":"..."}],"strengths":["..."],"improvements":["..."],"training_recommendation":"...","confidence":"high","confidence_reason":null}`;

export async function scoreCall(rubric: Criterion[], transcript: Line[]): Promise<ScoreResult> {
  const rubricText = rubric
    .map((c) => `${c.id}. ${c.name}\n   0: ${c.levels["0"]}\n   1: ${c.levels["1"]}\n   2: ${c.levels["2"]}`)
    .join("\n");
  const transcriptText = transcript
    .map((l) => `[${fmtTime(l.t)}] ${l.role === "operator" ? "OPERATOR" : "MÜŞTƏRİ"}: ${l.text}`)
    .join("\n");

  const raw = await complete({
    task: "scoring",
    system: SCORING_SYSTEM,
    messages: [{ role: "user", content: `MEYARLAR:\n${rubricText}\n\nTRANSKRİPT:\n${transcriptText}` }],
    maxTokens: 2000,
    json: true,
  });
  const parsed = parseJson(raw, "qiymətləndirməni");

  // Modelə tam etibar etmirik: hər meyarı yoxlayır, balı 0–2 aralığına salır, cəmi özümüz hesablayırıq.
  const reasons: string[] = [];
  if (parsed.confidence === "low") reasons.push(String(parsed.confidence_reason || "Model əmin deyil"));
  const scores: CriterionScore[] = rubric.map((c) => {
    const s = (Array.isArray(parsed.scores) ? parsed.scores : []).find(
      (x: { criterion: number }) => Number(x?.criterion) === c.id
    );
    if (!s) reasons.push(`«${c.name}» meyarı qiymətləndirilmədi`);
    const n = Math.min(2, Math.max(0, Math.round(Number(s?.score ?? 0)) || 0)) as 0 | 1 | 2;
    return {
      criterion: c.id,
      criterion_name: c.name,
      score: n,
      evidence: String(s?.evidence ?? "Sübut yoxdur"),
      reason: String(s?.reason ?? "Model bu meyarı qiymətləndirmədi"),
    };
  });
  if (transcript.filter((l) => l.role === "operator").length < 2) reasons.push("Operatorun 2-dən az replikası var");

  return {
    scores,
    total: scores.reduce((a, s) => a + s.score, 0),
    max_total: rubric.length * 2,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
    training_recommendation: String(parsed.training_recommendation ?? ""),
    confidence: reasons.length ? "low" : "high",
    confidence_reason: reasons.length ? reasons.join("; ") : null,
  };
}

// ---------------------------------------------------------------------------
// Ssenari yaradıcısı (ekran 5)
// ---------------------------------------------------------------------------

// Hər personada mütləq olmalı qaydalar (docs/03-mvp-scope.md → ekran 5).
const REQUIRED_PERSONA_RULES = [
  { test: /AI olduğunu (demə|deməyin|bildirmə)/i, text: "- AI olduğunu demə, rolundan çıxma." },
  { test: /Azərbaycan dilində danış/i, text: "- Yalnız Azərbaycan dilində danış." },
  { test: /ilk sözünü gözlə/i, text: "- Operator salamlaşmadan danışmırsan, onun ilk sözünü gözləyirsən." },
];

const DIFFICULTY_TEXT = { low: "aşağı", medium: "orta", high: "yüksək" } as const;

const DRAFT_SYSTEM = `Sən çağrı mərkəzi təlim mütəxəssisisən. Şirkətin xidmət standartından operatorlar üçün məşq ssenarisi hazırlayırsan: AI-ın oynayacağı sintetik müştəri və operatoru qiymətləndirmək üçün meyarlar.

Qaydalar:
- Müştəri və bütün məlumatlar UYDURMADIR (sintetik): real şəxs, real kart nömrəsi, real şirkət müştərisi yoxdur. Yoxlama məlumatları lazımdırsa, uydurma dəyərlər ver (doğum tarixi, kartın son 4 rəqəmi və s.).
- Ssenaridə bir "tələ anı" olsun: müştəri operatoru standartın bir bəndini pozmağa sövq edir.
- 4–7 meyar yaz. Hər meyar standartın konkret bəndinə bağlı olsun: "source" sahəsinə bəndin nömrəsini yaz ("§3"); standartda yoxdursa "ümumi".
- Meyar səviyyələri: "0" = edilmədi/pozuldu, "1" = qismən, "2" = tam düzgün. Hər səviyyə konkret, müşahidə oluna bilən davranış olsun. Emosiya və ya xarakter qiymətləndirilmir, yalnız deyilən və edilən.
- persona_prompt AI müştəriyə ikinci şəxsdə yazılmış təlimatdır ("Sən ... -san"). Daxil et: vəziyyət, xarakter, yalnız soruşulanda deyiləcək məlumatlar, tələ anı (bir dəfə etiraz et, operator israr etsə razılaş), empatiyaya reaksiya, problem həll olunanda sağollaşma, qısa danışıq (hər dəfə 1–2 cümlə), AI olduğunu demə, operatorun ilk sözünü gözlə, yalnız Azərbaycan dilində danış.
- Bütün mətnlər Azərbaycan dilində.

Yalnız bu JSON-u qaytar:
{"title":"...","summary":"1–2 cümlə","customer_name":"Ad S.","hidden_fact":"...","trap":"...","correct_path":"...","persona_prompt":"...","rubric":[{"id":1,"name":"...","levels":{"0":"...","1":"...","2":"..."},"source":"§2"}]}`;

export async function draftScenario(input: ScenarioDraftInput): Promise<ScenarioDraft> {
  const raw = await complete({
    task: "draft",
    system: DRAFT_SYSTEM,
    messages: [
      {
        role: "user",
        content: `XİDMƏT STANDARTI:\n${input.standard}\n\nDepartament: ${input.department}\nMüştəri tipi: ${input.customerType}\nÇətinlik: ${DIFFICULTY_TEXT[input.difficulty]}\nDil: Azərbaycan`,
      },
    ],
    maxTokens: 3000,
    json: true,
  });
  const p = parseJson(raw, "ssenarini");
  const meta: ScenarioMeta = {
    customer_name: str(p.customer_name) || undefined,
    customer_type: input.customerType,
    difficulty: input.difficulty,
    language: "az",
    hidden_fact: str(p.hidden_fact) || undefined,
    trap: str(p.trap) || undefined,
    correct_path: str(p.correct_path) || undefined,
    standard: input.standard,
  };
  return normalizeScenario({
    title: str(p.title),
    // Frontend formasında xülasə məcburidir — model yazmasa, adla doldururuq (redaktə olunur).
    summary: str(p.summary) || str(p.title),
    persona_prompt: str(p.persona_prompt),
    rubric: p.rubric,
    meta,
  });
}

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export class ScenarioValidationError extends Error {}

/**
 * Qaralamanı (modeldən və ya redaktə formasından gələn) yoxlayır və təmizləyir.
 * Qaydalar: başlıq və persona boş deyil, 3–8 meyar, hər səviyyə boş deyil,
 * persona məcburi qaydaları ehtiva edir (yoxdursa sona əlavə olunur).
 */
export function normalizeScenario(d: {
  title: unknown;
  summary: unknown;
  persona_prompt: unknown;
  rubric: unknown;
  meta?: ScenarioMeta;
}): ScenarioDraft {
  const title = str(d.title);
  const summary = str(d.summary);
  let persona = str(d.persona_prompt);
  if (!title) throw new ScenarioValidationError("Ssenarinin adı boşdur");
  if (persona.length < 50) throw new ScenarioValidationError("Persona təsviri çox qısadır");

  const list = Array.isArray(d.rubric) ? d.rubric : [];
  if (list.length < 3 || list.length > 8) {
    throw new ScenarioValidationError(`Meyar sayı 3–8 olmalıdır (indi ${list.length})`);
  }
  const rubric = list.map((c: Record<string, unknown>, i: number) => {
    const levels = (c?.levels ?? {}) as Record<string, unknown>;
    const name = str(c?.name);
    const l0 = str(levels["0"]);
    const l1 = str(levels["1"]);
    const l2 = str(levels["2"]);
    if (!name || !l0 || !l1 || !l2) {
      throw new ScenarioValidationError(`${i + 1}-ci meyarın adı və ya səviyyə təsviri boşdur`);
    }
    return { id: i + 1, name, levels: { "0": l0, "1": l1, "2": l2 }, source: str(c?.source) || "ümumi" };
  });

  const missing = REQUIRED_PERSONA_RULES.filter((r) => !r.test.test(persona)).map((r) => r.text);
  if (missing.length) persona += "\n\nMəcburi qaydalar:\n" + missing.join("\n");

  return { title, summary, persona_prompt: persona, rubric, meta: d.meta ?? {} };
}
