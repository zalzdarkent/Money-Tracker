import { createClient } from "@supabase/supabase-js";

const env = (import.meta as any).env || {};
const url = env.VITE_PUBLIC_SUPABASE_URL;
const key = env.VITE_PUBLIC_SUPABASE_ANON_KEY || env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createClient(url, key) : null;
