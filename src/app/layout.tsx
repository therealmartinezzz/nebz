import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nəbz",
  description: "AI ilə xidmət keyfiyyəti məşqi və qiymətləndirməsi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h4l3-7 4 14 3-7h4" />
              </svg>
            </span>
            Nəbz
          </Link>
          <nav className="nav">
            <Link href="/">Ssenarilər</Link>
            <Link href="/reports">Hesabatlar</Link>
          </nav>
          <span className="muted" style={{ fontSize: 13 }}>NovaBank · demo şirkət</span>
        </header>
        {children}
      </body>
    </html>
  );
}
