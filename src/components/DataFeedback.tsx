"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useErrorNotification } from "./Notifications";

export default function DataFeedback({ error }: { error: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useErrorNotification(error, "Məlumat yüklənmədi");
  return <div className="notice warn data-feedback"><div><strong>Məlumat əlçatan deyil</strong><p>{error}</p></div><button className="btn" type="button" aria-busy={pending} disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Yenilənir…" : "Yenidən yüklə"}</button></div>;
}
