import React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { CodeBlock } from "@/src/components/ui/code-block";
import { AlertCircle, ShieldAlert, CheckCircle2, Terminal } from "lucide-react";

interface CorsGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CorsGuideModal({ open, onOpenChange }: CorsGuideModalProps) {
  const n8nEnvSnippet = `# Jalankan n8n dengan mengaktifkan CORS
export N8N_CORS_ENABLED=true
n8n start

# Atau jika menggunakan npx:
N8N_CORS_ENABLED=true npx n8n`;

  const viteProxySnippet = `// vite.config.ts (Opsi proxy jika tidak ingin ubah env n8n)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/n8n-webhook': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/n8n-webhook/, '')
      }
    }
  }
});`;

  const webhookHeaderSnippet = `// Pengaturan Response Headers di Webhook Node n8n:
// Tab: Options -> Response Headers -> Add Header:
// 1. Name: Access-Control-Allow-Origin | Value: *
// 2. Name: Access-Control-Allow-Methods | Value: POST, OPTIONS, GET
// 3. Name: Access-Control-Allow-Headers | Value: Content-Type, Authorization`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-3xl">
      <DialogHeader>
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldAlert className="w-5 h-5" />
          <DialogTitle>Panduan Mengatasi Masalah CORS (React & n8n)</DialogTitle>
        </div>
        <DialogDescription>
          Kenapa CORS terjadi antara Frontend (Port 5173) dan n8n (Port 5678) serta 3 cara mudah menyelesaikannya.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 pt-4 text-sm text-zinc-300">
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-300">Penyebab Terjadinya CORS:</h4>
              <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                Browser memberlakukan <strong>Same-Origin Policy</strong>. Ketika aplikasi React Anda yang berjalan di <code className="bg-amber-900/40 px-1.5 py-0.5 rounded text-amber-200 font-mono">http://localhost:5173</code> melakukan request HTTP POST ke <code className="bg-amber-900/40 px-1.5 py-0.5 rounded text-amber-200 font-mono">http://localhost:5678</code>, browser mengirimkan <em>preflight request (OPTIONS)</em>. Jika n8n belum mengizinkan origin 5173, browser akan memblokir respon tersebut.
              </p>
            </div>
          </div>
        </div>

        {/* Solusi 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">1</span>
            <h4 className="font-semibold text-white">Solusi 1 (Paling Direkomendasikan): Aktifkan CORS di n8n</h4>
          </div>
          <p className="text-xs text-zinc-400 pl-8">
            Set environment variable <code className="text-emerald-400 font-mono">N8N_CORS_ENABLED=true</code> sebelum menjalankan n8n di terminal:
          </p>
          <div className="pl-8">
            <CodeBlock code={n8nEnvSnippet} language="bash" filename="Terminal (Bash / Command Prompt)" />
          </div>
        </div>

        {/* Solusi 2 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">2</span>
            <h4 className="font-semibold text-white">Solusi 2: Tambahkan Header CORS di Node Webhook n8n</h4>
          </div>
          <p className="text-xs text-zinc-400 pl-8">
            Pada node <strong>Webhook (Trigger)</strong> dan <strong>Respond to Webhook</strong> di n8n, tambahkan opsi response headers berikut (sudah otomatis disertakan di file JSON workflow kami!):
          </p>
          <div className="pl-8">
            <CodeBlock code={webhookHeaderSnippet} language="text" filename="n8n Node Parameters" />
          </div>
        </div>

        {/* Solusi 3 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">3</span>
            <h4 className="font-semibold text-white">Solusi 3: Gunakan Vite Development Proxy</h4>
          </div>
          <p className="text-xs text-zinc-400 pl-8">
            Jika tidak ingin mengubah konfigurasi n8n, buat proxy di <code className="text-emerald-400 font-mono">vite.config.ts</code>:
          </p>
          <div className="pl-8">
            <CodeBlock code={viteProxySnippet} language="typescript" filename="vite.config.ts" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Workflow JSON yang kami buat sudah menyertakan pre-configured CORS headers!</span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            Mengerti, Tutup
          </button>
        </div>
      </div>
    </Dialog>
  );
}
