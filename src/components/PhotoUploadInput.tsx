import React, { useCallback, useRef, useState } from "react";
import { parseExpenseFromImage } from "@/src/services/geminiVisionParser";
import { ExpenseItem } from "@/src/types";
import { formatRupiah } from "@/src/lib/utils";
import {
  Camera,
  Upload,
  X,
  ImageIcon,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ZoomIn,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";

interface PhotoUploadInputProps {
  onExtracted: (items: ExpenseItem[], imagePreviewUrl: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

type ScanState = "idle" | "uploading" | "scanning" | "done" | "error";

export function PhotoUploadInput({ onExtracted, onError, disabled }: PhotoUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewZoomed, setPreviewZoomed] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExpenseItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  const reset = () => {
    setScanState("idle");
    setPreviewUrl(null);
    setExtractedItems([]);
    setStatusMessage("");
    setPreviewZoomed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!file) return;

      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
      if (!validTypes.includes(file.type) && !file.type.startsWith("image/")) {
        onError("Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        onError("Ukuran foto terlalu besar (maks 10MB). Kompres foto terlebih dahulu.");
        return;
      }

      setScanState("uploading");
      setStatusMessage("Memuat foto...");
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      await new Promise((r) => setTimeout(r, 300)); // let preview render

      setScanState("scanning");
      setStatusMessage("AI sedang membaca struk foto...");

      try {
        const { items, imagePreviewUrl } = await parseExpenseFromImage(file);
        setExtractedItems(items);
        setPreviewUrl(imagePreviewUrl);
        setScanState("done");
        setStatusMessage(`Berhasil mengekstrak ${items.length} item pengeluaran!`);
        onExtracted(items, imagePreviewUrl);
      } catch (err: any) {
        setScanState("error");
        setStatusMessage(err.message || "Gagal memproses foto.");
        onError(err.message || "Gagal memproses foto.");
      }
    },
    [onExtracted, onError]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const totalAmount = extractedItems.reduce((acc, it) => acc + it.jumlah, 0);

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        id="photo-file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || scanState === "scanning"}
      />
      <input
        ref={cameraInputRef}
        id="photo-camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || scanState === "scanning"}
      />

      {/* Main Drop Zone */}
      {scanState === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-4
            border-2 border-dashed rounded-2xl p-8 cursor-pointer
            transition-all duration-300 select-none min-h-[180px]
            ${dragOver
              ? "border-emerald-400 bg-emerald-500/10 scale-[1.01]"
              : "border-[#3f3f46] bg-[#121214] hover:border-emerald-500/60 hover:bg-emerald-500/5"
            }
          `}
        >
          <div
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center
              transition-all duration-300
              ${dragOver ? "bg-emerald-500/20 text-emerald-300" : "bg-[#18181b] text-zinc-400"}
            `}
          >
            {dragOver ? (
              <Upload className="w-7 h-7" />
            ) : (
              <ImageIcon className="w-7 h-7" />
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-zinc-200">
              {dragOver ? "Lepas foto di sini" : "Drop foto struk di sini"}
            </p>
            <p className="text-xs text-zinc-500">
              atau klik untuk pilih file · JPG, PNG, WEBP hingga 10MB
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              type="button"
              id="upload-file-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Pilih File
            </button>
            <button
              type="button"
              id="capture-camera-btn"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              Ambil Foto
            </button>
          </div>
        </div>
      )}

      {/* Scanning / Uploading State */}
      {(scanState === "uploading" || scanState === "scanning") && (
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0c0c0e] overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          {/* Image Preview with scan overlay */}
          {previewUrl && (
            <div className="relative w-full max-h-48 overflow-hidden bg-black flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Preview struk"
                className="max-h-48 w-auto object-contain opacity-50 scan-glitch"
              />
              {/* Scan animation overlay */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="scan-laser" />
                {/* Corner brackets */}
                <div className="scan-corner scan-corner-tl" />
                <div className="scan-corner scan-corner-tr" />
                <div className="scan-corner scan-corner-bl" />
                <div className="scan-corner scan-corner-br" />
              </div>
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-emerald-500/8 pointer-events-none" />
            </div>
          )}

          {/* Status bar */}
          <div className="p-3.5 flex items-center gap-3 border-t border-emerald-500/10">
            {/* Pulse ring icon */}
            <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
              <span className="scan-pulse-ring" />
              <Sparkles className="w-4 h-4 text-emerald-400 relative z-10" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                {statusMessage}
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              </span>
              <span className="text-[11px] text-zinc-500 font-mono scan-data-flicker">
                Gemini Vision AI · {scanState === "scanning" ? "Mengekstrak data..." : "Memuat gambar..."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Done / Error State */}
      {(scanState === "done" || scanState === "error") && (
        <div className="space-y-3">
          {/* Preview + status bar */}
          <div className="rounded-2xl border border-[#27272a] bg-[#121214] overflow-hidden">
            {previewUrl && (
              <div className="relative">
                <div
                  className={`relative w-full overflow-hidden bg-black flex items-center justify-center transition-all duration-300 ${previewZoomed ? "max-h-96" : "max-h-40"}`}
                >
                  <img
                    src={previewUrl}
                    alt="Struk hasil scan"
                    className={`w-auto object-contain transition-all duration-300 ${previewZoomed ? "max-h-96" : "max-h-40"}`}
                  />
                </div>
                {/* overlay controls */}
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewZoomed(!previewZoomed)}
                    className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur text-zinc-300 hover:text-white flex items-center justify-center transition-all"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur text-zinc-300 hover:text-red-400 flex items-center justify-center transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {scanState === "done" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-end justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-emerald-300 font-medium">{statusMessage}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-400">{formatRupiah(totalAmount)}</span>
                  </div>
                )}

                {scanState === "error" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-950/80 to-transparent p-3">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs text-red-300">{statusMessage}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Extracted items preview */}
          {scanState === "done" && extractedItems.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
              <div className="px-3 py-2 border-b border-emerald-500/20 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  {extractedItems.length} item ditemukan AI
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">{formatRupiah(totalAmount)}</span>
              </div>
              <div className="divide-y divide-emerald-500/10 max-h-48 overflow-y-auto">
                {extractedItems.map((item, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-200 truncate">{item.deskripsi}</p>
                      <p className="text-[10px] text-zinc-500">{item.kategori} · {item.tanggal}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">{formatRupiah(item.jumlah)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset / retry button */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reset}
              id="photo-reset-btn"
              className="text-xs border-[#27272a] bg-[#121214] text-zinc-400 hover:text-zinc-200 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {scanState === "error" ? "Coba Foto Lain" : "Ganti Foto"}
            </Button>
          </div>
        </div>
      )}

      {/* CSS for scan animation */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
          box-shadow: 0 0 8px 2px #10b98155;
          animation: scan 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
