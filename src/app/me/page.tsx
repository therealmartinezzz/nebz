import Link from "next/link";
import Icon from "@/components/Icon";
import { readCalls, readTraining } from "@/components/server-data";
import { DataNotice, EmptyState, OperatorPicker, PageHeading } from "@/components/ui";
import { date, practiceHref } from "@/components/view-helpers";

export const dynamic = "force-dynamic";

export default async function TrainingPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const { name: rawName } = await searchParams;
  const name = rawName?.trim() ?? "";
  const [training, calls] = await Promise.all([readTraining(name), readCalls()]);
  const names = [...new Set(calls.data.map((call) => call.operator_name))];
  const { last, recommended_scenario: scenario, history } = training.data;
  return <main id="main-content" className="page narrow">
    <PageHeading title="Məşqlərim" description={name ? `${name} · Son zənglərinizə görə məşq tövsiyələri və rəylər.` : "Son zənglərinizə görə məşq tövsiyələri və rəylər."} />
    <section className="card"><OperatorPicker names={names} selected={name} /></section>
    <DataNotice error={training.error || calls.error} />
    <section className="training-banner"><div><h2>{scenario?.title || (last?.training_recommendation ? "Növbəti məşq" : "İlk məşqinizi seçin")}</h2><p>{scenario?.summary || last?.training_recommendation || "AI müştəri ilə ssenari üzrə danışın, güclü tərəflərinizi və inkişaf sahələrinizi öyrənin."}</p></div><Link className="btn" href={scenario && name ? practiceHref(scenario.id, name) : name ? `/?name=${encodeURIComponent(name)}` : "/"}><Icon name="play" />{scenario ? "Məşqə başla" : "Ssenari seç"}</Link></section>
    <div className="two-column"><section className="card"><h2>Son rəy</h2>{last ? <><p className="muted">{last.scenarios?.title ?? "Ssenari"} · {date(last.created_at)} · <Link href={`/report/${last.id}`}>{last.total}/{last.max_total}</Link></p><div className="feedback-section"><h3>Yaxşı alınan</h3>{last.strengths?.length ? <ul>{last.strengths.map((text, i) => <li key={i}>{text}</li>)}</ul> : <p className="muted">Bu zəngdə güclü tərəflər qeyd edilməyib.</p>}</div><div className="feedback-section"><h3>Növbəti dəfə</h3>{last.improvements?.length ? <ul>{last.improvements.map((text, i) => <li key={i}>{text}</li>)}</ul> : <p className="muted">Bu zəngdə inkişaf sahələri qeyd edilməyib.</p>}</div></> : <EmptyState title={name ? "Hələ zəng rəyi yoxdur" : "Nəticələrinizi seçin"} description={name ? "İlk məşqi bitirdikdən sonra rəyiniz burada görünəcək." : "Operatorun adını daxil edərək mövcud zəng nəticələrinə baxın."} />}</section><section className="card"><h2>Tamamlanan məşqlər</h2>{history.length ? <>{history.map((call) => <div className="list-row" key={call.id}><Link className="plain-link" href={`/report/${call.id}`}>{call.scenarios?.title ?? "Ssenari"}<span className="muted small"> · {date(call.created_at)}</span></Link><Link className="mono" href={`/report/${call.id}`}>{call.total}/{call.max_total}</Link></div>)}<p className="table-footer">Bir bala etirazınız var? Hesabatda “Bala etiraz et” düyməsini istifadə edin.</p></> : <EmptyState title="Hələ tamamlanan məşq yoxdur" description="Qiymətləndirilmiş məşqləriniz hesabata keçidlə burada görünəcək." />}</section></div>
    <p className="card muted small">NovaBank · demo. Nəticələr operatorun adı ilə seçilir; demo mühitində giriş qorunması yoxdur. Ballar inkişaf üçündür, hər bala etiraz edə bilərsiniz və son qərarı insan verir.</p>
  </main>;
}
