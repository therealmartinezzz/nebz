import Link from "next/link";
import { notFound } from "next/navigation";
import { getCallReport } from "@/server/queries";
import { fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getCallReport(id);
  if (!report) notFound();
  const { call, scores } = report;

  const pct = call.max_total ? Math.round((call.total / call.max_total) * 100) : 0;
  const transcript = call.transcript || [];

  return (
    <main className="page">
      <div className="row">
        <section className="card grow" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="muted" style={{ fontSize: 13 }}>
            Zəng hesabatı · {new Date(call.created_at).toLocaleString("az-AZ")} · {fmtTime(call.duration_sec || 0)}
          </div>
          <h1 style={{ margin: 0 }}>{call.operator_name} · {call.scenarios?.department}</h1>
          <div className="muted">Ssenari: {call.scenarios?.title} · Rejim: {call.mode === "voice" ? "səsli" : "mətn"}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <span className={`pill ${call.confidence === "low" ? "warn" : "ok"}`}>
              Etibarlılıq: {call.confidence === "low" ? "aşağı — rəhbər baxmalıdır" : "yüksək"}
            </span>
            {call.training_recommendation && <span className="pill warn">Tövsiyə: {call.training_recommendation}</span>}
          </div>
        </section>
        <section className="callpanel side" style={{ alignItems: "flex-start", textAlign: "left", justifyContent: "center" }}>
          <div style={{ fontSize: 13, color: "#c5cbd3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ümumi bal</div>
          <div className="mono" style={{ fontSize: 56, lineHeight: 1 }}>
            {call.total}<span style={{ fontSize: 28, color: "#c5cbd3" }}> / {call.max_total}</span>
          </div>
          <div style={{ width: "100%", height: 8, borderRadius: 4, background: "#2d3644" }}>
            <div style={{ width: `${pct}%`, height: 8, borderRadius: 4, background: "#3cc4b4" }} />
          </div>
        </section>
      </div>

      <section className="card" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <h2 style={{ marginTop: 16 }}>Meyarlar üzrə bal və sübut</h2>
        {scores?.map((s) => (
          <div key={s.id} className="crit">
            <div className={`score s${s.score}`}>{s.score}/2</div>
            <div style={{ flex: "1 1 200px", fontWeight: 600, paddingTop: 7 }}>{s.criterion_name}</div>
            <div style={{ flex: "999 1 420px", minWidth: 0 }}>
              <div>«{s.evidence}»</div>
              <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>{s.reason}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="row">
        <section className="card side">
          <h2>Güclü tərəflər</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>{(call.strengths || []).map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
        </section>
        <section className="card side">
          <h2>İnkişaf sahələri</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>{(call.improvements || []).map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
        </section>
      </div>

      <details className="card">
        <summary style={{ fontWeight: 600, cursor: "pointer" }}>Tam transkript</summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {transcript.map((l, i) => (
            <div key={i}>
              <span className="mono muted" style={{ fontSize: 13 }}>{fmtTime(l.t)}</span>{" "}
              <b>{l.role === "operator" ? "Operator" : "Müştəri"}:</b> {l.text}
            </div>
          ))}
        </div>
      </details>

      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
        <span className="muted" style={{ fontSize: 14 }}>Balı AI verib. Son qərarı rəhbər verir, işçi bala etiraz edə bilər.</span>
        <Link className="btn primary" href="/">Yeni zəng</Link>
      </div>
    </main>
  );
}
