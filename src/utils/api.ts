import { supabase } from "./firebaseAuth.ts";
const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
export async function api(path: string, body?: unknown, method?: string) {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  let res: Response;
  try {
    res = await fetch(base + path, {
      method: method || (body === undefined ? "GET" : "POST"),
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new Error(
      (e as Error).name === "TimeoutError"
        ? "انتهت مهلة الاتصال. حاول مرة ثانية."
        : "تعذر الاتصال بالخادم. تحقق من الإنترنت وإعداد عنوان API.",
    );
  }
  if (res.status === 204) return null;
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("الخادم لم يرجع JSON. تحقق من عنوان Backend المنشور.");
  }
  if (!res.ok) throw new Error(data.message || `فشل الطلب (${res.status})`);
  return data;
}
