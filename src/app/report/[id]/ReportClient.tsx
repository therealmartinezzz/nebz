"use client";

import Link from "next/link";
import { useState } from "react";
import { fmtTime } from "@/lib/format";
import type { Report, Review } from "@/components/contracts";
import { EmptyState } from "@/components/ui";
import ReviewForm from "@/components/ReviewForm";
import { date } from "@/components/view-helpers";

export default function ReportClient({ report }: { report: Report | null }) {
  const [disputing, setDisputing] = useState(false);
  const [submitted, setSubmitted] = useState<Review[]>([]);
  const call = report?.call;
  const scores = report?.scores ?? [];
  const pct = call?.max_total ? Math.max(0, Math.min(100, call.total / call.max_total * 100)) : 0;
  return <>
    <div className="report-summary"><section className="card stack tight"><p className="muted small">Zəng hesabatı{call ? ` · ${date(call.created_at, true)} · ${call.duration_sec === null ? "Müddət yoxdur" : fmtTime(call.duration_sec)}` : " · məlumat gözlənilir"}</p><h1>{call ? <><Link className="plain-link" href={`/operators/${encodeURIComponent(call.operator_name)}`}>{call.operator_name}</Link>{call.scenarios?.department && ` · ${call.scenarios.department}`}</> : "Zəng hesabatı"}</h1><p className="muted">{call ? `Ssenari: ${call.scenarios?.title ?? "—"} · Rejim: ${call.mode === "voice" ? "səsli məşq" : "mətn məşqi"}` : "Zəngin nəticələri yükləndikdə burada görünəcək."}</p>{call && <div className="chip-list"><span className={`pill ${call.confidence === "low" ? "warn" : "ok"}`}>Etibarlılıq: {call.confidence === "low" ? "aşağı — rəhbər baxmalıdır" : "yüksək"}</span>{call.training_recommendation && <span className="pill warn">Məşq tövsiyəsi var</span>}</div>}</section><section className="callpanel score-summary"><h2 className="small muted">Ümumi AI balı</h2><div className="mono total">{call?.total ?? "—"}{call && <span> / {call.max_total}</span>}</div><div className="bar-track" role="meter" aria-label="Ümumi AI balı" aria-valuemin={0} aria-valuemax={call?.max_total || 1} aria-valuenow={call?.total ?? 0}><div style={{ width: `${pct}%` }} /></div><p className="muted small">Yekun qərarı rəhbər verir.</p></section></div>
    <section className="card"><h2>Meyarlar üzrə bal və sübut</h2>{scores.length ? scores.map((score) => {
      const reviews = [...(score.reviews ?? []), ...submitted.filter((review) => review.score_id === score.id)];
      const manager = reviews.filter((review) => review.kind === "manager").sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      const disputed = reviews.some((review) => review.kind === "dispute");
      return <div key={score.id} className="criterion-row"><div className={`score s${score.score}`}>{score.score}/2</div><div><h3>{score.criterion_name}</h3>{manager && <p className="small">AI: {score.score}/2 → <strong>Rəhbər: {manager.new_score}/2</strong></p>}{disputed && <span className="pill warn">Etiraz göndərilib</span>}</div><div className="criterion-evidence"><p>{score.evidence ? `«${score.evidence}»` : "Bu meyar üçün sitat təqdim edilməyib."}</p><p className="muted small">{score.reason}</p>{manager?.comment && <p className="small"><strong>Rəhbərin şərhi:</strong> {manager.comment}</p>}</div></div>;
    }) : <EmptyState title="Meyar balları əlçatan deyil" description="Qiymətləndirmə tamamlandıqda hər bal vaxt və transkriptdən sübutla göstəriləcək." />}</section>
    <section className="card feedback-grid"><div><h2>Güclü tərəflər</h2>{call?.strengths?.length ? <ul>{call.strengths.map((text, i) => <li key={i}>{text}</li>)}</ul> : <p className="muted">Hələ rəy yoxdur.</p>}</div><div><h2>İnkişaf sahələri</h2>{call?.improvements?.length ? <ul>{call.improvements.map((text, i) => <li key={i}>{text}</li>)}</ul> : <p className="muted">Hələ rəy yoxdur.</p>}</div><div><h2>Məşq tövsiyəsi</h2><p className="muted">{call?.training_recommendation || "Növbəti məşq üçün hələ tövsiyə yoxdur."}</p></div></section>
    <details className="card transcript-detail"><summary>Tam transkript</summary>{call?.transcript?.length ? call.transcript.map((line, i) => <div key={i} className="transcript-entry"><time className="mono muted small">{fmtTime(line.t)}</time><p><strong>{line.role === "operator" ? "Operator" : "AI müştəri"}:</strong> {line.text}</p></div>) : <p className="muted">Bu zəngin transkripti əlçatan deyil.</p>}</details>
    <section className="card"><div className="footer-note"><p className="muted small">Balı AI verib. Son qərarı rəhbər verir, işçi bala etiraz edə bilər. Ballar inkişaf üçündür.</p><div className="actions"><button className="btn" type="button" onClick={() => setDisputing(!disputing)} aria-expanded={disputing} aria-controls="dispute-form" disabled={!scores.length}>{disputing ? "Etiraz formasını bağla" : "Bala etiraz et"}</button><Link className="btn primary" href={call ? `/?name=${encodeURIComponent(call.operator_name)}` : "/"}>Məşq seç</Link>{call?.confidence === "low" && <Link className="btn" href="/review">Rəhbər yoxlaması</Link>}</div></div>{disputing && <div className="inline-form" id="dispute-form"><h2>Bala etiraz et</h2><ReviewForm scores={scores} kind="dispute" onSaved={(review) => setSubmitted((current) => [...current, review])} /></div>}</section>
  </>;
}
