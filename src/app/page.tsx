import { listScenarios } from "@/server/queries";
import type { ScenarioCard } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let scenarios: ScenarioCard[] = [];
  let error = "";
  try {
    scenarios = await listScenarios();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="page">
      <div>
        <h1>Yeni məşq zəngi</h1>
        <p className="muted" style={{ margin: 0 }}>
          Ssenari seçin. AI müştəri rolunu oynayacaq, siz operatorsunuz. Zəngdən sonra hesabat hazırlanacaq.
        </p>
      </div>

      {error && <div className="error">Bazaya qoşulmaq olmadı: {error}</div>}

      {scenarios.map((s) => (
        <form key={s.id} action={`/call/${s.id}`} method="get" className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>{s.title}</h2>
            <div className="muted">{s.department}</div>
            {s.summary && <p style={{ marginBottom: 0 }}>{s.summary}</p>}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {s.rubric.map((c) => (
              <span key={c.id} style={{ padding: "6px 12px", border: "1px solid var(--line)", borderRadius: 999, fontSize: 14 }}>
                {c.name}
              </span>
            ))}
          </div>

          <div className="row" style={{ alignItems: "flex-end" }}>
            <label className="field" style={{ flex: "1 1 260px" }}>
              Operatorun adı
              <input type="text" name="name" required placeholder="Məsələn: Aysel H." />
            </label>
            <label className="field" style={{ flex: "1 1 220px" }}>
              Rejim
              <select name="mode" defaultValue="voice">
                <option value="voice">Səsli zəng</option>
                <option value="text">Mətn (ehtiyat)</option>
              </select>
            </label>
            <button className="btn primary" type="submit">Zəngi başlat</button>
          </div>
        </form>
      ))}

      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        AI bal verir, son qərarı rəhbər verir. Ölçülən emosiya deyil, operatorun dedikləri və etdikləridir.
      </p>
    </main>
  );
}
