import React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { CodeBlock } from "@/src/components/ui/code-block";
import { ShieldAlert } from "lucide-react";

interface CorsGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CorsGuideModal({ open, onOpenChange }: CorsGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-2xl">
      <DialogHeader>
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldAlert className="w-5 h-5" />
          <DialogTitle>Panduan CORS</DialogTitle>
        </div>
        <DialogDescription>Atasi error CORS antara frontend (5173) dan n8n (5678).</DialogDescription>
      </DialogHeader>

      <div className="space-y-5 pt-4 text-sm text-zinc-300">
        <p className="text-xs text-zinc-400">Browser memblokir request beda port. Butuh izin CORS di n8n.</p>

        <div className="space-y-2">
          <h4 className="font-semibold text-white text-sm">1. Aktifkan CORS di n8n</h4>
          <CodeBlock code={`N8N_CORS_ENABLED=true npx n8n`} language="bash" filename="terminal" />
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-white text-sm">2. Header di Webhook n8n</h4>
          <CodeBlock code={`Access-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: POST, OPTIONS, GET`} language="text" filename="Response Headers" />
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-white text-sm">3. Proxy Vite (alternatif)</h4>
          <CodeBlock code={`// vite.config.ts\nproxy: { '/webhook': { target: 'http://localhost:5678', changeOrigin: true } }`} language="typescript" filename="vite.config.ts" />
        </div>

        <button onClick={() => onOpenChange(false)} className="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm">Tutup</button>
      </div>
    </Dialog>
  );
}
