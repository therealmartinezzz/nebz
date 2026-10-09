"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReviewItem } from "@/components/contracts";
import { EmptyState } from "@/components/ui";
import ReviewForm from "@/components/ReviewForm";
import { date } from "@/components/view-helpers";
import { fmtTime } from "@/lib/format";

type Filter = "all" | "dispute" | "low_confidence";
const itemKey = (item: ReviewItem) => `${item.reason}:${item.call.id}:${item.dispute?.id ?? item.score?.id ?? "call"}`;

export default function ReviewClient({ items }: { items: ReviewItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedKey, setSelectedKey] = useState("");
  const [resolved, setResolved] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const remaining = items.filter((item) => {
    const scores = item.score ? [item.score] : item.scores ?? [];
    return !scores.length || scores.some((score) => !resolved[itemKey(item)]?.includes(score.id));
  });
  const visible = remaining.filter((item) => filter === "all" || item.reason === filter);
  const selected = visible.find((item) => itemKey(item) === selectedKey) ?? visible[0];
  const scores = selected ? (selected.score ? [selected.score] : selected.scores ?? []).filter((score) => !resolved[itemKey(selected)]?.includes(score.id)) : [];
  const tabs: { value: Filter; label: string }[] = [{ value: "all", label: "Hamısı" }, { value: "dispute", label: "Etirazlar" }, { value: "low_confidence", label: "Aşağı etibarlılıq" }];

  return <>
    <div className="tabs" aria-label="Yoxlama növbəsi filtrləri">{tabs.map((tab) => <button key={tab.value} type="button" aria-pressed={filter === tab.value} onClick={() => { setFilter(tab.value); setSelectedKey(""); }}>{tab.label} · {tab.value === "all" ? remaining.length : remaining.filter((item) => item.reason === tab.value).length}</button>)}</div>
    {message && <div className="notice">{message}</div>}
    <div className="split"><section className="select-list" aria-label="Yoxlanacaq zənglər">{visible.map((item) => <button key={itemKey(item)} type="button" className="select-item" aria-pressed={selected && itemKey(selected) === itemKey(item)} onClick={() => setSelectedKey(itemKey(item))}><span className="select-item-title"><strong>{item.call.operator_name}</strong><span className={`pill ${item.reason === "dispute" ? "warn" : "neutral"}`}>{item.reason === "dispute" ? "Etiraz" : "Aşağı etibarlılıq"}</span></span><span className="muted small">{item.call.scenario_title}{item.score ? ` · ${item.score.criterion_name}: ${item.score.score}/2` : " · bütün zəng yoxlanmalıdır"}</span></button>)}{!visible.length && <div className="card"><EmptyState compact title={filter === "all" ? "Yoxlama növbəsi boşdur" : "Bu filtrdə zəng yoxdur"} description="Yoxlanacaq zənglər və əlçatan etirazlar burada görünəcək." /></div>}</section>
      <section className="card stack">
        {selected ? <>
          <div><p className="muted small">{selected.call.operator_name}{selected.call.department && ` · ${selected.call.department}`} · {date(selected.call.created_at)}</p><h2>{selected.score ? `${selected.score.criterion_name} · AI balı ${selected.score.score}/2` : "Zəng üzrə yoxlama"}</h2><Link href={`/report/${selected.call.id}`} className="strong-link">Tam hesabata bax</Link></div>
          {selected.dispute && <div className="info-block warn"><h3>İşçinin etirazı</h3><p>{selected.dispute.comment || "Etiraz mətni əlavə edilməyib."}</p></div>}
          <section><h3>Transkriptdən</h3>{selected.transcript_excerpt.length ? selected.transcript_excerpt.slice(0, selected.score ? 4 : 6).map((line, i) => <div className="transcript-entry" key={i}><time className="mono muted small">{fmtTime(line.t)}</time><p><strong>{line.role === "operator" ? "Operator" : "Müştəri"}:</strong> {line.text}</p></div>) : <p className="muted">Transkript fraqmenti əlçatan deyil. Tam hesabatı yoxlayın.</p>}</section>
          {selected.transcript?.length ? <details className="transcript-detail"><summary>Tam transkript · {selected.transcript.length} replika</summary>{selected.transcript.map((line, i) => <div className="transcript-entry" key={i}><time className="mono muted small">{fmtTime(line.t)}</time><p><strong>{line.role === "operator" ? "Operator" : "Müştəri"}:</strong> {line.text}</p></div>)}</details> : null}
          {scores.length ? <ReviewForm key={`${itemKey(selected)}:${scores.map((score) => score.id).join(",")}`} scores={scores} kind="manager" onSaved={(review) => { const key = itemKey(selected); setResolved((current) => ({ ...current, [key]: [...(current[key] ?? []), review.score_id] })); setMessage(`Rəhbərin qərarı saxlanıldı: ${review.new_score}/2. Qalan meyarları yoxlaya bilərsiniz.`); }} /> : <p className="muted">Bu zəngin meyar balları yüklənməyib; qərar verməzdən əvvəl tam hesabata baxın.</p>}
        </> : <EmptyState title="Rəhbərin qərarı üçün yer" description="Növbədən zəng seçdikdə AI balı, sübut, etiraz və qərar forması burada görünəcək." action={<Link className="btn" href="/reports">Hesabatlara bax</Link>} />}
      </section>
    </div>
  </>;
}
