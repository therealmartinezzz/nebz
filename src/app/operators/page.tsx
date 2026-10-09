import Link from "next/link";
import { readCalls } from "@/components/server-data";
import { DataNotice, EmptyState, PageHeading } from "@/components/ui";
import { averageResult, initials, number } from "@/components/view-helpers";

export const dynamic = "force-dynamic";

export default async function OperatorsPage() {
  const { data: calls, error } = await readCalls();
  const names = [...new Set(calls.map((call) => call.operator_name))].sort((a, b) => a.localeCompare(b, "az"));
  return <main id="main-content" className="page"><PageHeading title="Operatorlar" description="Zəng nəticələri, inkişaf sahələri və məşq tarixçəsi." action={<Link href="/dashboard" className="btn">Şirkət paneli</Link>} /><DataNotice error={error} /><section className="card">{names.length ? names.map((name) => { const history = calls.filter((call) => call.operator_name === name); const average = averageResult(history); return <div className="list-row" key={name}><div className="persona"><div className="avatar operator" aria-hidden="true">{initials(name)}</div><div><Link className="strong-link" href={`/operators/${encodeURIComponent(name)}`}>{name}</Link><p className="muted small">{history.length} zəng · orta nəticə: {average === null ? "—" : `${number(average)}%`}</p></div></div><Link className="btn" href={`/operators/${encodeURIComponent(name)}`}>Profilə bax</Link></div>; }) : <EmptyState title="Hələ operator nəticəsi yoxdur" description="Tamamlanan məşq zənglərindəki operatorlar burada görünəcək." action={<Link className="btn primary" href="/">İlk məşqə başla</Link>} />}<p className="table-footer">Siyahı son 100 qiymətləndirilmiş zəng üzrə hazırlanır.</p></section></main>;
}
