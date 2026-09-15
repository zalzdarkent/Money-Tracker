import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return res.status(401).json({ error: "Login required" });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: "Invalid session" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY missing" });

  try {
    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genai.getGenerativeModel({ model: req.body.model || "gemini-1.5-flash" });
    const result = await model.generateContent({ contents: req.body.contents, generationConfig: req.body.generationConfig });
    return res.status(200).json({ text: result.response.text() });
  } catch (error: any) {
    return res.status(502).json({ error: error.message || "Gemini request failed" });
  }
}
