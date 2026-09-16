import { supabase } from "@/src/lib/supabase";

export async function callGeminiProxy(body: Record<string, unknown>): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch("/api/gemini", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Gemini API error (${response.status})`);
  return data.text || "";
}
