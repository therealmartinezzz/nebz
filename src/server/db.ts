import "server-only";
import { createClient } from "@supabase/supabase-js";

// Yalnız server tərəfində istifadə olunur (service role açarı brauzerə getmir).
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL və SUPABASE_SERVICE_ROLE_KEY təyin edilməyib");
  return createClient(url, key, { auth: { persistSession: false } });
}
