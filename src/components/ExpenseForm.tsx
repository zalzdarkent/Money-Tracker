import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/src/components/ui/alert";
import { SAMPLE_PROMPTS } from "@/src/data/n8nWorkflow";
import { parseExpenseTextLocally } from "@/src/services/geminiParser";
import {
  parseExpenseTextWithGemini,
  getGeminiApiKey,
  setGeminiApiKey,
  getGeminiModel,
  setGeminiModel,
} from "@/src/services/geminiClient";
import { ReceiptScannerModal } from "@/src/components/ReceiptScannerModal";
import { ExpenseItem, ExpenseRecord } from "@/src/types";
import { getLocalDateString } from "@/src/services/googleSheetsService";
import confetti from "canvas-confetti";
import {
  Send,
  Loader2,
  Sparkles,
  Settings2,
  AlertCircle,
  HelpCircle,
  Zap,
  RefreshCw,
  SlidersHorizontal,
  Camera,
  CheckCircle,
  KeyRound,
  Check,
  Cpu,
} from "lucide-react";

interface ExpenseFormProps {
  onSuccess: (record: ExpenseRecord) => void;
  onOpenCorsGuide: () => void;
}

export function ExpenseForm({ onSuccess, onOpenCorsGuide }: ExpenseFormProps) {
  const [inputText, setInputText] = useState("");
  const [webhookUrl, setWebhookUrl] = useState(
    (import.meta as any).env?.VITE_N8N_WEBHOOK_URL || "/webhook/catat-keuangan"
  );
  const [executionMode, setExecutionModeState] = useState<"webhook" | "direct_ai">(() => {
    try {
      const saved = localStorage.getItem("aether_execution_mode");
      if (saved === "webhook" || saved === "direct_ai") return saved;
    } catch {}
    return "direct_ai"; // Default to fast Direct Gemini AI
  });

  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    isCorsOrNetwork?: boolean;
    canFallback?: boolean;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);

  // Custom Gemini API Key & Model state
  const [customKey, setCustomKeyState] = useState(() => getGeminiApiKey());
  const [customModel, setCustomModelState] = useState(() => getGeminiModel());
  const [keySaved, setKeySaved] = useState(false);

  const setExecutionMode = (mode: "webhook" | "direct_ai") => {
    setExecutionModeState(mode);
    try {
      localStorage.setItem("aether_execution_mode", mode);
    } catch {}
  };

  const handleSaveApiKey = () => {
    setGeminiApiKey(customKey);
    setGeminiModel(customModel);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleSelectSample = (sample: string) => {
    setInputText(sample);
    setErrorInfo(null);
  };

  const handleLocalFallback = () => {
    if (!inputText.trim()) return;
    try {
      const parsedItems = parseExpenseTextLocally(inputText);
      if (parsedItems.length === 0) {
        throw new Error("Nominal tidak ditemukan. Contoh: 'Beli lontong 2 ribu sama risol 3 ribu'.");
      }
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      const total = parsedItems.reduce((acc, curr) => acc + curr.jumlah, 0);
      onSuccess({
        id: Date.now().toString(),
        rawInput: inputText,
        items: parsedItems,
        totalAmount: total,
        createdAt: new Date().toISOString(),
        source: "gemini_direct",
        status: "success",
      });
      setInputText("");
      setErrorInfo(null);
    } catch (err: any) {
      setErrorInfo({ message: err.message || "Gagal parsing lokal.", canFallback: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setLoading(true);
    setErrorInfo(null);

    const todayDate = getLocalDateString();
    const cleanText = inputText.trim();

    try {
      // ⚡ FAST DIRECT GEMINI AI MODE (~0.8 - 1.2 detik)
      if (executionMode === "direct_ai") {
        try {
          const parsedItems = await parseExpenseTextWithGemini(cleanText);

          if (!parsedItems || parsedItems.length === 0) {
            throw new Error(
              "Tidak dapat mendeteksi pengeluaran. Contoh: 'Beli nasi padang 25rb sama es teh 5rb'."
            );
          }

          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
          const total = parsedItems.reduce((acc, curr) => acc + curr.jumlah, 0);

          onSuccess({
            id: Date.now().toString(),
            rawInput: cleanText,
            items: parsedItems,
            totalAmount: total,
            createdAt: new Date().toISOString(),
            source: "gemini_direct",
            status: "success",
          });

          // Background sync to n8n if available (non-blocking)
          fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              message: cleanText,
              currentDate: todayDate,
              timezone: "Asia/Jakarta",
            }),
          }).catch((bgErr) => {
            console.warn("Background webhook sync note:", bgErr);
          });

          setInputText("");
        } catch (aiErr: any) {
          console.warn("Direct Gemini parsing failed, falling back to local regex:", aiErr);
          handleLocalFallback();
        }
      } else {
        // 🔄 LEGACY N8N WEBHOOK SERIAL MODE
        const payload = {
          message: cleanText,
          currentDate: todayDate,
          timezone: "Asia/Jakarta",
        };

        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            if (
              res.status === 429 ||
              errText.includes("429") ||
              errText.includes("too many requests") ||
              errText.includes("ResourceExhausted")
            ) {
              throw new Error(
                "Gemini API Rate Limit (HTTP 429): Terlalu banyak request. Anda bisa langsung beralih ke 'Mode: Direct Gemini AI' di Pengaturan."
              );
            }
            if (res.status === 500) {
              throw new Error(
                `n8n Server Error (500): ${
                  errText.substring(0, 150) || "Terjadi kendala pada node workflow."
                } Cek tab Executions di n8n.`
              );
            }
            throw new Error(`Webhook merespon status ${res.status}: ${errText.substring(0, 100) || "Error"}`);
          }

          const rawText = await res.text();
          let data: any;
          try {
            data = JSON.parse(rawText);
            if (typeof data === "string") {
              try {
                data = JSON.parse(data);
              } catch {}
            }
          } catch {
            throw new Error(`Respon n8n bukan JSON yang valid. Pastikan node Respond to Webhook aktif.`);
          }

          let rawItems: any[] = [];
          if (Array.isArray(data)) rawItems = data;
          else if (Array.isArray(data?.data)) rawItems = data.data;
          else if (Array.isArray(data?.items)) rawItems = data.items;
          else if (Array.isArray(data?.expenses)) rawItems = data.expenses;
          else if (data && typeof data === "object") {
            if (data.status === "success" && !data.data && !data.items) {
              rawItems = [];
            } else {
              rawItems = [data];
            }
          }

          const normalizedItems: ExpenseItem[] = rawItems
            .map((raw) => {
              const item = raw?.json || raw || {};
              let rawNominal =
                item.jumlah ??
                item.Jumlah ??
                item["Jumlah (Rp)"] ??
                item.nominal ??
                item.Nominal ??
                item.amount ??
                item.Total;
              if (rawNominal == null) {
                const k = Object.keys(item).find((k) => /jumlah|nominal|amount|total/i.test(k));
                if (k) rawNominal = item[k];
              }
              const clean = typeof rawNominal === "string" ? rawNominal.replace(/[^\d.-]/g, "") : rawNominal;
              const nominal = Number(clean) || 0;
              let desc = item.deskripsi || item.description || item.item || item.nama;
              if (!desc) {
                const k = Object.keys(item).find((k) => /deskripsi|desc|nama|item/i.test(k));
                if (k) desc = item[k];
              }
              let cat = item.kategori || item.category;
              if (!cat) {
                const k = Object.keys(item).find((k) => /kategori|category/i.test(k));
                if (k) cat = item[k];
              }
              let tgl = item.tanggal || item.date;
              if (!tgl) {
                const k = Object.keys(item).find((k) => /tanggal|date/i.test(k));
                if (k) tgl = item[k];
              }
              return {
                tanggal: String(tgl || todayDate),
                kategori: String(cat || "Lain-lain"),
                deskripsi: String(desc || "Pengeluaran"),
                jumlah: nominal,
              };
            })
            .filter((it) => it.jumlah > 0 && it.deskripsi && !it.deskripsi.includes("Workflow was started"));

          if (normalizedItems.length === 0) {
            const fallbackItems = parseExpenseTextLocally(cleanText);
            if (fallbackItems.length > 0) {
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
              const fallbackTotal = fallbackItems.reduce((acc, it) => acc + it.jumlah, 0);
              onSuccess({
                id: Date.now().toString(),
                rawInput: cleanText,
                items: fallbackItems,
                totalAmount: fallbackTotal,
                createdAt: new Date().toISOString(),
                source: "gemini_direct",
                status: "success",
              });
              setInputText("");
              return;
            }
          }

          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
          const calculatedTotal = normalizedItems.reduce(
            (acc: number, curr: any) => acc + (Number(curr.jumlah) || 0),
            0
          );
          const total = data?.total_nominal && data.total_nominal > 0 ? data.total_nominal : calculatedTotal;

          onSuccess({
            id: Date.now().toString(),
            rawInput: cleanText,
            items: normalizedItems,
            totalAmount: total,
            createdAt: new Date().toISOString(),
            source: "n8n_webhook",
            status: "success",
          });
          setInputText("");
        } catch (fetchErr: any) {
          const isNetwork =
            fetchErr.name === "TypeError" ||
            fetchErr.message.includes("Failed to fetch") ||
            fetchErr.message.includes("CORS");
          setErrorInfo({
            message: isNetwork
              ? `Gagal terhubung ke ${webhookUrl}. Pastikan n8n aktif, atau beralih ke mode 'Direct Gemini AI' di Pengaturan.`
              : fetchErr.message,
            isCorsOrNetwork: isNetwork,
            canFallback: true,
          });
        }
      }
    } catch (err: any) {
      setErrorInfo({
        message: err.message || "Terjadi kesalahan.",
        isCorsOrNetwork: false,
        canFallback: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-[#27272a] bg-[#18181b] shadow-2xl overflow-hidden rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#121214] text-emerald-400 border border-[#27272a] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-white">Tambah Pengeluaran</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Ketik kalimat bebas atau scan foto struk belanjaanmu.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* SCAN STRUK BUTTON */}
              <Button
                type="button"
                onClick={() => setScannerModalOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer h-8 px-3 rounded-xl transition-all active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                Scan Struk
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-xs text-zinc-400 hover:text-zinc-200 gap-1.5 h-8 px-2.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {showSettings ? "Tutup" : "Pengaturan"}
              </Button>
            </div>
          </div>

          {showSettings && (
            <div className="mt-4 p-4 rounded-xl border border-[#27272a] bg-[#121214] space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Settings2 className="w-4 h-4 text-emerald-400" />
                    Jalur Eksekusi AI
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Direct Gemini AI merespon instan (~1s), sedangkan Webhook n8n menjalankan seluruh node workflow.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExecutionMode("direct_ai")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                      executionMode === "direct_ai"
                        ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                        : "bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    Direct Gemini (Cepat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExecutionMode("webhook")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      executionMode === "webhook"
                        ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20"
                        : "bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-white"
                    }`}
                  >
                    Webhook n8n
                  </button>
                </div>
              </div>

              {/* Gemini API Key Configuration */}
              <div className="pt-2 border-t border-[#27272a]/80 space-y-2">
                <label className="text-[11px] text-zinc-400 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    Google Gemini API Key:
                  </span>
                  <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">
                    Aktif untuk Scan Struk & Text
                  </Badge>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKeyState(e.target.value)}
                    placeholder="AIzaSy..."
                    className="text-xs font-mono bg-[#18181b] border-[#27272a]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveApiKey}
                    className="shrink-0 border-[#27272a] bg-[#18181b] text-xs gap-1"
                  >
                    {keySaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : "Simpan"}
                  </Button>
                </div>
              </div>

              {/* Gemini Model Configuration */}
              <div className="pt-2 border-t border-[#27272a]/80 space-y-2">
                <label className="text-[11px] text-zinc-400 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    Model AI Gemini:
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Free Tier AI Studio
                  </span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModelState(e.target.value)}
                    placeholder="gemini-3.6-flash"
                    className="text-xs font-mono bg-[#18181b] border-[#27272a]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveApiKey}
                    className="shrink-0 border-[#27272a] bg-[#18181b] text-xs gap-1"
                  >
                    {keySaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : "Simpan"}
                  </Button>
                </div>
              </div>

              {executionMode === "webhook" && (
                <div className="pt-2 border-t border-[#27272a]/80 space-y-2">
                  <label className="text-[11px] text-zinc-400 font-mono">URL Webhook:</label>
                  <div className="flex gap-2">
                    <Input
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="/webhook/catat-keuangan"
                      className="text-xs font-mono bg-[#18181b] border-[#27272a]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setWebhookUrl("/webhook/catat-keuangan")}
                      className="shrink-0 border-[#27272a] bg-[#18181b]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Vite Proxy otomatis menangani CORS via /webhook/catat-keuangan</span>
                    <button
                      type="button"
                      onClick={onOpenCorsGuide}
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" /> Panduan CORS
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (errorInfo) setErrorInfo(null);
                }}
                placeholder="Contoh: Beli kopi 25rb, bensin pertalite 30rb, makan siang warteg 22rb..."
                rows={4}
                className="text-sm font-sans resize-none"
              />
              <div className="absolute right-3 bottom-3 text-[11px] text-zinc-500 font-mono">
                {inputText.length} huruf
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] text-zinc-400 flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Contoh Kalimat Cepat:
                </span>
                <button
                  type="button"
                  onClick={() => setScannerModalOpen(true)}
                  className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3 h-3" />
                  Ada struk belanja? Scan di sini
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(prompt)}
                    className="px-3 py-1.5 rounded-xl text-xs bg-[#121214] hover:bg-[#18181b] text-zinc-300 border border-[#27272a] text-left truncate max-w-full cursor-pointer transition-all hover:border-zinc-500"
                  >
                    "{prompt.length > 42 ? prompt.slice(0, 42) + "..." : prompt}"
                  </button>
                ))}
              </div>
            </div>

            {errorInfo && (
              <Alert variant="destructive" className="bg-red-950/30 border-red-900/60 text-red-200">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <div className="space-y-2 w-full">
                  <AlertTitle className="text-red-300 font-semibold text-xs">Pemberitahuan</AlertTitle>
                  <AlertDescription className="text-red-200/90 text-xs leading-relaxed">
                    {errorInfo.message}
                  </AlertDescription>

                  <div className="pt-2 flex flex-wrap gap-2">
                    {errorInfo.canFallback && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleLocalFallback}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-7.5 text-xs rounded-lg cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        Ekstrak dengan AI Lokal Sekarang
                      </Button>
                    )}
                    {errorInfo.isCorsOrNetwork && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onOpenCorsGuide}
                        className="bg-red-950/40 border-red-800 text-red-200 h-7.5 text-xs rounded-lg"
                      >
                        Panduan CORS n8n
                      </Button>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between gap-3 bg-[#121214] p-4 border-t border-[#27272a]">
            <span className="text-xs text-zinc-400 font-mono flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  executionMode === "direct_ai"
                    ? "bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse"
                    : "bg-purple-400"
                }`}
              />
              {executionMode === "direct_ai" ? "Mode: Direct Gemini AI (Cepat)" : "Mode: n8n Webhook"}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setScannerModalOpen(true)}
                className="border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-zinc-300 text-xs font-semibold px-3 py-2.5 rounded-xl cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                Scan Foto
              </Button>

              <Button
                type="submit"
                disabled={loading || !inputText.trim()}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Ekstrak & Simpan
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* RECEIPT SCANNER MODAL */}
      <ReceiptScannerModal
        open={scannerModalOpen}
        onOpenChange={setScannerModalOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
