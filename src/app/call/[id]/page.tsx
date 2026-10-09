import { notFound } from "next/navigation";
import { readScenarios } from "@/components/server-data";
import CallClient from "./CallClient";

export const dynamic = "force-dynamic";

export default async function CallPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ name?: string; mode?: string }> }) {
  const [{ id }, search, scenarios] = await Promise.all([params, searchParams, readScenarios()]);
  const scenario = scenarios.data.find((item) => item.id === id);
  if (!scenario && !scenarios.error) notFound();
  return <CallClient scenarioId={id} title={scenario?.title ?? "Məşq zəngi"} department={scenario?.department ?? ""} operatorName={search.name?.trim() || "Operator"} mode={search.mode === "text" ? "text" : "voice"} available={Boolean(scenario)} initialError={scenarios.error} />;
}
