import Link from "next/link";
import Icon from "@/components/Icon";
import { readCalls, readReports } from "@/components/server-data";
import { BarList, CallsTable, DataNotice, EmptyState, Metric } from "@/components/ui";
import { averageResult, criterionAverages, date, decodeRouteName, initials, number } from "@/components/view-helpers";

export const dynamic = "force-dynamic";

export default async function OperatorPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = await params;
  const name = decodeRouteName(encodedName);
  const callsResult = await readCalls();
  const calls = callsResult.data.filter((call) => call.operator_name === name);
  const reports = await readReports(calls);
  const criteria = reports.error ? [] : criterionAverages(reports.data.flatMap((report) => report.scores));
  const average = averageResult(calls);
  const now = Date.now();
  const week = 7 * 86400000;
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const start = now - (4 - i) * week;
    const end = start + week;
    const rows = calls.filter((call) => { const timestamp = new Date(call.created_at).getTime(); return timestamp >= start && timestamp < end; });
    return { label: date(new Date(start).toISOString()).slice(0, 5), value: averageResult(rows), count: rows.length };
  });
  const change = weeks[0].value !== null && weeks[3].value !== null ? weeks[3].value - weeks[0].value : null;
  const latest = reports.data.find(({ call }) => call.id === calls[0]?.id)?.call;
  const departments = [...new Set(reports.data.map(({ call }) => call.scenarios?.department).filter(Boolean))];
  return <main id="main-content" className="page">
    <Link href="/dashboard" className="back-link"><Icon name="arrow" width="16" height="16" />Panel</Link>
    <div className="profile-header"><div className="persona"><div className="avatar operator" aria-hidden="true">{initials(name)}</div><div><h1>{name}</h1><p className="muted">Operator{departments.length ? ` · ${departments.join(", ")}` : " profili"}</p></div></div><Link className="btn primary" href={`/?name=${encodeURIComponent(name)}`}>Məşq seç</Link></div>
    <DataNotice error={callsResult.error || reports.error} />
    <section className="metrics" aria-label="Operatorun göstəriciləri"><Metric label="Qiymətləndirilmiş zəng" value={callsResult.error ? "—" : calls.length} /><Metric label="Orta nəticə" value={average === null ? "—" : number(average)} suffix={average === null ? undefined : "%"} /><Metric label="Son 4 həftədə dəyişiklik" value={change === null ? "—" : `${change > 0 ? "+" : ""}${number(change)}`} suffix={change === null ? undefined : "faiz bəndi"} /><Metric label="Səsli məşq" value={reports.error || callsResult.error ? "—" : reports.data.filter(({ call }) => call.mode === "voice").length} /></section>
    <div className="two-column"><section className="card"><h2>Həftəlik orta nəticə (%)</h2>{weeks.some((item) => item.count) ? <figure className="weekly-chart" aria-label="Son dörd həftənin orta nəticələri">{weeks.map((item) => <div className="week-column" key={item.label}><div className="week-bar-space"><span className="mono">{item.value === null ? "—" : `${number(item.value)}%`}</span>{item.value !== null && <div className="week-bar" style={{ height: `${Math.max(0, Math.min(100, item.value)) * 1.3}px` }} />}</div><span className="muted">{item.label}</span><span className="muted small">{item.count ? `${item.count} zəng` : "Zəng yoxdur"}</span></div>)}</figure> : <EmptyState compact title="Trend üçün hələ data yoxdur" description="Son 4 həftədəki zənglər olduqda həftəlik nəticələr burada görünəcək." />}</section><section className="card"><h2>Meyarlar üzrə (maks. 2)</h2><BarList items={criteria} /></section></div>
    <div className="split"><section className="card"><h2>Məşqlər</h2>{latest?.training_recommendation ? <div className="stack"><span className="pill warn">AI tövsiyəsi</span><p>{latest.training_recommendation}</p><Link className="btn" href={`/?name=${encodeURIComponent(name)}`}>Uyğun məşqi seç</Link></div> : <EmptyState compact title="Hələ məşq tövsiyəsi yoxdur" description="Son zəngin inkişaf sahələrinə uyğun tövsiyə burada görünəcək." />}<Link className="strong-link" href={`/me?name=${encodeURIComponent(name)}`}>İşçinin “Məşqlərim” səhifəsi</Link></section><section className="card"><h2>Zəng tarixçəsi</h2><CallsTable calls={calls} /></section></div>
    <p className="card muted small">Göstəricilər son 100 zəng arasında bu operatorun nəticələri üzrə hesablanır. Ballar inkişaf və məşq üçündür, avtomatik cəza üçün istifadə edilmir.</p>
  </main>;
}
