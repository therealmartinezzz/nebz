import Link from "next/link";
import { listCalls } from "@/server/queries";
import { fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Reports() {
  const calls = await listCalls();

  return (
    <main className="page">
      <h1>Hesabatlar</h1>
      <section className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 13 }} className="muted">
              <th style={{ padding: 8 }}>Operator</th>
              <th style={{ padding: 8 }}>Ssenari</th>
              <th style={{ padding: 8 }}>Müddət</th>
              <th style={{ padding: 8 }}>Etibarlılıq</th>
              <th style={{ padding: 8, textAlign: "right" }}>Bal</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "12px 8px" }}><Link href={`/report/${c.id}`}>{c.operator_name}</Link></td>
                <td style={{ padding: "12px 8px" }}>{c.scenarios?.title}</td>
                <td style={{ padding: "12px 8px" }} className="mono">{fmtTime(c.duration_sec || 0)}</td>
                <td style={{ padding: "12px 8px" }}>{c.confidence === "low" ? "aşağı" : "yüksək"}</td>
                <td style={{ padding: "12px 8px", textAlign: "right" }} className="mono">{c.total}/{c.max_total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!calls.length && <p className="muted">Hələ zəng yoxdur.</p>}
      </section>
    </main>
  );
}
