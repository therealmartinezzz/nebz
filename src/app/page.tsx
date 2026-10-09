import { readScenarios } from "@/components/server-data";
import { DataNotice, PageHeading } from "@/components/ui";
import ScenariosClient from "./ScenariosClient";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const [{ data: scenarios, error }, params] = await Promise.all([readScenarios(), searchParams]);
  return <main id="main-content" className="page"><PageHeading title="Yeni məşq zəngi" description="Ssenari seçin. AI müştəri rolunu oynayacaq, zəngdən sonra hesabat hazırlanacaq." /><DataNotice error={error} /><ScenariosClient scenarios={scenarios} operatorName={params.name ?? ""} /></main>;
}
