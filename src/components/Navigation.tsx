"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const links = [
  { href: "/landing", label: "Ana səhifə", matches: ["/landing"] },
  { href: "/dashboard", label: "Panel", matches: ["/dashboard", "/operators"] },
  { href: "/", label: "Ssenarilər", matches: ["/scenarios"] },
  { href: "/reports", label: "Hesabatlar", matches: ["/reports", "/report/"] },
  { href: "/review", label: "Yoxlama", matches: ["/review"] },
  { href: "/me", label: "Məşqlər", matches: ["/me"] },
];

export default function Navigation() {
  const pathname = usePathname();
  const call = pathname.startsWith("/call/");
  return <>
    <a className="skip-link" href="#main-content">Əsas məzmuna keç</a>
    <header className={`topbar${call ? " compact" : ""}`}>
      <Link href="/landing" className="brand" aria-label="Nəbz — ana səhifə">
        <img
          src="/brand/nebz-symbol.svg"
          alt="Nəbz loqosu"
          width="38"
          height="38"
          style={{ width: "38px", height: "38px", display: "block", flexShrink: 0 }}
        />
        <span style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>Nəbz</span>
        {!call && <span className="brand-caption" style={{ fontSize: "14px" }}>xidmət keyfiyyəti</span>}
      </Link>
      {!call && <nav className="nav" aria-label="Əsas naviqasiya">
        {links.map(({ href, label, matches }) => {
          const active = href === "/"
            ? pathname === "/" || matches.some((p) => pathname.startsWith(p))
            : pathname === href || matches.some((p) => pathname.startsWith(p));
          return <Link key={href} href={href} aria-current={active ? "page" : undefined}>{label}</Link>;
        })}
      </nav>}
      <span className="company">{call ? "AI müştəri · Açıq məşq" : "NovaBank · demo"}</span>
    </header>
  </>;
}
