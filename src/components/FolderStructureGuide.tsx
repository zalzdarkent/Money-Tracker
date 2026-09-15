import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { FolderTree } from "lucide-react";
import { CodeBlock } from "@/src/components/ui/code-block";

export function FolderStructureGuide() {
  const tree = `money-tracker/
├── src/
│   ├── App.tsx                       # Dashboard & root UI
│   ├── types.ts                      # Tipe data expense & receipt
│   ├── data/
│   │   └── prompts.ts                # Contoh kalimat cepat
│   ├── services/
│   │   ├── geminiClient.ts           # Gemini SDK & Scan Struk Vision
│   │   ├── geminiParser.ts           # Fallback local regex parser
│   │   └── googleSheetsService.ts    # Google Sheets (gviz read & GAS write)
│   └── components/
│       ├── ExpenseForm.tsx           # Form input teks & modal scan
│       ├── ReceiptScannerModal.tsx   # Scanner struk belanja Gemini Vision
│       ├── ExpenseResultCard.tsx     # Card hasil ekstraksi AI
│       ├── SheetsHistoryDashboard.tsx# Dashboard & analitik riwayat
│       ├── HistoryList.tsx           # Riwayat transaksi tersimpan
│       ├── GoogleSheetsGuideModal.tsx# Panduan 1-klik Apps Script
│       └── ui/                       # Komponen UI modern
└── vite.config.ts`;

  return (
    <Card className="border-[#27272a] bg-[#18181b] rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-[#27272a] bg-[#121214] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-white">Arsitektur & Struktur Project</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Direct Gemini AI + Google Apps Script (Zero Server, Zero n8n).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <CodeBlock code={tree} language="text" filename="structure" />
      </CardContent>
    </Card>
  );
}
