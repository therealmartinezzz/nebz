"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const links = [
  { href: "/dashboard", label: "Panel", matches: ["/dashboard", "/operators"] },
  { href: "/", label: "Ssenarilər", matches: ["/scenarios"] },
  { href: "/reports", label: "Hesabatlar", matches: ["/reports", "/report/"] },
  { href: "/review", label: "Yoxlama", matches: ["/review"] },
  { href: "/me", label: "Məşqlər", matches: ["/me"] },
];

export default function Navigation() {
  const pathname = usePathname();
  if (pathname === "/landing") return null;
  const call = pathname.startsWith("/call/");
  const training = pathname === "/me";
  return <>
    <a className="skip-link" href="#main-content">Əsas məzmuna keç</a>
    <header className={`topbar${call || training ? " compact" : ""}`}>
      <Link href="/" className="brand" aria-label="Nəbz — ssenarilər">
        <span className="brand-mark"><Icon name="pulse" width="17" height="17" /></span>
        <span>Nəbz</span>
        {!call && <span className="brand-caption">{training ? "işçi görünüşü" : "xidmət keyfiyyəti"}</span>}
      </Link>
      {!call && !training && <nav className="nav" aria-label="Əsas naviqasiya">
        {links.map(({ href, label, matches }) => {
          const active = href === "/" ? pathname === "/" || matches.some((p) => pathname.startsWith(p)) : matches.some((p) => pathname.startsWith(p));
          return <Link key={href} href={href} aria-current={active ? "page" : undefined}>{label}</Link>;
        })}
      </nav>}
      <span className="company">{call ? "AI müştəri · Açıq məşq" : training ? <Link href="/dashboard">Şirkət paneli</Link> : "NovaBank · demo"}</span>
    </header>
  </>;
}
