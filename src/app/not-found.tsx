import Link from "next/link";

export default function NotFound() {
  return <main id="main-content" className="page"><section className="card stack"><h1>Səhifə tapılmadı</h1><p className="muted">Bu ssenari, zəng və ya səhifə artıq mövcud olmaya bilər.</p><div className="actions"><Link className="btn primary" href="/scenarios">Ssenarilər</Link><Link className="btn" href="/reports">Hesabatlar</Link></div></section></main>;
}
