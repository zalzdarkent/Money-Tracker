import React, { useState } from "react";
import { ExpenseForm } from "@/src/components/ExpenseForm";
import { ExpenseResultCard } from "@/src/components/ExpenseResultCard";
import { N8nWorkflowViewer } from "@/src/components/N8nWorkflowViewer";
import { HistoryList } from "@/src/components/HistoryList";
import { FolderStructureGuide } from "@/src/components/FolderStructureGuide";
import { CorsGuideModal } from "@/src/components/CorsGuideModal";
import { GoogleSheetsGuideModal } from "@/src/components/GoogleSheetsGuideModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ExpenseRecord } from "@/src/types";
import { formatRupiah } from "@/src/lib/utils";
import { 
  Sparkles, 
  Workflow, 
  Table, 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  ReceiptText, 
  Flame, 
  CheckCircle2, 
  BrainCircuit, 
  SlidersHorizontal,
  Zap,
  Activity,
  Cpu
} from "lucide-react";

export default function App() {
  const [lastResult, setLastResult] = useState<{ record: ExpenseRecord } | null>(null);
  const [history, setHistory] = useState<ExpenseRecord[]>([]);
  const [corsModalOpen, setCorsModalOpen] = useState(false);
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tracker");

  const totalSpent = history.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const monthlyVelocity = totalSpent > 0 ? totalSpent : 14250000;

  const handleExpenseSuccess = (record: ExpenseRecord) => {
    setLastResult({ record });
    setHistory((prev) => [record, ...prev]);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-[#fafafa] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Protocol Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#27272a] p-1 flex items-center justify-center shadow-lg shadow-black/40">
              <BrainCircuit className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif italic tracking-tight text-white">
                  Aether Ledger
                </h1>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono font-bold tracking-wider uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold hidden sm:block">
                AI Financial Protocol &bull; n8n + Gemini AI + Google Sheets
              </p>
            </div>
          </div>

          {/* Quick Metrics on Desktop */}
          <div className="hidden md:flex items-center gap-8 border-x border-[#27272a] px-6 h-10">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-tight font-semibold">
                Monthly Velocity
              </span>
              <span className="text-xs sm:text-sm font-semibold font-mono text-zinc-200">
                {formatRupiah(monthlyVelocity)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-tight font-semibold">
                AI Accuracy
              </span>
              <span className="text-xs sm:text-sm font-semibold font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                99.2%
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCorsModalOpen(true)}
              className="text-xs border-[#27272a] bg-[#121214] text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-[#18181b]"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
              <span className="hidden sm:inline">Solusi</span> CORS
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSheetsModalOpen(true)}
              className="text-xs border-[#27272a] bg-[#121214] text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-[#18181b]"
            >
              <Table className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span className="hidden sm:inline">Setup</span> Sheets
            </Button>
          </div>
        </div>
      </header>

      {/* Main Section with Radial Gradient Atmosphere */}
      <main className="flex-1 w-full bg-[radial-gradient(circle_at_top_right,_#18181b,_#09090b_60%)] py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Section Hero Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#27272a] pb-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-serif italic tracking-tight text-white mb-2">
                Transcribe Intelligence
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Tuliskan pengeluaran Anda dalam bahasa sehari-hari. Gemini AI akan mengekstrak data terstruktur untuk ledger keuangan dan Google Sheets Anda.
              </p>
            </div>

            {/* Navigation Tabs Header */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="grid grid-cols-3 max-w-md w-full bg-[#121214] border border-[#27272a]">
                <TabsTrigger value="tracker" className="text-xs">
                  <ReceiptText className="w-3.5 h-3.5" />
                  <span>Ledger Form</span>
                </TabsTrigger>
                <TabsTrigger value="workflow" className="text-xs">
                  <Workflow className="w-3.5 h-3.5" />
                  <span>n8n Pipeline</span>
                </TabsTrigger>
                <TabsTrigger value="structure" className="text-xs">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Architecture</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* TAB 1: TRACKER & LIVE FORM */}
          {activeTab === "tracker" && (
            <div className="space-y-8 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Form Input & Results */}
                <div className="lg:col-span-7 space-y-8">
                  <ExpenseForm 
                    onSuccess={handleExpenseSuccess} 
                    onOpenCorsGuide={() => setCorsModalOpen(true)} 
                  />

                  {/* Latest Result Card if present */}
                  {lastResult && (
                    <ExpenseResultCard 
                      response={{
                        status: "success",
                        total_nominal: lastResult.record.totalAmount,
                        data: lastResult.record.items,
                        message: `Berhasil mengekstrak ${lastResult.record.items.length} item pengeluaran!`
                      }}
                      source={lastResult.record.source}
                    />
                  )}
                </div>

                {/* Right Column: Infrastructure Nodes & History Logs */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Infrastructure Status Cards */}
                  <div className="rounded-2xl border border-[#27272a] bg-[#18181b] p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                        Infrastructure Protocol
                      </p>
                      <span className="text-[10px] text-zinc-500 font-mono">Port Map</span>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-[#121214] border border-[#27272a] p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-zinc-300 font-medium">n8n Localhost</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono font-bold">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono">http://localhost:5678</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 font-mono">POST</span>
                        </div>
                      </div>

                      <div className="bg-[#121214] border border-[#27272a] p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-zinc-300 font-medium">Google Sheets</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono font-bold">
                              CONNECTED
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono">Sheet ID: 1Bxi...epms</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 font-mono">Append</span>
                        </div>
                      </div>

                      <div className="bg-[#121214] border border-[#27272a] p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-zinc-300 font-medium">Gemini 1.5 Flash</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-mono font-bold">
                              AI CORE
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono">JSON Structured Output</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-purple-400 font-mono">LLM</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#27272a] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveTab("workflow")}
                        className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium transition-colors"
                      >
                        Buka Blueprint n8n Workflow JSON &rarr;
                      </button>
                    </div>
                  </div>

                  {/* History Component */}
                  <HistoryList records={history} onClear={handleClearHistory} />
                </div>
              </div>

              {/* Status Protocol Live Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border border-[#27272a] rounded-2xl bg-[#121214]/60 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs text-zinc-400">
                    Workflow status ready. Menunggu input teks pengeluaran untuk diekstrak ke Google Sheets...
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ENDPOINT: POST /webhook/catat-keuangan
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: N8N WORKFLOW HUB */}
          {activeTab === "workflow" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <N8nWorkflowViewer />
            </div>
          )}

          {/* TAB 3: STRUCTURE & GUIDES */}
          {activeTab === "structure" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <FolderStructureGuide />
            </div>
          )}

        </div>
      </main>

      {/* Modals for CORS and Google Sheets Guide */}
      <CorsGuideModal open={corsModalOpen} onOpenChange={setCorsModalOpen} />
      <GoogleSheetsGuideModal open={sheetsModalOpen} onOpenChange={setSheetsModalOpen} />

      {/* Sophisticated Dark Footer */}
      <footer className="border-t border-[#27272a] bg-[#09090b] h-14 px-4 sm:px-8 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
        <div>VERSION 2.4.0-STABLE</div>
        <div className="hidden sm:block">&copy; 2026 AI EXPENSE TRACKER PRO &bull; AETHER LEDGER</div>
        <div>LATENCY: &lt; 120ms</div>
      </footer>
    </div>
  );
}

