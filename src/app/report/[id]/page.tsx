import { notFound } from "next/navigation";
import { readReport } from "@/components/server-data";
import { DataNotice } from "@/components/ui";
import ReportClient from "./ReportClient";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: report, error } = await readReport(id);
  if (!report && !error) notFound();
  return <main id="main-content" className="page"><DataNotice error={error} /><ReportClient report={report} /></main>;
}
