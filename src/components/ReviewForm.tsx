"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScoreRow } from "@/lib/types";
import type { Review } from "./contracts";
import { postJSON } from "./api-client";
import { useErrorNotification, useNotify } from "./Notifications";

export default function ReviewForm({ scores, kind, onSaved }: { scores: ScoreRow[]; kind: "manager" | "dispute"; onSaved?: (review: Review) => void }) {
  const formId = useId();
  const router = useRouter();
  const [scoreId, setScoreId] = useState(scores[0]?.id ?? "");
  const selected = scores.find((score) => score.id === scoreId);
  const [newScore, setNewScore] = useState<0 | 1 | 2>(selected?.score ?? 0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const notify = useNotify();
  useErrorNotification(error, "Qeyd saxlanılmadı");

  async function save(keepAI = false) {
    if (!selected || busy || !comment.trim()) return;
    setBusy(true); setError(""); setSuccess("");
    const value = keepAI ? selected.score : newScore;
    try {
      const result = await postJSON<{ id: string }>("/api/reviews", { scoreId, kind, ...(kind === "manager" ? { newScore: value } : {}), comment: comment.trim() });
      if (!result.id) throw new Error("Saxlanma təsdiqlənmədi. Yenidən cəhd edin.");
      onSaved?.({ id: result.id, score_id: scoreId, kind, new_score: kind === "manager" ? value : null, comment: comment.trim(), created_at: new Date().toISOString() });
      const message = kind === "dispute" ? "Etirazınız rəhbər yoxlamasına göndərildi." : `Rəhbərin qərarı saxlanıldı: ${value}/2.`;
      setSuccess(message);
      notify({ tone: "success", title: kind === "dispute" ? "Etiraz göndərildi" : "Qərar saxlanıldı", description: message });
      setComment("");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Saxlanma alınmadı."); }
    finally { setBusy(false); }
  }

  return <form className="stack" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    {scores.length > 1 && <label className="field">Meyar<select value={scoreId} disabled={busy} onChange={(event) => { const id = event.target.value; setScoreId(id); setNewScore(scores.find((score) => score.id === id)?.score ?? 0); setError(""); setSuccess(""); }}>{scores.map((score) => <option value={score.id} key={score.id}>{score.criterion_name} · AI: {score.score}/2</option>)}</select></label>}
    {kind === "manager" && selected && <section className="info-block"><h3>{selected.criterion_name} · AI balı {selected.score}/2</h3><p>{selected.evidence ? `«${selected.evidence}»` : "Bu meyar üçün AI sübutu təqdim edilməyib."}</p><p className="muted small">{selected.reason || "AI əsaslandırması təqdim edilməyib."}</p></section>}
    {kind === "manager" && <fieldset disabled={busy}><legend>Rəhbərin qərarı</legend><div className="score-options">{([0, 1, 2] as const).map((value) => <label key={value}><input type="radio" name={`${formId}-score`} value={value} checked={newScore === value} onChange={() => setNewScore(value)} /><span className="mono">{value}/2</span></label>)}</div></fieldset>}
    <label className="field">{kind === "manager" ? "Qərarın əsaslandırılması" : "Etirazınızın səbəbi"}<textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} maxLength={3000} required disabled={busy || !selected} placeholder={kind === "manager" ? "Transkriptdən sübutla qərarınızı izah edin" : "Hansı davranışınızın nəzərə alınmadığını izah edin"} /></label>
    <p className="muted small">{kind === "manager" ? "Hər düzəliş qiymətləndirmə keyfiyyəti testinə və meyarların dəqiqləşdirilməsinə kömək edir." : "Etirazınıza rəhbər baxacaq. AI balı avtomatik yekun qərar deyil."}</p>
    {error && <div className="error">{error}</div>}
    {success && <div className="notice">{success}</div>}
    <div className="actions end">{kind === "manager" && <button className="btn" type="button" disabled={busy || !selected || !comment.trim()} onClick={() => void save(true)}>AI balını saxla</button>}<button className="btn primary" type="submit" aria-busy={busy} disabled={busy || !selected || !comment.trim()}>{busy ? "Saxlanılır…" : kind === "manager" ? "Qərarı saxla" : "Etirazı göndər"}</button></div>
  </form>;
}
