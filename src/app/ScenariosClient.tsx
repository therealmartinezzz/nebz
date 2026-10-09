"use client";

import Link from "next/link";
import { useState } from "react";
import type { ScenarioCard } from "@/lib/types";
import Icon from "@/components/Icon";
import { EmptyState } from "@/components/ui";

export default function ScenariosClient({ scenarios, operatorName }: { scenarios: ScenarioCard[]; operatorName: string }) {
  const [selectedId, setSelectedId] = useState(scenarios[0]?.id ?? "");
  const [mode, setMode] = useState("voice");
  const selected = scenarios.find((scenario) => scenario.id === selectedId);
  return <div className="split">
    <section className="stack tight" aria-label="Ssenari seçimi">
      <h2>Ssenarilər</h2>
      <div className="select-list">{scenarios.map((scenario) => <button type="button" className="select-item" aria-pressed={scenario.id === selectedId} onClick={() => setSelectedId(scenario.id)} key={scenario.id}>
        <span className="select-item-title"><strong>{scenario.title}</strong>{scenario.id === selectedId && <span className="pill ok"><Icon name="check" width="13" height="13" />Seçilib</span>}</span>
        <span className="muted small">{scenario.department} · {scenario.rubric.length} meyar</span>
      </button>)}</div>
      {!scenarios.length && <div className="card"><EmptyState compact title="Hələ ssenari yoxdur" description="Şirkətin standartından ilk məşq ssenarisini yaradın." /></div>}
      <Link className="back-link" href="/scenarios/new"><Icon name="plus" width="17" height="17" />Standartdan yeni ssenari yarat</Link>
    </section>
    <section className="card stack scenario-detail" aria-label="Seçilmiş ssenarinin detalları">
      {selected ? <>
        <div className="persona"><div className="avatar" aria-hidden="true">AI</div><div><h2>{selected.title}</h2><p className="muted">{selected.summary || "AI bu ssenaridə müştəri rolunu oynayacaq."}</p></div></div>
        <div className="form-grid"><div className="info-block"><h3>Departament</h3><strong>{selected.department}</strong></div><div className="info-block"><h3>Dil</h3><strong>Azərbaycan dili</strong></div></div>
        <section><h2>Ölçülən meyarlar · {selected.rubric.length * 2} bal</h2><div className="chip-list">{selected.rubric.map((criterion) => <span className="chip" key={criterion.id}>{criterion.name}</span>)}</div></section>
      </> : <><div className="persona"><div className="avatar" aria-hidden="true">AI</div><div><h2>AI müştəri ilə məşq</h2><p className="muted">Ssenari seçdikdə müştərinin vəziyyəti və qiymətləndirmə meyarları burada görünəcək.</p></div></div><div className="form-grid"><div className="info-block"><h3>Departament</h3><span className="muted">Ssenari seçilməyib</span></div><div className="info-block"><h3>Dil</h3><strong>Azərbaycan dili</strong></div></div><section><h2>Ölçülən meyarlar</h2><p className="muted">Hər meyar 0–2 bal aralığında, transkriptdən sübutla qiymətləndirilir.</p></section></>}
      <form action={selected ? `/call/${encodeURIComponent(selected.id)}` : undefined} method="get" className="stack">
        <label className="field">Operatorun adı<input type="text" name="name" defaultValue={operatorName} required maxLength={100} placeholder="Adınızı daxil edin" autoComplete="name" disabled={!selected} /></label>
        <fieldset><legend>Rejim</legend><div className="form-grid">
          <label className="radio-card"><input type="radio" name="mode" value="voice" checked={mode === "voice"} onChange={() => setMode("voice")} /><span><strong>Səsli məşq</strong><span className="muted">Brauzerdə canlı zəng. Mikrofona icazə tələb olunur.</span></span></label>
          <label className="radio-card"><input type="radio" name="mode" value="text" checked={mode === "text"} onChange={() => setMode("text")} /><span><strong>Mətn məşqi</strong><span className="muted">Eyni ssenari ilə yazılı söhbət. Səsli rejimə alternativ.</span></span></label>
        </div></fieldset>
        <div className="actions"><button className="btn primary" type="submit" disabled={!selected}><Icon name="phone" />Zəngi başlat</button><span className="muted small">Siz operator, AI isə müştəri rolundadır.</span></div>
      </form>
      <p className="scenario-note">AI bal verir, son qərarı insan verir. Emosiya deyil, davranış ölçülür. Ssenarilər sintetikdir. Şirkətin telefon xəttinə gizli zəng MVP-yə daxil deyil.</p>
    </section>
  </div>;
}
