export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw new Error("Gözləmə müddəti bitdi. Nəticə təsdiqlənmədi; yenidən göndərməzdən əvvəl hesabatları yoxlayın. Daxil etdiyiniz mətn formadadır.");
    throw new Error("Bağlantı kəsildi. Yenidən cəhd edin; daxil etdiyiniz məlumatlar formadadır.");
  }
  if (response.status === 404 || response.status === 405) throw new Error("Bu əməliyyat hələ əlçatan deyil. Məlumatlar saxlanılmadı; daha sonra yenidən cəhd edin.");
  if (response.status === 401) throw new Error("Sessiyanız bitib. Yenidən daxil olub əməliyyatı təkrarlayın.");
  if (response.status === 403) throw new Error("Bu əməliyyat üçün icazəniz yoxdur. Rəhbərlə əlaqə saxlayın.");
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) throw new Error(typeof data?.error === "string" ? data.error : "Əməliyyat tamamlanmadı. Yenidən cəhd edin.");
  return data as T;
}
