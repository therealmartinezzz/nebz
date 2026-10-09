"use client";

import Link from "next/link";
import { useErrorNotification } from "@/components/Notifications";

export default function ErrorPage({ reset }: { reset: () => void }) {
  useErrorNotification("Bağlantını yoxlayıb yenidən cəhd edin.", "Səhifə yüklənmədi");
  return <main id="main-content" className="page"><section className="card stack"><h1>Səhifə yüklənmədi</h1><p className="muted">Bağlantını yoxlayıb yenidən cəhd edin.</p><div className="actions"><button className="btn primary" onClick={reset}>Yenidən cəhd et</button><Link className="btn" href="/scenarios">Ssenarilərə qayıt</Link></div></section></main>;
}
