import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !supabaseUrl || !supabaseKey) return res.status(401).json({ error: "Login required" });
  const supabase = createClient(supabaseUrl, supabaseKey);
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
