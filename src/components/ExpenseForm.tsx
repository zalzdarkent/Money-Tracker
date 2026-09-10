import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Input } from "@/src/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/src/components/ui/alert";
import { SAMPLE_PROMPTS } from "@/src/data/n8nWorkflow";
import { parseExpenseTextLocally } from "@/src/services/geminiParser";
import { ExpenseItem, ExpenseRecord, WebhookResponse } from "@/src/types";
import confetti from "canvas-confetti";
import { Send, Loader2, Sparkles, Settings2, AlertCircle, HelpCircle, Zap, RefreshCw, SlidersHorizontal } from "lucide-react";

interface ExpenseFormProps {
  onSuccess: (record: ExpenseRecord) => void;
  onOpenCorsGuide: () => void;
}

export function ExpenseForm({ onSuccess, onOpenCorsGuide }: ExpenseFormProps) {
  const [inputText, setInputText] = useState("");
  const [webhookUrl, setWebhookUrl] = useState((import.meta as any).env?.VITE_N8N_WEBHOOK_URL || "/webhook/catat-keuangan");
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
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`Webhook error ${res.status}`);
          const rawText = await res.text();
          let data: WebhookResponse;
          try {
            data = JSON.parse(rawText);
          } catch {
            throw new Error(`Respon bukan JSON. Cek Executions di n8n atau pastikan Respond to Webhook aktif.`);
          }
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });

          let rawItems: any[] = [];
          if (Array.isArray(data)) rawItems = data;
          else if (Array.isArray((data as any).data)) rawItems = (data as any).data;
          else if (Array.isArray((data as any).items)) rawItems = (data as any).items;
          else if (data && typeof data === "object") rawItems = [data];

          const todayStr = new Date().toISOString().split("T")[0];
          const normalizedItems: ExpenseItem[] = rawItems
            .map((raw) => {
              const item = raw?.json || raw || {};
              let rawNominal =
                item.jumlah ?? item.Jumlah ?? item["Jumlah (Rp)"] ?? item.nominal ?? item.Nominal ?? item.amount ?? item.Total;
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
              return { tanggal: String(tgl || todayStr), kategori: String(cat || "Lain-lain"), deskripsi: String(desc || "Pengeluaran"), jumlah: nominal };
            })
            .filter((it) => it.jumlah > 0 || it.deskripsi);

          const calculatedTotal = normalizedItems.reduce((acc: number, curr: any) => acc + (Number(curr.jumlah) || 0), 0);
          const total = (data as any).total_nominal && (data as any).total_nominal > 0 ? (data as any).total_nominal : calculatedTotal;

          onSuccess({ id: Date.now().toString(), rawInput: inputText, items: normalizedItems, totalAmount: total, createdAt: new Date().toISOString(), source: "n8n_webhook", status: "success" });
          setInputText("");
        } catch (fetchErr: any) {
          const isNetwork = fetchErr.name === "TypeError" || fetchErr.message.includes("Failed to fetch") || fetchErr.message.includes("CORS");
          setErrorInfo({
            message: isNetwork ? `Gagal terhubung ke ${webhookUrl}. Pastikan n8n aktif dan CORS diizinkan.` : fetchErr.message,
            isCorsOrNetwork: isNetwork,
          });
        }
      } else {
        await new Promise((r) => setTimeout(r, 600));
        const parsedItems = parseExpenseTextLocally(inputText);
        if (parsedItems.length === 0) throw new Error("Nominal tidak ditemukan. Contoh: 'Beli kopi 25rb'.");
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
        const total = parsedItems.reduce((acc, curr) => acc + curr.jumlah, 0);
        onSuccess({ id: Date.now().toString(), rawInput: inputText, items: parsedItems, totalAmount: total, createdAt: new Date().toISOString(), source: "gemini_direct", status: "success" });
        setInputText("");
      }
    } catch (err: any) {
      setErrorInfo({ message: err.message || "Terjadi kesalahan.", isCorsOrNetwork: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-[#27272a] bg-[#18181b] shadow-2xl overflow-hidden rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#121214] text-emerald-400 border border-[#27272a] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-white">Tambah Pengeluaran</CardTitle>
              <CardDescription className="text-xs text-zinc-400">Tulis dengan bahasa sehari-hari.</CardDescription>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="text-xs text-zinc-400 hover:text-zinc-200 gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showSettings ? "Tutup" : "Pengaturan"}
          </Button>
        </div>

        {showSettings && (
          <div className="mt-4 p-4 rounded-xl border border-[#27272a] bg-[#121214] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                Mode
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExecutionMode("webhook")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${executionMode === "webhook" ? "bg-emerald-500 text-black font-bold" : "bg-[#18181b] border border-[#27272a] text-zinc-400"}`}
                >
                  Webhook
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionMode("direct_ai")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${executionMode === "direct_ai" ? "bg-purple-600 text-white font-bold" : "bg-[#18181b] border border-[#27272a] text-zinc-400"}`}
                >
                  AI Lokal
                </button>
              </div>
            </div>

            {executionMode === "webhook" && (
              <div className="space-y-2">
                <label className="text-[11px] text-zinc-400 font-mono">URL Webhook:</label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="http://localhost:5678/webhook/catat-keuangan" className="text-xs font-mono" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setWebhookUrl("/webhook/catat-keuangan")} className="shrink-0 border-[#27272a] bg-[#18181b]">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Gunakan Production URL setelah workflow aktif.</span>
                  <button type="button" onClick={onOpenCorsGuide} className="text-emerald-400 hover:underline flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> CORS
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
              placeholder="Contoh: Beli kopi 25rb, bensin 30rb, makan siang 22rb..."
              rows={4}
              className="text-sm"
            />
            <div className="absolute right-3 bottom-3 text-[11px] text-zinc-500 font-mono">{inputText.length} huruf</div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Contoh:
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(prompt)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-[#121214] hover:bg-[#18181b] text-zinc-300 border border-[#27272a] text-left truncate max-w-full"
                >
                  "{prompt.length > 42 ? prompt.slice(0, 42) + "..." : prompt}"
                </button>
              ))}
            </div>
          </div>

          {errorInfo && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <div className="space-y-1">
                <AlertTitle className="text-red-300">Gagal</AlertTitle>
                <AlertDescription className="text-red-200/90 text-xs">{errorInfo.message}</AlertDescription>
                {errorInfo.isCorsOrNetwork && (
                  <div className="pt-2 flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={onOpenCorsGuide} className="bg-red-950/40 border-red-800 text-red-200 h-7 text-xs">
                      Panduan CORS
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setExecutionMode("direct_ai")} className="h-7 text-xs text-white">
                      Pakai AI Lokal
                    </Button>
                  </div>
                )}
              </div>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-3 bg-[#121214] p-4 border-t border-[#27272a]">
          <span className="text-xs text-zinc-500 font-mono flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${executionMode === "webhook" ? "bg-emerald-400" : "bg-purple-400"}`} />
            {executionMode === "webhook" ? "Webhook" : "AI Lokal"}
          </span>
          <Button type="submit" disabled={loading || !inputText.trim()} size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-xl font-bold text-sm">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Simpan
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
