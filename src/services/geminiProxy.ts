export async function callGeminiProxy(body: Record<string, unknown>): Promise<string> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Gemini API error (${response.status})`);
  return data.text || "";
}
