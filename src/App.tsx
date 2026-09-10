import React, { useEffect, useState } from "react";
import { ExpenseForm } from "@/src/components/ExpenseForm";
import { ExpenseResultCard } from "@/src/components/ExpenseResultCard";
import { N8nWorkflowViewer } from "@/src/components/N8nWorkflowViewer";
import { SheetsHistoryDashboard } from "@/src/components/SheetsHistoryDashboard";
import { HistoryList } from "@/src/components/HistoryList";
import { FolderStructureGuide } from "@/src/components/FolderStructureGuide";
import { CorsGuideModal } from "@/src/components/CorsGuideModal";
import { GoogleSheetsGuideModal } from "@/src/components/GoogleSheetsGuideModal";
import { Toaster, ToastMessage } from "@/src/components/ui/toaster";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { ExpenseRecord } from "@/src/types";
import { formatRupiah } from "@/src/lib/utils";
import { fetchGoogleSheetsData, getLocalDateString } from "@/src/services/googleSheetsService";
import { Workflow, Table, ShieldCheck, BookOpen, ReceiptText, BrainCircuit, BarChart3 } from "lucide-react";

const VALID_TABS = ["tracker", "sheets-history", "workflow", "structure"];

export default function App() {
  const [lastResult, setLastResult] = useState<{ record: ExpenseRecord } | null>(null);

  const [history, setHistory] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem("aether_expense_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [corsModalOpen, setCorsModalOpen] = useState(false);
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);

  const getInitialTab = (): string => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "").toLowerCase().trim();
      if (hash === "riwayat" || hash === "sheets" || hash === "history") return "sheets-history";
      if (VALID_TABS.includes(hash)) return hash;
      const saved = localStorage.getItem("aether_active_tab");
      if (saved && VALID_TABS.includes(saved)) return saved;
    }
    return "tracker";
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      window.location.hash = tab;
      try {
        localStorage.setItem("aether_active_tab", tab);
      } catch {}
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase().trim();
      if (hash === "riwayat" || hash === "sheets" || hash === "history") {
        setActiveTabState("sheets-history");
      } else if (VALID_TABS.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    if (!window.location.hash) {
      window.history.replaceState(null, "", `#${activeTab}`);
    }
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem("aether_expense_history", JSON.stringify(history));
    } catch {}
  }, [history]);

  const spreadsheetId = (import.meta as any).env?.VITE_GOOGLE_SHEETS_ID || "19_WEy7mMHbzderOH5kkiu0ChFnuj_0RG6noKqAJk_Q4";

  const [monthlyVelocity, setMonthlyVelocity] = useState<number | null>(null);
  const totalSpent = history.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const loadMonthlyTotalFromSheets = async () => {
    try {
      const res = await fetchGoogleSheetsData(spreadsheetId);
      if (res.success && res.data.length > 0) {
        const currentMonthPrefix = getLocalDateString().slice(0, 7); // e.g. "2026-09"
        const thisMonthItems = res.data.filter((item) => item.tanggal.startsWith(currentMonthPrefix));
        const monthTotal = thisMonthItems.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
        setMonthlyVelocity(monthTotal);
      }
    } catch (err) {
      console.warn("Gagal mengambil total bulan ini dari Google Sheets:", err);
    }
  };

  useEffect(() => {
    loadMonthlyTotalFromSheets();

    const handleFocus = () => {
      loadMonthlyTotalFromSheets();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [spreadsheetId]);

  const handleExpenseSuccess = (record: ExpenseRecord) => {
    setLastResult({ record });
    setHistory((prev) => [record, ...prev]);
    setMonthlyVelocity((prev) => (prev === null ? record.totalAmount : prev + record.totalAmount));

    // Refresh from Google Sheets after append
    setTimeout(() => {
      loadMonthlyTotalFromSheets();
    }, 1200);

    setToasts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "success",
        title: "Berhasil disimpan",
        description: `${record.items.length} item ke Google Sheets.`,
        itemCount: record.items.length,
        totalNominal: record.totalAmount,
        actionLabel: "Lihat Riwayat",
        onAction: () => setActiveTab("sheets-history"),
      },
    ]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("aether_expense_history");
    } catch {}
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-[#fafafa] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      <Toaster toasts={toasts} onDismiss={handleDismissToast} />

      <header className="border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Money Tracker</h1>
          </div>

          <div className="hidden md:flex items-center gap-6 border-x border-[#27272a] px-6 h-10">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Bulan Ini</span>
              <span className="text-sm font-mono text-emerald-400 font-bold">
                {monthlyVelocity !== null ? formatRupiah(monthlyVelocity) : totalSpent > 0 ? formatRupiah(totalSpent) : "-"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCorsModalOpen(true)}
              className="text-xs border-[#27272a] bg-[#121214] text-zinc-300 hover:text-white"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
              CORS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSheetsModalOpen(true)}
              className="text-xs border-[#27272a] bg-[#121214] text-zinc-300 hover:text-white"
            >
              <Table className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Sheets
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full bg-[radial-gradient(circle_at_top_right,_#18181b,_#09090b_60%)] py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#27272a] pb-6">
            <div className="max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Catat Pengeluaran</h2>
              <p className="text-zinc-400 text-sm mt-1">Ketik dengan bahasa sehari-hari, otomatis masuk ke Google Sheets.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 max-w-xl w-full bg-[#121214] border border-[#27272a]">
                <TabsTrigger value="tracker" className="text-xs">
                  <ReceiptText className="w-3.5 h-3.5" />
                  <span>Catat</span>
                </TabsTrigger>
                <TabsTrigger value="sheets-history" className="text-xs">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Riwayat</span>
                </TabsTrigger>
                <TabsTrigger value="workflow" className="text-xs">
                  <Workflow className="w-3.5 h-3.5" />
                  <span>Workflow</span>
                </TabsTrigger>
                <TabsTrigger value="structure" className="text-xs">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Struktur</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeTab === "tracker" && (
            <div className="space-y-8 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                  <ExpenseForm onSuccess={handleExpenseSuccess} onOpenCorsGuide={() => setCorsModalOpen(true)} />
                  {lastResult && (
                    <ExpenseResultCard
                      response={{
                        status: "success",
                        total_nominal: lastResult.record.totalAmount,
                        data: lastResult.record.items,
                        message: `${lastResult.record.items.length} item berhasil disimpan`,
                      }}
                      source={lastResult.record.source}
                    />
                  )}
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="rounded-2xl border border-[#27272a] bg-[#18181b] p-5 space-y-4">
                    <p className="text-xs font-semibold text-zinc-300">Status Koneksi</p>
                    <div className="space-y-3">
                      <div className="bg-[#121214] border border-[#27272a] p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-zinc-200">n8n Webhook</span>
                          <p className="text-[11px] text-zinc-500 font-mono">localhost:5678</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">Aktif</span>
                      </div>
                      <div className="bg-[#121214] border border-[#27272a] p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-zinc-200">Google Sheets</span>
                          <p className="text-[11px] text-zinc-500 font-mono">Terhubung</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">OK</span>
                      </div>
                      <div className="bg-[#121214] border border-[#27272a] p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-zinc-200">Gemini AI</span>
                          <p className="text-[11px] text-zinc-500 font-mono">Parser</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-mono">AI</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("workflow")}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      Lihat Workflow →
                    </button>
                  </div>

                  <HistoryList records={history} onClear={handleClearHistory} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-[#27272a] rounded-2xl bg-[#121214]/60 text-xs text-zinc-500">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Siap • Menunggu input
                </span>
                <span className="font-mono hidden sm:block">POST /webhook/catat-keuangan</span>
              </div>
            </div>
          )}

          {activeTab === "sheets-history" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <SheetsHistoryDashboard spreadsheetId={spreadsheetId} onOpenSheetsGuide={() => setSheetsModalOpen(true)} />
            </div>
          )}

          {activeTab === "workflow" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <N8nWorkflowViewer />
            </div>
          )}

          {activeTab === "structure" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <FolderStructureGuide />
            </div>
          )}
        </div>
      </main>

      <CorsGuideModal open={corsModalOpen} onOpenChange={setCorsModalOpen} />
      <GoogleSheetsGuideModal open={sheetsModalOpen} onOpenChange={setSheetsModalOpen} />

      <footer className="border-t border-[#27272a] bg-[#09090b] h-12 px-4 sm:px-8 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <span>© 2026 Money Tracker</span>
        <span className="hidden sm:block">v2.4.0</span>
      </footer>
    </div>
  );
}
