import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { FolderTree, FileCode, CheckCircle2, FileText, Settings, Terminal } from "lucide-react";
import { CodeBlock } from "@/src/components/ui/code-block";

export function FolderStructureGuide() {
  const folderTreeString = `ai-expense-tracker/
├── .env.example                     # Definisi variabel lingkungan & webhook URL
├── package.json                     # Konfigurasi dependensi React, Tailwind, Lucide
├── vite.config.ts                   # Konfigurasi Vite & proxy dev server
├── tsconfig.json                    # Konfigurasi TypeScript
├── index.html                       # Entry point HTML & font Plus Jakarta Sans
└── src/
    ├── main.tsx                     # Entry point React DOM
    ├── App.tsx                      # Komponen utama Expense Tracker Dashboard
    ├── index.css                    # Tailwind CSS import & global styling
    ├── types.ts                     # TypeScript interfaces (ExpenseItem, WebhookPayload, dll)
    ├── data/
    │   └── n8nWorkflow.ts           # n8n Workflow JSON Export, System Prompt & Scripts
    ├── services/
    │   └── geminiParser.ts          # Algoritma ekstraksi parser AI Bahasa Indonesia
    ├── components/
    │   ├── ExpenseForm.tsx          # Form input bebas, sample prompt & webhook dispatcher
    │   ├── ExpenseResultCard.tsx    # Kartu preview hasil ekstraksi & nominal rupiah
    │   ├── N8nWorkflowViewer.tsx    # Diagram node workflow & copyable JSON n8n
    │   ├── HistoryList.tsx          # Riwayat sesi pencatatan pengeluaran
    │   ├── CorsGuideModal.tsx       # Panduan mengatasi CORS antara port 5173 dan 5678
    │   ├── GoogleSheetsGuideModal.tsx # Panduan Service Account & Google Sheets
    │   └── ui/                      # Komponen UI modern berbasis Tailwind & Radix
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── badge.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       ├── input.tsx
    │       ├── dialog.tsx
    │       ├── alert.tsx
    │       └── code-block.tsx
    └── lib/
        └── utils.ts                 # Helper cn() & formatRupiah()`;

  return (
    <Card className="border-[#27272a] bg-[#18181b] shadow-2xl overflow-hidden rounded-2xl">
      <CardHeader className="border-b border-[#27272a] bg-[#121214] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-inner">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-serif italic text-white">
              Struktur Folder Project Vite + React yang Rapi & Modular
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Diorganisasikan secara modular memisahkan UI Primitives, Workflow Data, Services, dan Components.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <CodeBlock code={folderTreeString} language="text" filename="Project Directory Tree" />
      </CardContent>
    </Card>
  );
}
