import Link from "next/link";
import { readCalls } from "@/components/server-data";
import { CallsTable, DataNotice, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { data: calls, error } = await readCalls();
  return <main id="main-content" className="page"><PageHeading title="Hesabatlar" description="Hər zəngin nəticəsi, meyarlar üzrə sübut və rəhbər yoxlaması." action={<Link href="/scenarios" className="btn primary">Yeni məşq zəngi</Link>} /><DataNotice error={error} /><section className="card"><CallsTable calls={calls} /><p className="table-footer">Son 100 qiymətləndirilmiş zəng göstərilir.</p></section></main>;
}
