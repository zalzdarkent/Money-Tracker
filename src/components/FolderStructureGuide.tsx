import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { FolderTree } from "lucide-react";
import { CodeBlock } from "@/src/components/ui/code-block";

export function FolderStructureGuide() {
  const tree = `money-tracker/
├── src/
│   ├── App.tsx
│   ├── types.ts
│   ├── data/n8nWorkflow.ts
│   ├── services/geminiParser.ts
│   └── components/
│       ├── ExpenseForm.tsx
│       ├── ExpenseResultCard.tsx
│       ├── SheetsHistoryDashboard.tsx
│       ├── HistoryList.tsx
│       └── ui/
└── vite.config.ts`;

  return (
    <Card className="border-[#27272a] bg-[#18181b] rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-[#27272a] bg-[#121214] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-white">Struktur Project</CardTitle>
            <CardDescription className="text-xs text-zinc-400">Struktur folder utama.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <CodeBlock code={tree} language="text" filename="structure" />
      </CardContent>
    </Card>
  );
}
