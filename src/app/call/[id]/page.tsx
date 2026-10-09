import { Suspense } from "react";
import CallClient from "./CallClient";

export default function CallPage() {
  return (
    <Suspense fallback={<main className="page">Yüklənir…</main>}>
      <CallClient />
    </Suspense>
  );
}
