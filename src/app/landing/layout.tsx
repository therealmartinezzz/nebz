import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nəbz — AI ilə xidmət keyfiyyəti",
  description:
    "AI müştəri ilə real ssenari üzrə məşq edin, zəng keyfiyyətini ölçün, işçiləri inkişaf etdirin.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
