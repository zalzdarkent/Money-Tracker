import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/src/lib/supabase";

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return setLoading(false);
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) return <main className="p-8 text-white">Supabase belum dikonfigurasi.</main>;
  if (loading) return <main className="p-8 text-white">Memuat...</main>;
  if (session) return <>{children}</>;

  async function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }

  return <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 text-white">
    <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-[#27272a] bg-[#18181b] p-6">
      <h1 className="text-xl font-semibold">Money Tracker</h1>
      <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded border border-[#27272a] bg-[#121214] p-2" />
      <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded border border-[#27272a] bg-[#121214] p-2" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="w-full rounded bg-emerald-600 p-2">Masuk</button>
    </form>
  </main>;
}
