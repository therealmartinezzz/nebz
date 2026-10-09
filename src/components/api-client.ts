export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });
  } catch {
    throw new Error("Bağlantı kəsildi. Yenidən cəhd edin; daxil etdiyiniz məlumatlar formadadır.");
  }
  if (response.status === 404 || response.status === 405) throw new Error("Bu əməliyyat hələ əlçatan deyil. Məlumatlar saxlanılmadı; daha sonra yenidən cəhd edin.");
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) throw new Error(data?.error || "Əməliyyat tamamlanmadı. Yenidən cəhd edin.");
  return data as T;
}
