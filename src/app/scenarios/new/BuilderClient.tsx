"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioDraft } from "@/components/contracts";
import { postJSON } from "@/components/api-client";
import { EmptyState, PageHeading } from "@/components/ui";
import { practiceHref } from "@/components/view-helpers";

const customerTypes = ["Əsəbi", "Tələsən", "Çaşqın", "Yaşlı"];
const levels = ["0", "1", "2"] as const;
function validDraft(value: ScenarioDraft) {
  return Boolean(value?.title?.trim() && value.summary?.trim() && value.persona_prompt?.trim() && Array.isArray(value.rubric) && value.rubric.length >= 3 && value.rubric.length <= 8 && new Set(value.rubric.map((criterion) => criterion.id)).size === value.rubric.length && value.rubric.every((criterion) => Number.isInteger(criterion.id) && criterion.name?.trim() && criterion.source?.trim() && levels.every((level) => criterion.levels?.[level]?.trim())));
}

export default function BuilderClient() {
  const router = useRouter();
  const [standard, setStandard] = useState("");
  const [department, setDepartment] = useState("Kart xidmətləri");
  const [customers, setCustomers] = useState(["Əsəbi", "Tələsən"]);
  const [difficulty, setDifficulty] = useState("medium");
  const [draft, setDraft] = useState<ScenarioDraft | null>(null);
  const [extras, setExtras] = useState({ hidden: "", trap: "", solution: "" });
  const [operatorName, setOperatorName] = useState("");
  const [busy, setBusy] = useState<"generate" | "save" | "test" | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    if (!standard.trim() || busy) return;
    setBusy("generate"); setError("");
    try {
      const result = await postJSON<ScenarioDraft>("/api/scenarios/draft", { standard: standard.trim(), department, language: "az", customerType: customers.join(", "), difficulty });
      if (!validDraft(result)) throw new Error("AI qaralaması tələb olunan formaya uyğun deyil. Yenidən yaradın; mənbə mətni formadadır.");
      setDraft(result); setExtras({ hidden: "", trap: "", solution: "" });
    } catch (e) { setError(e instanceof Error ? e.message : "Qaralama yaradılmadı."); }
    finally { setBusy(null); }
  }
  async function save(test = false) {
    if (!draft || busy) return;
    if (!validDraft(draft)) { setError("Başlıq, xülasə, persona və 3–8 meyarı tamamlayın. Hər meyarın 0, 1, 2 bal səviyyəsi və mənbə bəndi olmalıdır."); return; }
    if (test && !operatorName.trim()) { setError("Sınaq zəngi üçün operatorun adını daxil edin."); return; }
    setBusy(test ? "test" : "save"); setError("");
    const additions = [["Gizli fakt", extras.hidden], ["Tələ anı", extras.trap], ["Düzgün həll", extras.solution]].filter(([, text]) => text.trim()).map(([label, text]) => `${label}: ${text.trim()}`).join("\n");
    try {
      const result = await postJSON<{ id: string }>("/api/scenarios", { ...draft, persona_prompt: [draft.persona_prompt, additions].filter(Boolean).join("\n\n"), department });
      if (!result.id) throw new Error("Ssenarinin saxlanması təsdiqlənmədi. Yenidən cəhd edin.");
      router.push(test ? practiceHref(result.id, operatorName.trim()) : "/"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Ssenari saxlanılmadı."); }
    finally { setBusy(null); }
  }
  function updateCriterion(index: number, field: "name" | "source", value: string) {
    setDraft((current) => current ? { ...current, rubric: current.rubric.map((criterion, i) => i === index ? { ...criterion, [field]: value } : criterion) } : current);
  }
  function updateLevel(index: number, level: "0" | "1" | "2", value: string) {
    setDraft((current) => current ? { ...current, rubric: current.rubric.map((criterion, i) => i === index ? { ...criterion, levels: { ...criterion.levels, [level]: value } } : criterion) } : current);
  }

  return <>
    <PageHeading title="Yeni ssenari" description="Şirkətin xidmət standartını yapışdırın. AI ondan müştəri ssenarisi və qiymətləndirmə meyarları hazırlayır." action={<ol className="steps" aria-label="Ssenari yaratma mərhələləri"><li aria-current={!draft ? "step" : undefined}>1 Mənbə</li><li aria-current={draft ? "step" : undefined}>2 AI qaralaması</li><li>3 Sınaq və təsdiq</li></ol>} />
    {error && <div className="error" role="alert">{error}</div>}
    <div className="split"><form className="card stack" onSubmit={(event) => { event.preventDefault(); void generate(); }}><h2>Mənbə</h2>
      <label className="field">Xidmət standartı və ya zəng skripti<textarea rows={9} value={standard} onChange={(event) => setStandard(event.target.value)} placeholder="Standartın nömrələnmiş bəndlərini buraya yapışdırın" maxLength={30000} required disabled={Boolean(busy)} /><span className="hint">Yalnız mətn qəbul olunur. Real müştəri məlumatı daxil etməyin.</span></label>
      <div className="form-grid"><label className="field">Departament<select value={department} onChange={(event) => setDepartment(event.target.value)} disabled={Boolean(busy)}><option>Kart xidmətləri</option><option>Köçürmələr</option><option>Kreditlər</option><option>Müştəri xidmətləri</option></select></label><label className="field">Dil<select value="az" disabled><option value="az">Azərbaycan dili</option></select></label></div>
      <fieldset disabled={Boolean(busy)}><legend>Müştəri tipi</legend><div className="chip-list">{customerTypes.map((type) => <button key={type} type="button" className="chip-button" aria-pressed={customers.includes(type)} onClick={() => setCustomers((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])}>{type}</button>)}</div></fieldset>
      <fieldset disabled={Boolean(busy)}><legend>Çətinlik</legend><div className="score-options">{[{ value: "low", label: "Aşağı" }, { value: "medium", label: "Orta" }, { value: "high", label: "Yüksək" }].map((item) => <label key={item.value}><input type="radio" name="difficulty" value={item.value} checked={difficulty === item.value} onChange={() => setDifficulty(item.value)} />{item.label}</label>)}</div></fieldset>
      <button className="btn primary full" type="submit" disabled={Boolean(busy) || !standard.trim() || !customers.length}>{busy === "generate" ? "AI qaralama hazırlayır…" : draft ? "AI ilə yenidən yarat" : "AI qaralaması yarat"}</button>
    </form><div className="stack">
      <section className="card stack"><div className="section-heading"><h2>AI qaralaması{draft?.title && ` · ${draft.title}`}</h2><span className="muted small">Hər sahə redaktə olunur</span></div>
        {draft ? <><label className="field">Ssenarinin başlığı<input type="text" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} disabled={Boolean(busy)} maxLength={200} /></label><label className="field">Xülasə<textarea rows={2} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} disabled={Boolean(busy)} /></label><div className="form-grid"><label className="field info-block">Persona<textarea className="draft-field" rows={4} value={draft.persona_prompt} onChange={(event) => setDraft({ ...draft, persona_prompt: event.target.value })} disabled={Boolean(busy)} /></label><label className="field info-block">Gizli fakt<textarea className="draft-field" rows={4} value={extras.hidden} onChange={(event) => setExtras({ ...extras, hidden: event.target.value })} disabled={Boolean(busy)} placeholder="Persona üçün əlavə fakt (istəyə bağlı)" /></label><label className="field info-block warn">Tələ anı<textarea className="draft-field" rows={3} value={extras.trap} onChange={(event) => setExtras({ ...extras, trap: event.target.value })} disabled={Boolean(busy)} placeholder="Standartın yoxlandığı an (istəyə bağlı)" /></label><label className="field info-block accent">Düzgün həll<textarea className="draft-field" rows={3} value={extras.solution} onChange={(event) => setExtras({ ...extras, solution: event.target.value })} disabled={Boolean(busy)} placeholder="Gözlənilən həll yolu (istəyə bağlı)" /></label></div></> : <EmptyState title="Qaralama hələ yaradılmayıb" description="Mənbə mətni və müştəri tipini seçərək AI qaralaması yaradın. Persona, gizli fakt, tələ anı və həll burada redaktə olunur." />}
      </section>
      <section className="card"><h2>Qiymətləndirmə meyarları</h2><p className="muted small">Hər meyar standartın konkret bəndinə bağlıdır. Hər səviyyə davranışı təsvir etməlidir.</p>{draft ? <div className="rubric-editor">{draft.rubric.map((criterion, index) => <fieldset key={criterion.id} disabled={Boolean(busy)}><legend>Meyar {index + 1}</legend><div className="form-grid"><label className="field">Meyarın adı<input type="text" value={criterion.name} onChange={(event) => updateCriterion(index, "name", event.target.value)} /></label><label className="field">Mənbə bəndi<input type="text" value={criterion.source} onChange={(event) => updateCriterion(index, "source", event.target.value)} /></label></div><div className="rubric-levels">{levels.map((level) => <label key={level} className="field">{level}/2 bal üçün<textarea rows={3} value={criterion.levels[level]} onChange={(event) => updateLevel(index, level, event.target.value)} /></label>)}</div></fieldset>)}</div> : <EmptyState compact title="Standarta bağlı 3–8 meyar" description="Qaralama yaradıldıqda 0, 1 və 2 bal üçün davranış təsvirləri burada görünəcək." />}</section>
      <label className="field">Sınaq zəngi üçün operatorun adı<input type="text" value={operatorName} onChange={(event) => setOperatorName(event.target.value)} placeholder="Adınızı daxil edin" maxLength={100} disabled={Boolean(busy) || !draft} /></label>
      <div className="actions end"><button className="btn" type="button" disabled={!draft || Boolean(busy)} onClick={() => void save(true)}>{busy === "test" ? "Saxlanılır…" : "Saxla və sınaq zəngi et"}</button><button className="btn primary" type="button" disabled={!draft || Boolean(busy)} onClick={() => void save()}>{busy === "save" ? "Saxlanılır…" : "Təsdiqlə və saxla"}</button></div>
    </div></div>
  </>;
}
