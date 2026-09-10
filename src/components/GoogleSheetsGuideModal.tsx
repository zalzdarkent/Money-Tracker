import React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { Table } from "lucide-react";

interface GoogleSheetsGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleSheetsGuideModal({ open, onOpenChange }: GoogleSheetsGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-2xl">
      <DialogHeader>
        <div className="flex items-center gap-2 text-emerald-400">
          <Table className="w-5 h-5" />
          <DialogTitle>Setup Google Sheets</DialogTitle>
        </div>
        <DialogDescription>Hubungkan n8n ke Sheets via Service Account.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 pt-4 text-sm text-zinc-300">
        <ol className="space-y-3 text-xs leading-relaxed list-decimal list-inside text-zinc-400">
          <li><b className="text-white">Buat Sheet</b> dengan header: <code className="bg-[#18181b] px-1 rounded">Tanggal | Kategori | Deskripsi | Jumlah</code></li>
          <li><b className="text-white">Buat Service Account</b> di console.cloud.google.com → aktifkan Sheets & Drive API → IAM & Admin → Service Accounts → Create → buat key JSON.</li>
          <li><b className="text-white">Share Sheet</b> ke email service account (contoh: bot@xxx.iam.gserviceaccount.com) dengan akses Editor.</li>
          <li><b className="text-white">Di n8n</b> → node Google Sheets → credential Service Account → paste email & private key.</li>
        </ol>

        <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#09090b] p-3 font-mono text-xs">
          <table className="w-full text-left"><thead><tr className="text-zinc-500"><th className="px-2 py-1">Tanggal</th><th className="px-2 py-1">Kategori</th><th className="px-2 py-1">Deskripsi</th><th className="px-2 py-1">Jumlah</th></tr></thead><tbody className="text-zinc-200"><tr><td className="px-2 py-1">2026-09-10</td><td className="px-2 py-1">Makanan</td><td className="px-2 py-1">Kopi</td><td className="px-2 py-1">25000</td></tr></tbody></table>
        </div>

        <button onClick={() => onOpenChange(false)} className="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm">Tutup</button>
      </div>
    </Dialog>
  );
}
