import React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { Table, KeyRound, Share2, CheckSquare } from "lucide-react";
import { CodeBlock } from "@/src/components/ui/code-block";

interface GoogleSheetsGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleSheetsGuideModal({ open, onOpenChange }: GoogleSheetsGuideModalProps) {
  const serviceAccountJsonSample = `{
  "type": "service_account",
  "project_id": "expense-tracker-project",
  "private_key_id": "7b8d...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvgIB...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "expense-bot@expense-tracker-project.iam.gserviceaccount.com",
  "client_id": "1049283749283",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-3xl">
      <DialogHeader>
        <div className="flex items-center gap-2 text-emerald-400">
          <Table className="w-5 h-5" />
          <DialogTitle>Panduan Konfigurasi Google Sheets & Service Account</DialogTitle>
        </div>
        <DialogDescription>
          Langkah demi langkah menghubungkan n8n ke Google Sheets menggunakan Google Cloud Service Account.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 pt-4 text-sm text-zinc-300">
        {/* Step 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">1</span>
            <h4 className="font-semibold text-white">Buat Spreadsheet & Siapkan Header Kolom</h4>
          </div>
          <p className="text-xs text-zinc-400 pl-8 leading-relaxed">
            Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Google Sheets baru</a>, beri nama file (contoh: <strong>Catatan Keuangan AI</strong>), lalu pada baris pertama (Row 1) buat 4 kolom persis seperti berikut:
          </p>
          <div className="pl-8">
            <div className="overflow-x-auto rounded-2xl border border-[#27272a] bg-[#09090b] p-3 font-mono">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#27272a] text-zinc-400">
                    <th className="py-2 px-3 bg-[#121214] rounded-l font-mono">Kolom A</th>
                    <th className="py-2 px-3 bg-[#121214] font-mono">Kolom B</th>
                    <th className="py-2 px-3 bg-[#121214] font-mono">Kolom C</th>
                    <th className="py-2 px-3 bg-[#121214] rounded-r font-mono">Kolom D</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-200">
                  <tr className="border-b border-[#27272a] font-semibold text-emerald-400">
                    <td className="py-2 px-3">Tanggal</td>
                    <td className="py-2 px-3">Kategori</td>
                    <td className="py-2 px-3">Deskripsi</td>
                    <td className="py-2 px-3">Jumlah</td>
                  </tr>
                  <tr className="text-zinc-500 text-[11px]">
                    <td className="py-1 px-3">2026-08-30</td>
                    <td className="py-1 px-3">Makanan & Minuman</td>
                    <td className="py-1 px-3">Kopi Kenangan</td>
                    <td className="py-1 px-3">25000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">2</span>
            <h4 className="font-semibold text-white">Buat Service Account di Google Cloud Console</h4>
          </div>
          <ul className="text-xs text-zinc-400 pl-8 space-y-1.5 list-disc list-inside">
            <li>Buka <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Google Cloud Console</a> dan buat project baru.</li>
            <li>Aktifkan API: <strong>Google Sheets API</strong> dan <strong>Google Drive API</strong> di menu <em>APIs & Services &gt; Enable APIs</em>.</li>
            <li>Buka menu <strong>IAM & Admin &gt; Service Accounts</strong> &gt; Klik <strong>Create Service Account</strong>.</li>
            <li>Beri nama (misal: <code className="text-zinc-200">expense-bot</code>) &gt; Klik <strong>Create and Continue</strong> &gt; Beri role <strong>Editor</strong>.</li>
            <li>Klik Service Account yang baru dibuat &gt; Tab <strong>Keys</strong> &gt; <strong>Add Key &gt; Create new key &gt; JSON</strong>. File JSON credentials akan terunduh.</li>
          </ul>
        </div>

        {/* Step 3 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">3</span>
            <h4 className="font-semibold text-white">Bagikan (Share) Google Sheet ke Email Service Account</h4>
          </div>
          <p className="text-xs text-zinc-400 pl-8 leading-relaxed">
            Copy alamat email service account Anda (misal: <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-[11px]">expense-bot@project-id.iam.gserviceaccount.com</code>), buka Google Sheet Anda, klik tombol <strong>Share (Bagikan)</strong> di kanan atas, lalu paste email tersebut dan beri akses <strong>Editor</strong>.
          </p>
        </div>

        {/* Step 4 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">4</span>
            <h4 className="font-semibold text-white">Hubungkan Credentials di n8n</h4>
          </div>
          <p className="text-xs text-zinc-400 pl-8 leading-relaxed">
            Di n8n canvas, pada node <strong>Google Sheets</strong>, buat credential baru tipe <strong>Google Sheets (Service Account)</strong> lalu paste Service Account Email dan Private Key dari file JSON yang telah Anda download.
          </p>
          <div className="pl-8">
            <CodeBlock code={serviceAccountJsonSample} language="json" filename="Contoh struktur JSON Key" />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
