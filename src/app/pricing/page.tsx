import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Qiymətlər · Nəbz" };

// Korporativ plan üçün əlaqə ünvanı — komandanın e-poçtu ilə əvəz edin.
const CONTACT_EMAIL = "[KOMANDANIN EMAILI]";

// Qiymətlər və plan məzmunu buradan dəyişdirilir.
const PLANS: {
  name: string;
  price: string | null; // null → "Fərdi qiymət"
  description: string;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
}[] = [
  {
    name: "Başlanğıc",
    price: "15 AZN",
    description: "Kiçik komandalar üçün məşqə başlamaq",
    features: [
      "10 operatora qədər",
      "Hazır ssenari kitabxanası",
      "Azərbaycan dilində səsli və mətn məşqi",
      "AI qiymətləndirməsi: hər bal operatorun dəqiq sözləri ilə",
      "Hər zəng üçün hesabat",
    ],
    cta: { label: "Başla", href: "/" },
  },
  {
    name: "Komanda",
    price: "25 AZN",
    description: "Öz standartınızla işləyən çağrı mərkəzləri üçün",
    features: [
      "50 operatora qədər",
      "Başlanğıc planındakı hər şey",
      "Şirkət standartından AI ilə ssenari yaratmaq",
      "Rəhbər yoxlaması və işçi etirazları",
      "Operator profilləri və məşq təyinatı",
      "Komanda paneli",
    ],
    cta: { label: "Başla", href: "/" },
    featured: true,
  },
  {
    name: "Korporativ",
    price: null,
    description: "Böyük şirkətlər və xüsusi tələblər üçün",
    features: [
      "Limitsiz operator",
      "Komanda planındakı hər şey",
      "Rus və ingilis dilləri",
      "CRM və telefoniya inteqrasiyası",
      "Məlumatların saxlanması üzrə xüsusi şərtlər",
      "Şəxsi menecer və pilot proqramı",
    ],
    cta: { label: "Əlaqə saxla", href: `mailto:${CONTACT_EMAIL}?subject=N%C9%99bz%20korporativ%20plan` },
  },
];

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginTop: 2 }}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <main id="main-content" className="page">
      <div className="page-heading">
        <div>
          <h1>Komandanıza uyğun plan seçin</h1>
          <p className="muted">
            Operatorlarınız AI müştəri ilə real ssenarilərdə məşq edir, hər zəng şirkətinizin öz standartı ilə qiymətləndirilir.
          </p>
        </div>
      </div>

      {/* auto-fit: geniş ekranda 3 sütun, dar ekranda kartlar alt-alta */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 24, alignItems: "stretch" }}>
        {PLANS.map((plan) => (
          <section
            key={plan.name}
            className="card stack"
            aria-labelledby={`plan-${plan.name}`}
            style={plan.featured ? { borderColor: "var(--accent)", borderWidth: 2, boxShadow: "0 0 0 4px var(--accent-soft)" } : undefined}
          >
            <div className="stack tight">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                <h2 id={`plan-${plan.name}`} style={{ margin: 0 }}>{plan.name}</h2>
                {plan.featured && <span className="pill ok">Ən populyar</span>}
              </div>
              <p className="muted">{plan.description}</p>
              <p>
                {plan.price ? (
                  <>
                    <span className="mono" style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.1 }}>{plan.price}</span>{" "}
                    <span className="muted small">/ operator / ay</span>
                  </>
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>Fərdi qiymət</span>
                )}
              </p>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              {plan.features.map((feature) => (
                <li key={feature} style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: 0 }}>
                  <Check />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {plan.cta.href.startsWith("mailto:") ? (
              <a className={`btn full${plan.featured ? " primary" : ""}`} href={plan.cta.href}>{plan.cta.label}</a>
            ) : (
              <Link className={`btn full${plan.featured ? " primary" : ""}`} href={plan.cta.href}>{plan.cta.label}</Link>
            )}
          </section>
        ))}
      </div>

      <p className="muted small">Qiymətlərə ƏDV daxil deyil. Pilot üçün bizimlə əlaqə saxlayın.</p>
    </main>
  );
}
