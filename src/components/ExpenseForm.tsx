import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Input } from "@/src/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/src/components/ui/alert";
import { SAMPLE_PROMPTS } from "@/src/data/n8nWorkflow";
import { parseExpenseTextLocally } from "@/src/services/geminiParser";
import { ExpenseRecord, WebhookResponse } from "@/src/types";
import confetti from "canvas-confetti";
import { 
  Send, 
  Loader2, 
  Sparkles, 
  Settings2, 
  AlertCircle, 
  HelpCircle, 
  Zap, 
  Globe, 
  RefreshCw,
  SlidersHorizontal,
  Bot
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
  const [executionMode, setExecutionMode] = useState<"webhook" | "direct_ai">("webhook");
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ message: string; isCorsOrNetwork?: boolean } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleSelectSample = (sample: string) => {
    setInputText(sample);
    setErrorInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setErrorInfo(null);

    const payload = { message: inputText.trim() };

    try {
      if (executionMode === "webhook") {
        // Mode 1: Send HTTP POST request to n8n Webhook
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            throw new Error(`n8n Webhook merespon dengan status ${res.status} (${res.statusText})`);
          }

          const data: WebhookResponse = await res.json();

          // Trigger celebratory confetti
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });

          const items = data.data || [];
          const total = data.total_nominal || items.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);

          onSuccess({
            id: Date.now().toString(),
            rawInput: inputText,
            items: items,
            totalAmount: total,
            createdAt: new Date().toISOString(),
            source: "n8n_webhook",
            status: "success",
          });

          setInputText("");
        } catch (fetchErr: any) {
          console.error("Webhook fetch error:", fetchErr);
          const isNetworkError =
            fetchErr.name === "TypeError" ||
            fetchErr.message.includes("Failed to fetch") ||
            fetchErr.message.includes("NetworkError") ||
            fetchErr.message.includes("CORS");

          setErrorInfo({
            message: isNetworkError
              ? `Tidak dapat terhubung ke webhook n8n di ${webhookUrl}. Pastikan n8n sedang berjalan, workflow sudah diaktifkan untuk URL production, dan CORS sudah diizinkan.`
              : fetchErr.message || "Gagal mengirim data ke n8n webhook.",
            isCorsOrNetwork: isNetworkError,
          });
        }
      } else {
        // Mode 2: Direct Gemini AI Parser Engine Test
        await new Promise((r) => setTimeout(r, 600)); // slight natural delay
        const parsedItems = parseExpenseTextLocally(inputText);

        if (parsedItems.length === 0) {
          throw new Error("Tidak dapat menemukan nominal pengeluaran dalam teks. Masukkan contoh seperti 'Beli kopi 25rb'.");
        }

        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
        });

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
      }
    } catch (err: any) {
      setErrorInfo({
        message: err.message || "Terjadi kesalahan saat memproses pengeluaran.",
        isCorsOrNetwork: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-[#27272a] bg-[#18181b] shadow-2xl overflow-hidden rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#121214] text-emerald-400 border border-[#27272a] flex items-center justify-center shadow-inner">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-serif italic text-white tracking-tight">
                Expense Transaction Capture
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Tuliskan pengeluaran harian dengan bahasa santai sehari-hari.
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-zinc-400 hover:text-zinc-200 gap-1.5 hover:bg-[#27272a]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showSettings ? "Sembunyikan Opsi" : "Opsi Webhook"}</span>
          </Button>
        </div>

        {/* Collapsible Connection Settings */}
        {showSettings && (
          <div className="mt-4 p-4 rounded-xl border border-[#27272a] bg-[#121214] space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                Target Eksekusi Request
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExecutionMode("webhook")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    executionMode === "webhook"
                      ? "bg-emerald-500 text-black font-bold shadow-sm"
                      : "bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  n8n Localhost Webhook
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionMode("direct_ai")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    executionMode === "direct_ai"
                      ? "bg-purple-600 text-white font-bold shadow-sm"
                      : "bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Direct AI Engine Preview
                </button>
              </div>
            </div>

            {executionMode === "webhook" && (
              <div className="space-y-2">
                <label className="text-[11px] text-zinc-400 flex items-center justify-between font-mono">
                  <span>URL Webhook n8n (POST Target):</span>
                  <span className="text-zinc-500 text-[10px]">
                    Default Port: 5678
                  </span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="http://localhost:5678/webhook/catat-keuangan"
                    className="text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWebhookUrl("/webhook/catat-keuangan") }
                    className="text-xs shrink-0 border-[#27272a] bg-[#18181b]"
                    title="Reset to default test webhook"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>
                    Tips: gunakan <strong>Production URL</strong> setelah workflow di n8n diaktifkan. Test URL hanya berlaku saat <em>Listen for Test Event</em> aktif.
                  </span>
                  <button
                    type="button"
                    onClick={onOpenCorsGuide}
                    className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Panduan CORS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (errorInfo) setErrorInfo(null);
                }}
                placeholder="Contoh: Beli kopi 25rb, bensin pertalite 30rb, makan siang warteg 22rb..."
                rows={4}
                className="text-sm font-sans"
              />
              <div className="absolute right-3 bottom-3 text-[11px] text-zinc-500 font-mono">
                {inputText.length} karakter
              </div>
            </div>
          </div>

          {/* Quick sample chips */}
          <div className="space-y-2">
            <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Coba template teks instan:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(prompt)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-[#121214] hover:bg-[#18181b] text-zinc-300 hover:text-white border border-[#27272a] hover:border-zinc-500 text-left transition-all truncate max-w-full cursor-pointer"
                >
                  "{prompt.length > 42 ? prompt.slice(0, 42) + "..." : prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {errorInfo && (
            <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <div className="space-y-1">
                <AlertTitle className="text-red-300 font-semibold">Gagal Mengirim Transaksi</AlertTitle>
                <AlertDescription className="text-red-200/90 text-xs leading-relaxed">
                  {errorInfo.message}
                </AlertDescription>
                {errorInfo.isCorsOrNetwork && (
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onOpenCorsGuide}
                      className="bg-red-950/40 border-red-800 text-red-200 hover:bg-red-900/60 text-xs h-7"
                    >
                      Buka Solusi CORS & n8n Guide
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setExecutionMode("direct_ai")}
                      className="text-xs h-7 text-white hover:bg-red-900/30"
                    >
                      Gunakan Direct AI Preview
                    </Button>
                  </div>
                )}
              </div>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121214] p-4 sm:p-6 border-t border-[#27272a]">
          <div className="text-xs text-zinc-400 flex items-center gap-2 font-mono">
            <span className={`w-2 h-2 rounded-full ${executionMode === "webhook" ? "bg-emerald-400 animate-pulse" : "bg-purple-400"}`} />
            <span>
              Mode: {executionMode === "webhook" ? "n8n Webhook POST" : "Direct AI Parser"}
            </span>
          </div>

          <Button
            type="submit"
            disabled={loading || !inputText.trim()}
            size="lg"
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Memproses AI & Menghubungi Webhook...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Transaksi &bull; Run Webhook</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
