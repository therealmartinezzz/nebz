import Link from "next/link";
import type { ReactNode } from "react";
import type { CallListItem } from "@/lib/types";
import { fmtTime } from "@/lib/format";
import { date, number } from "./view-helpers";
import Icon from "./Icon";

export function PageHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div><h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{action}</div>;
}
export function EmptyState({ title, description, action, compact = false }: { title: string; description: string; action?: ReactNode; compact?: boolean }) {
  return <div className={`empty-state${compact ? " small" : ""}`}><Icon name="document" width="28" height="28" /><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function DataNotice({ error }: { error: string }) {
  return error ? <div className="notice warn" role="alert"><strong>Məlumat əlçatan deyil</strong><p>{error}</p></div> : null;
}
export function Metric({ label, value, suffix, warn }: { label: string; value: ReactNode; suffix?: string; warn?: boolean }) {
  return <div className="card metric"><div className="muted">{label}</div><div className={`metric-value${warn ? " warn-text" : ""}`}>{value}{suffix && <span>{suffix}</span>}</div></div>;
}
export function BarList({ items, empty = "Qiymətləndirilmiş zənglər olduqda göstəricilər burada görünəcək." }: { items: { label: string; value: number; max: number }[]; empty?: string }) {
  if (!items.length) return <EmptyState compact title="Hələ göstərici yoxdur" description={empty} />;
  const min = Math.min(...items.map((item) => item.value));
  return <div className="bar-list">{items.map((item) => <div className={`bar-item${item.value === min && items.length > 1 ? " weakest" : ""}`} key={item.label}><span>{item.label}</span><div className="bar-track"><div style={{ width: `${Math.max(0, Math.min(100, item.value / item.max * 100))}%` }} /></div><span className="mono">{number(item.value)}</span></div>)}</div>;
}
export function CallsTable({ calls, profileLinks = false }: { calls: CallListItem[]; profileLinks?: boolean }) {
  if (!calls.length) return <EmptyState title="Hələ zəng yoxdur" description="İlk məşq zəngini tamamladıqdan sonra hesabatlar burada görünəcək." action={<Link className="btn" href="/">Ssenari seç</Link>} />;
  return <table className="data-table"><caption className="sr-only">Qiymətləndirilmiş zənglər</caption><thead><tr><th>Operator</th><th>Ssenari</th><th>Tarix</th><th>Müddət</th><th>Etibarlılıq</th><th className="text-right">Bal</th></tr></thead><tbody>{calls.map((call) => <tr key={call.id}>
    <td data-label="Operator"><Link className="strong-link" href={profileLinks ? `/operators/${encodeURIComponent(call.operator_name)}` : `/report/${call.id}`}>{call.operator_name}</Link></td>
    <td data-label="Ssenari"><Link className="plain-link" href={`/report/${call.id}`}>{call.scenarios?.title ?? "Ssenari yoxdur"}</Link></td>
    <td data-label="Tarix">{date(call.created_at)}</td>
    <td data-label="Müddət" className="mono">{call.duration_sec === null ? "—" : fmtTime(call.duration_sec)}</td>
    <td data-label="Etibarlılıq"><span className={`pill ${call.confidence === "low" ? "warn" : "ok"}`}>{call.confidence === "low" ? "Aşağı" : "Yüksək"}</span></td>
    <td data-label="Bal" className="mono text-right"><Link href={`/report/${call.id}`}>{call.total}/{call.max_total}</Link></td>
  </tr>)}</tbody></table>;
}
export function OperatorPicker({ names, selected = "" }: { names: string[]; selected?: string }) {
  return <form action="/me" className="operator-picker"><label className="field">Operatorun adı<input type="text" name="name" list="operator-names" defaultValue={selected} required placeholder="Adınızı daxil edin" autoComplete="name" /></label><datalist id="operator-names">{names.map((name) => <option key={name} value={name} />)}</datalist><button className="btn" type="submit">Nəticələrimi göstər</button></form>;
}
