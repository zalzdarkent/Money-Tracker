import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/src/lib/supabase";
import { BrainCircuit, Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-emerald-400 animate-pulse">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Memeriksa autentikasi...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!supabase) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-[#27272a] bg-[#18181b] p-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100">Supabase Belum Dikonfigurasi</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Variabel lingkungan <code className="text-zinc-200 bg-[#121214] px-1.5 py-0.5 rounded font-mono">VITE_PUBLIC_SUPABASE_URL</code> dan{" "}
            <code className="text-zinc-200 bg-[#121214] px-1.5 py-0.5 rounded font-mono">VITE_PUBLIC_SUPABASE_ANON_KEY</code> belum diisi di file <code className="text-zinc-200 bg-[#121214] px-1.5 py-0.5 rounded font-mono">.env</code>.
          </p>
        </div>
      </main>
    );
  }

  if (session) return <>{children}</>;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { error: signInError } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat masuk.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#09090b] text-[#fafafa] flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,_#18181b,_#09090b_70%)] font-sans">
      <div className="w-full max-w-sm relative">
        {/* Glow backdrop */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative rounded-2xl border border-[#27272a] bg-[#18181b]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-4 text-center border-b border-[#27272a]/60">
            <div className="w-12 h-12 rounded-2xl bg-[#121214] border border-[#27272a] mx-auto flex items-center justify-center text-emerald-400 shadow-inner mb-3">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Money Tracker</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Masuk untuk mengelola dan mencatat pengeluaran.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                Email
              </label>
              <div className="relative">
                <input
                  required
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-[#27272a] bg-[#121214] px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-[#27272a] bg-[#121214] px-3.5 py-2.5 pr-10 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !email.trim() || !password}
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Masuk ke Dashboard</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 py-3 bg-[#121214] border-t border-[#27272a] flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Supabase Authentication</span>
          </div>
        </div>
      </div>
    </main>
  );
}
