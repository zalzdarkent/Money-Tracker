import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/src/components/ui/alert";
import { formatRupiah } from "@/src/lib/utils";
import { ExpenseItem, ExpenseRecord, ReceiptItem, ReceiptScanResult } from "@/src/types";
import { scanReceiptWithGemini } from "@/src/services/geminiClient";
import confetti from "canvas-confetti";
import {
  Camera,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowRight,
  RefreshCw,
  Receipt,
  Store,
  Calendar,
  Layers,
  ListOrdered,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface ReceiptScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (record: ExpenseRecord) => void;
}

const CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja Kebutuhan",
  "Tagihan & Utilitas",
  "Kesehatan",
  "Hiburan & Gaya Hidup",
  "Pendidikan & Kerja",
  "Lain-lain",
];

export function ReceiptScannerModal({
  open,
  onOpenChange,
  onSuccess,
}: ReceiptScannerModalProps) {
  const [step, setStep] = useState<"upload" | "scanning" | "review">("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review states
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [recordMode, setRecordMode] = useState<"summary" | "detailed">("summary");
  const [merchantName, setMerchantName] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [summaryDesc, setSummaryDesc] = useState("");
  const [summaryCategory, setSummaryCategory] = useState("Belanja Kebutuhan");
  const [items, setItems] = useState<ReceiptItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("upload");
      setImagePreview(null);
      setScanResult(null);
      setErrorMessage(null);
    }
  }, [open]);

  // Support paste image from clipboard
  useEffect(() => {
    if (!open || step !== "upload") return;

    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.startsWith("image/")) {
          const file = clipboardItems[i].getAsFile();
          if (file) {
            handleProcessFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open, step]);

  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("File yang dipilih harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Ukuran gambar terlalu besar (maksimal 10MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setErrorMessage(null);
      await startScanning(base64);
    };
    reader.onerror = () => {
      setErrorMessage("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(file);
  };

  const startScanning = async (base64Image: string) => {
    setStep("scanning");
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await scanReceiptWithGemini(base64Image);
      setScanResult(result);
      setMerchantName(result.merchantName || "Struk Belanja");
      setTransactionDate(result.date || new Date().toISOString().slice(0, 10));
      setSummaryDesc(
        result.summaryText ||
        `Belanja di ${result.merchantName || "Toko"} (${result.items.length} item)`
      );
      setSummaryCategory(result.items[0]?.kategori || "Belanja Kebutuhan");
      setItems(result.items && result.items.length > 0 ? result.items : [
        {
          deskripsi: `Belanja ${result.merchantName || "Toko"}`,
          kategori: "Belanja Kebutuhan",
          jumlah: result.totalAmount,
          qty: 1,
        }
      ]);
      setStep("review");
    } catch (err: any) {
      setErrorMessage(
        err.message || "Gagal memindai struk belanja. Silakan coba lagi dengan foto yang lebih jelas."
      );
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  // Sample receipt generator for quick testing without needing an actual photo
  const handleUseSampleReceipt = () => {
    // Generate a simple SVG receipt as a sample image
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 550;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 550);
      ctx.fillStyle = "#18181b";
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "center";
      ctx.fillText("INDOMARET POINT", 200, 50);
      ctx.font = "14px monospace";
      ctx.fillText("Jl. Sudirman No. 45 Jakarta", 200, 75);
      ctx.fillText("================================", 200, 100);
      ctx.textAlign = "left";
      ctx.fillText("Tanggal: " + new Date().toISOString().slice(0, 10), 30, 130);
      ctx.fillText("Kasir  : Budi S.", 30, 150);
      ctx.fillText("--------------------------------", 30, 175);
      ctx.fillText("Minyak Goreng 2L      Rp 36.500", 30, 205);
      ctx.fillText("Telur Ayam 10 Butir   Rp 28.000", 30, 235);
      ctx.fillText("Susu UHT Full Cream   Rp 19.500", 30, 265);
      ctx.fillText("Roti Tawar Gandum     Rp 16.000", 30, 295);
      ctx.fillText("--------------------------------", 30, 325);
      ctx.fillText("Subtotal              Rp 100.000", 30, 355);
      ctx.fillText("Diskon Member        -Rp  5.000", 30, 380);
      ctx.font = "bold 16px monospace";
      ctx.fillText("TOTAL BAYAR           Rp  95.000", 30, 415);
      ctx.font = "14px monospace";
      ctx.fillText("TUNAI                 Rp 100.000", 30, 440);
      ctx.fillText("KEMBALI               Rp   5.000", 30, 465);
      ctx.textAlign = "center";
      ctx.fillText("*** TERIMA KASIH ***", 200, 510);
    }
    const sampleDataUrl = canvas.toDataURL("image/png");
    setImagePreview(sampleDataUrl);
    startScanning(sampleDataUrl);
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        deskripsi: "Item Tambahan",
        kategori: "Belanja Kebutuhan",
        jumlah: 10000,
        qty: 1,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate calculated total based on items
  const itemsTotal = items.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const displayTotal = recordMode === "summary"
    ? (scanResult?.totalAmount || itemsTotal)
    : itemsTotal;

  const handleSave = () => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const finalDate = transactionDate || todayIso;

    let expenseItemsToSave: ExpenseItem[] = [];

    if (recordMode === "summary") {
      expenseItemsToSave = [
        {
          tanggal: finalDate,
          kategori: summaryCategory,
          deskripsi: summaryDesc.trim() || `Belanja ${merchantName}`,
          jumlah: displayTotal,
        },
      ];
    } else {
      expenseItemsToSave = items.map((it) => ({
        tanggal: finalDate,
        kategori: it.kategori,
        deskripsi: it.qty && it.qty > 1 && !it.deskripsi.includes(`${it.qty}x`)
          ? `${it.deskripsi} (${it.qty}x)`
          : it.deskripsi,
        jumlah: Math.round(Number(it.jumlah) || 0),
      })).filter((it) => it.jumlah > 0);
    }

    if (expenseItemsToSave.length === 0) {
      setErrorMessage("Tidak ada item pengeluaran yang valid untuk disimpan.");
      return;
    }

    confetti({ particleCount: 60, spread: 65, origin: { y: 0.7 } });

    const newRecord: ExpenseRecord = {
      id: Date.now().toString(),
      rawInput: `[Scan Struk: ${merchantName}] ${expenseItemsToSave.map((i) => `${i.deskripsi}: ${formatRupiah(i.jumlah)}`).join(", ")}`,
      items: expenseItemsToSave,
      totalAmount: displayTotal,
      createdAt: new Date().toISOString(),
      source: "receipt_scan",
      status: "success",
      receiptImage: imagePreview || undefined,
    };

    onSuccess(newRecord);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-3xl">
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              Scan Struk Belanja AI
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                Gemini Vision
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Foto struk atau nota belanja, biarkan Gemini mengekstrak data & nominal secara otomatis.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {errorMessage && (
        <Alert variant="destructive" className="my-3">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Gagal Memproses Struk</AlertTitle>
          <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* STEP 1: UPLOAD / CAPTURE */}
      {step === "upload" && (
        <div className="py-4 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleProcessFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#27272a] hover:border-emerald-500/50 bg-[#121214] hover:bg-[#151518] transition-all rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-[#18181b] group-hover:scale-105 border border-[#27272a] group-hover:border-emerald-500/40 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 transition-all shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-200">
                Tarik & Lepaskan foto struk di sini, atau <span className="text-emerald-400 underline underline-offset-2">pilih file</span>
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Mendukung format JPG, PNG, WEBP. Bisa juga <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">Ctrl+V</kbd> untuk paste gambar.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full sm:w-1/2 border-[#27272a] bg-[#121214] hover:bg-[#18181b] text-zinc-200 gap-2 h-11"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              Ambil Foto dengan Kamera
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleUseSampleReceipt}
              className="w-full sm:w-1/2 text-xs text-zinc-400 hover:text-zinc-200 gap-2 h-11 border border-[#27272a] hover:border-zinc-700"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Coba Contoh Struk (Uji Coba Cepat)
            </Button>
          </div>

          <div className="p-3.5 rounded-xl border border-[#27272a]/80 bg-[#121214]/50 text-xs text-zinc-400 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Tips Scan Jelas:</strong> Pastikan pencahayaan cukup terang, foto struk tegak lurus, dan teks nama barang beserta total harga terlihat tidak buram.
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: SCANNING ANIMATION */}
      {step === "scanning" && (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
          {/* Receipt card with scan overlay */}
          <div className="relative w-52 h-64 rounded-xl border border-emerald-500/40 bg-[#0c0c0e] overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.15)] flex items-center justify-center">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Struk Belanja"
                className="w-full h-full object-cover opacity-50 filter grayscale contrast-125 scan-glitch"
              />
            ) : (
              <Receipt className="w-16 h-16 text-zinc-700" />
            )}

            {/* Ambient emerald glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-emerald-500/10 pointer-events-none" />

            {/* Moving laser line */}
            <div className="scan-laser" />

            {/* Viewfinder corner brackets */}
            <div className="scan-corner scan-corner-tl" />
            <div className="scan-corner scan-corner-tr" />
            <div className="scan-corner scan-corner-bl" />
            <div className="scan-corner scan-corner-br" />
          </div>

          {/* Status text block */}
          <div className="space-y-3">
            {/* Pulsing icon + label */}
            <div className="flex items-center justify-center gap-2.5">
              <div className="relative flex items-center justify-center w-6 h-6">
                <span className="scan-pulse-ring" />
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 relative z-10" />
              </div>
              <span className="text-emerald-400 font-semibold text-sm scan-data-flicker">
                Gemini Vision membaca struk
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
            </div>

            {/* Progress steps */}
            <div className="flex flex-col items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <span className="text-emerald-500/80">✓ Gambar diterima</span>
              <span className="text-emerald-400 scan-data-flicker">◌ Mendeteksi teks &amp; angka...</span>
              <span className="text-zinc-600">◌ Menyusun data pengeluaran</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & EDIT */}
      {step === "review" && scanResult && (
        <div className="py-2 space-y-5">
          {/* Header Bar Review */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-300">Struk Berhasil Dipindai!</p>
                <p className="text-[11px] text-zinc-400">Silakan tinjau dan koreksi data sebelum disimpan.</p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121214] border border-[#27272a] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setRecordMode("summary")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${recordMode === "summary"
                  ? "bg-emerald-500 text-black font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Ringkas (1 Total)
              </button>
              <button
                type="button"
                onClick={() => setRecordMode("detailed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${recordMode === "detailed"
                  ? "bg-emerald-500 text-black font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
                  }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                Rinci ({items.length} Item)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Thumbnail and Info Struk */}
            <div className="space-y-3">
              <div className="relative rounded-xl border border-[#27272a] bg-[#121214] p-3 space-y-2.5">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Preview Gambar Struk</p>
                {imagePreview && (
                  <div className="w-full h-40 rounded-lg overflow-hidden border border-[#27272a] bg-black">
                    <img src={imagePreview} alt="Struk" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="space-y-2 pt-1 text-xs">
                  <div>
                    <label className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                      <Store className="w-3 h-3 text-emerald-400" />
                      Nama Toko / Tempat:
                    </label>
                    <Input
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      placeholder="Nama toko"
                      className="h-8 text-xs bg-[#18181b] border-[#27272a]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      Tanggal Transaksi:
                    </label>
                    <Input
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="h-8 text-xs bg-[#18181b] border-[#27272a]"
                    />
                  </div>
                </div>
              </div>

              {/* Total Summary Box */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 space-y-1">
                <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Total yang akan dicatat:</span>
                <p className="text-2xl font-bold font-mono text-emerald-400">
                  {formatRupiah(displayTotal)}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {recordMode === "summary" ? "Tercatat sebagai 1 transaksi tunggal" : `Terbagi menjadi ${items.length} transaksi per barang`}
                </p>
              </div>
            </div>

            {/* Right Pane: Review Content according to Mode */}
            <div className="md:col-span-2 space-y-3">
              {recordMode === "summary" ? (
                <div className="p-4 rounded-xl border border-[#27272a] bg-[#121214] space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">Rangkuman 1 Transaksi</h4>
                    <p className="text-[11px] text-zinc-500">
                      Seluruh item di struk dirangkum menjadi satu catatan pengeluaran rapi.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 mb-1 block">Deskripsi Catatan:</label>
                      <Input
                        value={summaryDesc}
                        onChange={(e) => setSummaryDesc(e.target.value)}
                        placeholder="Contoh: Belanja Alfamart (Minyak, Telur)"
                        className="text-xs bg-[#18181b] border-[#27272a]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 mb-1 block">Kategori:</label>
                        <select
                          value={summaryCategory}
                          onChange={(e) => setSummaryCategory(e.target.value)}
                          className="w-full h-9 rounded-md border border-[#27272a] bg-[#18181b] px-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 mb-1 block">Total Nominal (Rp):</label>
                        <Input
                          type="number"
                          value={displayTotal}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            if (scanResult) {
                              setScanResult({ ...scanResult, totalAmount: val });
                            }
                          }}
                          className="text-xs bg-[#18181b] border-[#27272a] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary of items detected */}
                  <div className="pt-2 border-t border-[#27272a]">
                    <span className="text-[11px] text-zinc-400 font-semibold block mb-2">Item Terdeteksi dalam Struk:</span>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-[#18181b] border border-[#27272a]">
                          <span className="text-zinc-300 truncate max-w-[220px]">
                            {it.qty && it.qty > 1 ? `${it.qty}x ` : ""}{it.deskripsi}
                          </span>
                          <span className="text-zinc-400 font-mono shrink-0">{formatRupiah(it.jumlah)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* DETAILED MODE (BREAKDOWN ITEMS) */
                <div className="p-4 rounded-xl border border-[#27272a] bg-[#121214] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">Daftar Item Belanjaan</h4>
                      <p className="text-[11px] text-zinc-500">
                        Setiap item akan disimpan sebagai 1 baris pengeluaran terpisah.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      className="text-xs border-[#27272a] bg-[#18181b] hover:bg-[#27272a] gap-1 h-7"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      Tambah
                    </Button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-[#27272a] bg-[#18181b] space-y-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            value={it.deskripsi}
                            onChange={(e) => handleItemChange(idx, "deskripsi", e.target.value)}
                            placeholder="Nama item"
                            className="h-8 text-xs bg-[#121214] border-[#27272a] flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length <= 1}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={it.kategori}
                            onChange={(e) => handleItemChange(idx, "kategori", e.target.value)}
                            className="h-8 rounded-md border border-[#27272a] bg-[#121214] px-2 text-[11px] text-zinc-300 focus:outline-none"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>

                          <Input
                            type="number"
                            value={it.jumlah}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "jumlah",
                                Math.max(0, parseInt(e.target.value, 10) || 0)
                              )
                            }
                            placeholder="Harga (Rp)"
                            className="h-8 text-xs bg-[#121214] border-[#27272a] font-mono text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <DialogFooter className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between sm:justify-between w-full">
        {step === "review" ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStep("upload");
                setImagePreview(null);
                setScanResult(null);
              }}
              className="text-xs border-[#27272a] bg-[#121214] hover:bg-[#18181b] text-zinc-400 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Scan Ulang
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Simpan ke Catatan ({formatRupiah(displayTotal)})
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-end w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Tutup
            </Button>
          </div>
        )}
      </DialogFooter>
    </Dialog>
  );
}
