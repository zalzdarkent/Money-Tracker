import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/src/components/ui/alert";
import { SAMPLE_PROMPTS } from "@/src/data/prompts";
import { parseExpenseTextLocally } from "@/src/services/geminiParser";
import {
  parseExpenseTextWithGemini,
  getGeminiApiKey,
  setGeminiApiKey,
  getGeminiModel,
  setGeminiModel,
} from "@/src/services/geminiClient";
import {
  getGoogleScriptUrl,
  setGoogleScriptUrl,
  appendExpensesToGoogleSheets,
  getLocalDateString,
} from "@/src/services/googleSheetsService";
import { ReceiptScannerModal } from "@/src/components/ReceiptScannerModal";
import { ExpenseItem, ExpenseRecord } from "@/src/types";
import confetti from "canvas-confetti";
import {
  Send,
  Loader2,
  Sparkles,
  Settings2,
  AlertCircle,
  HelpCircle,
  Zap,
  Camera,
  Check,
  Table,
} from "lucide-react";

interface ExpenseFormProps {
  onSuccess: (record: ExpenseRecord) => void;
  onOpenSheetsGuide: () => void;
}

export function ExpenseForm({ onSuccess, onOpenSheetsGuide }: ExpenseFormProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);

  // Settings state
  const [customKey, setCustomKeyState] = useState(() => getGeminiApiKey());
  const [customModel, setCustomModelState] = useState(() => getGeminiModel());
  const [customGasUrl, setCustomGasUrlState] = useState(() => getGoogleScriptUrl());
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveSettings = () => {
    setGeminiApiKey(customKey);
    setGeminiModel(customModel);
    setGoogleScriptUrl(customGasUrl);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleSelectSample = (sample: string) => {
    setInputText(sample);
    setErrorInfo(null);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText) return;

    setLoading(true);
    setErrorInfo(null);

    const todayDate = getLocalDateString();

    try {
      let parsedItems: ExpenseItem[] = [];

      try {
        parsedItems = await parseExpenseTextWithGemini(cleanText);
      } catch (geminiErr: any) {
        console.warn("Gemini API error, falling back to local regex:", geminiErr);
        parsedItems = parseExpenseTextLocally(cleanText);
      }

      if (!parsedItems || parsedItems.length === 0) {
        parsedItems = parseExpenseTextLocally(cleanText);
      }

      if (!parsedItems || parsedItems.length === 0) {
        throw new Error(
          "Tidak dapat mendeteksi pengeluaran. Contoh: 'Beli nasi padang 25rb sama es teh 5rb'."
        );
      }

      const total = parsedItems.reduce((acc, curr) => acc + curr.jumlah, 0);

      // Save to Google Sheets if GAS URL configured
      const gasUrl = getGoogleScriptUrl();
      if (gasUrl) {
        appendExpensesToGoogleSheets(parsedItems).catch((err) => {
          console.warn("Sync Google Sheets gagal:", err);
        });
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });

      onSuccess({
        id: Date.now().toString(),
        rawInput: cleanText,
        items: parsedItems,
        totalAmount: total,
        createdAt: new Date().toISOString(),
        source: gasUrl ? "google_sheets_gas" : "gemini_direct",
        status: "success",
      });

      setInputText("");
    } catch (err: any) {
      setErrorInfo(err.message || "Gagal memproses pengeluaran.");
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
                  Ketik kalimat santai atau scan foto struk belanjaanmu.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScannerModalOpen(true)}
                className="h-8 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Scan Struk AI
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 text-xs text-zinc-400 hover:text-white gap-1"
              >
                <Settings2 className="w-3.5 h-3.5" />
                {showSettings ? "Tutup" : "Pengaturan"}
              </Button>
            </div>
          </div>
        </CardHeader>

        {showSettings && (
          <div className="mx-6 mb-4 p-4 rounded-xl bg-[#121214] border border-[#27272a] space-y-3 animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">Pengaturan API & Sheets</span>
              <button
                type="button"
                onClick={onOpenSheetsGuide}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Table className="w-3 h-3" />
                Panduan Setup Apps Script
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Gemini API Key</label>
                <Input
                  type="password"
                  value={customKey}
                  onChange={(e) => setCustomKeyState(e.target.value)}
                  placeholder="AIzaSy..."
                  className="h-8 text-xs bg-[#18181b] border-[#27272a]"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Gemini Model</label>
                <Input
                  value={customModel}
                  onChange={(e) => setCustomModelState(e.target.value)}
                  placeholder="gemini-3.6-flash"
                  className="h-8 text-xs bg-[#18181b] border-[#27272a]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">
                Google Apps Script Web App URL (doPost)
              </label>
              <Input
                value={customGasUrl}
                onChange={(e) => setCustomGasUrlState(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="h-8 text-xs bg-[#18181b] border-[#27272a]"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveSettings}
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
              >
                {keySaved ? <Check className="w-3 h-3" /> : null}
                {keySaved ? "Tersimpan" : "Simpan Pengaturan"}
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleTextSubmit}>
          <CardContent className="space-y-4 pt-0">
            <div className="relative">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Contoh: Beli kopi kenangan 28rb, parkir 2rb, nasi uduk 15rb..."
                className="min-h-[90px] resize-none bg-[#121214] border-[#27272a] text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 text-sm leading-relaxed"
                disabled={loading}
              />
            </div>

            {/* Sample Prompts */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-500">Contoh cepat:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PROMPTS.slice(0, 4).map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#121214] hover:bg-[#27272a] text-zinc-400 hover:text-zinc-200 border border-[#27272a] transition-colors truncate max-w-[280px]"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {errorInfo && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-300 py-2.5">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle className="text-xs font-semibold">Gagal</AlertTitle>
                <AlertDescription className="text-xs">{errorInfo}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-[#27272a] pt-3 pb-3 bg-[#121214]">
            <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-400" />
              Gemini AI Direct
            </span>

            <Button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 h-8 gap-1.5 shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengekstrak...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Kirim
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <ReceiptScannerModal
        open={scannerModalOpen}
        onOpenChange={setScannerModalOpen}
        onSuccess={(record) => {
          // If GAS URL configured, sync items to Google Sheets
          const gasUrl = getGoogleScriptUrl();
          if (gasUrl) {
            appendExpensesToGoogleSheets(record.items).catch((err) => {
              console.warn("Sync Google Sheets gagal:", err);
            });
          }
          onSuccess(record);
        }}
      />
    </>
  );
}
