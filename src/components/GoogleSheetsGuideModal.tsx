import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Table, Copy, Check, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";
import { getGoogleScriptUrl, setGoogleScriptUrl } from "@/src/services/googleSheetsService";

interface GoogleSheetsGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GAS_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var body = JSON.parse(e.postData.contents);
    var items = Array.isArray(body) ? body : [body];

    items.forEach(function(item) {
      sheet.appendRow([
        item.tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd"),
        item.kategori || "Lain-lain",
        item.deskripsi || "-",
        Number(item.jumlah) || 0
      ]);
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success", count: items.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export function GoogleSheetsGuideModal({ open, onOpenChange }: GoogleSheetsGuideModalProps) {
  const [copied, setCopied] = useState(false);
  const [gasUrl, setGasUrl] = useState(() => getGoogleScriptUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(GAS_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrl = () => {
    setGoogleScriptUrl(gasUrl.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2 text-emerald-400">
          <Table className="w-5 h-5" />
          <DialogTitle>Koneksi Google Sheets (Tanpa Server / n8n)</DialogTitle>
        </div>
        <DialogDescription>
          Hanya butuh Google Apps Script gratis bawaan Google Sheets. Ringan, instan, zero-server.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 pt-3 text-sm text-zinc-300">
        {/* Alert info */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 leading-relaxed">
          <Sparkles className="w-4 h-4 inline mr-1 text-blue-400" />
          <b>Kenapa perlu Apps Script?</b> Supaya data dari browser langsung masuk ke Google Sheets tanpa backend/server tambahan. Gratis dan permanent.
        </div>

        {/* Step by step */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="text-emerald-400">📋</span> Langkah Setup (5 menit)
          </h4>

          {/* Step 1 */}
          <div className="p-4 bg-[#121214] border border-[#27272a] rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
              <h5 className="text-xs font-semibold text-white">Buka Google Sheets kamu</h5>
            </div>
            <p className="text-xs text-zinc-400 ml-8 leading-relaxed">
              Pastikan baris pertama (header) punya kolom:
            </p>
            <div className="ml-8 p-2 bg-[#09090b] border border-emerald-500/30 rounded-lg">
              <code className="text-emerald-400 text-xs font-mono">Tanggal | Kategori | Deskripsi | Jumlah</code>
            </div>
            <p className="text-[11px] text-zinc-500 ml-8">
              Kalau belum ada, bikin sheet baru dan ketik 4 kolom di atas di baris pertama.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-[#121214] border border-[#27272a] rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
              <h5 className="text-xs font-semibold text-white">Buka Apps Script Editor</h5>
            </div>
            <p className="text-xs text-zinc-400 ml-8 leading-relaxed">
              Di Google Sheets, klik menu:
            </p>
            <div className="ml-8 p-2 bg-[#09090b] border border-[#27272a] rounded-lg">
              <code className="text-white text-xs"><b>Extensions</b> (atau <b>Ekstensi</b>) → <b>Apps Script</b></code>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-[#121214] border border-[#27272a] rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">3</span>
              <h5 className="text-xs font-semibold text-white">Paste Kode Apps Script</h5>
            </div>
            <p className="text-xs text-zinc-400 ml-8 leading-relaxed">
              Hapus semua kode default yang ada di editor, lalu paste kode di bawah ini (klik tombol "Salin Kode"):
            </p>
          </div>
        </div>

        {/* Code block */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">📄 Code.gs (Apps Script)</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "✓ Tersalin!" : "Salin Kode"}
            </Button>
          </div>
          <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl overflow-x-auto text-xs font-mono text-zinc-300">
            <pre>{GAS_CODE}</pre>
          </div>
        </div>

        {/* Step 4 - Deploy */}
        <div className="p-4 bg-[#121214] border border-[#27272a] rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">4</span>
            <h5 className="text-xs font-semibold text-white">Deploy sebagai Web App</h5>
          </div>
          <div className="ml-8 space-y-2">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Setelah paste kode, klik tombol <b className="text-white">Deploy</b> (pojok kanan atas) → <b className="text-white">New deployment</b>:
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><b className="text-white">Type:</b> Pilih <b className="text-emerald-400">Web app</b></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><b className="text-white">Execute as:</b> Pilih <b className="text-emerald-400">Me</b> (email kamu)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><b className="text-white">Who has access:</b> Pilih <b className="text-emerald-400">Anyone</b> (siapa saja)</span>
              </li>
            </ul>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              Klik <b className="text-white">Deploy</b>. Google akan minta izin akses → klik <b className="text-emerald-400">Authorize access</b> dan login dengan akun Google kamu.
            </p>
          </div>
        </div>

        {/* Step 5 - Copy URL */}
        <div className="p-4 bg-[#121214] border border-emerald-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">5</span>
            <h5 className="text-xs font-semibold text-white">Salin Web App URL</h5>
          </div>
          <p className="text-xs text-zinc-400 ml-8 leading-relaxed">
            Setelah deploy berhasil, Google akan tampilkan <b className="text-emerald-400">Web app URL</b>. Salin URL tersebut (yang diakhiri dengan <code className="text-emerald-400 bg-[#09090b] px-1 rounded">/exec</code>) dan paste di form di bawah ini:
          </p>
        </div>

        {/* Input Web App URL */}
        <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-2 border-emerald-500/30 rounded-xl space-y-3">
          <label className="text-sm font-semibold text-white flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            Paste Web App URL kamu di sini
          </label>
          <div className="flex gap-2">
            <Input
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycby.../exec"
              className="text-xs font-mono bg-[#18181b] border-emerald-500/30 text-emerald-400 placeholder:text-zinc-600"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSaveUrl}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs whitespace-nowrap gap-1.5 px-4"
              disabled={!gasUrl.trim()}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Tersimpan!
                </>
              ) : (
                "Simpan URL"
              )}
            </Button>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-emerald-400 font-bold">ℹ️</span>
            <p>
              Setelah simpan, coba catat pengeluaran. Data akan otomatis masuk ke Google Sheets kamu. Jika belum diisi, data hanya tersimpan di browser (local storage).
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={() => onOpenChange(false)} className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] text-white text-sm">
            Tutup
          </Button>
          {gasUrl.trim() && (
            <Button
              onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${(import.meta as any).env?.VITE_GOOGLE_SHEETS_ID || '19_WEy7mMHbzderOH5kkiu0ChFnuj_0RG6noKqAJk_Q4'}`, '_blank')}
              variant="outline"
              className="flex-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka Google Sheets
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
