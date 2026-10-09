import Link from "next/link";
import { readCalls, readReports } from "@/components/server-data";
import { BarList, CallsTable, DataNotice, Metric, PageHeading } from "@/components/ui";
import { averageResult, criterionAverages, number } from "@/components/view-helpers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const callsResult = await readCalls();
  const calls = callsResult.data.filter((call) => Date.now() - new Date(call.created_at).getTime() <= 7 * 86400000);
  const reports = await readReports(calls);
  const criteria = reports.error ? [] : criterionAverages(reports.data.flatMap((report) => report.scores));
  const weakest = criteria.length ? criteria[criteria.length - 1].label : "—";
  const departments = new Map<string, typeof calls>();
  for (const { call } of reports.data) {
    const label = call.scenarios?.department ?? "Departament göstərilməyib";
    departments.set(label, [...(departments.get(label) ?? []), call]);
  }
  const average = averageResult(calls);
  const skippedIdentity = reports.error || !reports.data.length ? null : reports.data.filter(({ scores }) => scores.some((score) => score.criterion_name.toLocaleLowerCase("az-AZ").includes("şəxsiyyət") && score.score === 0)).length;
  return <main id="main-content" className="page">
    <PageHeading title="Xidmət keyfiyyəti · son 7 gün" description="NovaBank üzrə məşq zəngləri və qiymətləndirmə nəticələri." action={<Link className="btn" href="/operators">Operatorlar</Link>} />
    <DataNotice error={callsResult.error || reports.error} />
    <section className="metrics" aria-label="Ümumi göstəricilər"><Metric label="Qiymətləndirilmiş zəng" value={callsResult.error ? "—" : calls.length} /><Metric label="Orta nəticə" value={average === null ? "—" : number(average)} suffix={average === null ? undefined : "%"} /><Metric label="Şəxsiyyət yoxlaması · 0 bal" value={skippedIdentity ?? "—"} suffix={skippedIdentity === null ? undefined : "zəngdə"} warn /><Metric label="Ən zəif meyar" value={weakest} /></section>
    <div className="two-column"><section className="card"><h2>Departamentlər üzrə orta nəticə (%)</h2><BarList items={reports.error ? [] : [...departments].map(([label, rows]) => ({ label, value: averageResult(rows) ?? 0, max: 100 }))} /></section><section className="card"><h2>Meyarlar üzrə orta bal (maks. 2)</h2><BarList items={criteria} /></section></div>
    <section className="card"><div className="section-heading"><h2>Son zənglər</h2><Link className="strong-link" href="/reports">Bütün hesabatlar</Link></div><CallsTable calls={calls.slice(0, 10)} profileLinks /><p className="table-footer">Göstəricilər son 100 qeyddən son 7 günə düşən zənglər üzrə hesablanır. Fərqli meyar saylı ssenarilər faizlə müqayisə edilir.</p></section>
  </main>;
}
