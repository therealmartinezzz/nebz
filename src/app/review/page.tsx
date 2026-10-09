import { readReviewQueue } from "@/components/server-data";
import { DataNotice, PageHeading } from "@/components/ui";
import ReviewClient from "./ReviewClient";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const { data, error, disputesAvailable } = await readReviewQueue();
  return <main id="main-content" className="page"><PageHeading title="Rəhbər yoxlaması" description="AI-ın əmin olmadığı ballar və işçilərin etirazları. Son qərarı rəhbər verir." /><DataNotice error={error} />{!disputesAvailable && !error && <p className="notice">Etirazların siyahısı hələ əlçatan deyil. Hazırda aşağı etibarlılıqlı zənglər göstərilir.</p>}<ReviewClient items={data} /></main>;
}
