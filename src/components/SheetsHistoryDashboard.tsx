import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge, getCategoryBadgeVariant } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { formatRupiah } from "@/src/lib/utils";
import { fetchGoogleSheetsData, filterRecordsByDate, calculateAnalytics, GoogleSheetsRecord } from "@/src/services/googleSheetsService";
import { DataTablePagination } from "@/src/components/ui/data-table-pagination";
import { Table as TableIcon, RefreshCw, Calendar, Filter, TrendingUp, Receipt, DollarSign, ExternalLink, PieChart, AlertCircle, Search, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";

interface SheetsHistoryDashboardProps {
  spreadsheetId: string;
  onOpenSheetsGuide: () => void;
}

type SortField = "tanggal" | "kategori" | "deskripsi" | "jumlah" | "index";
type SortDirection = "asc" | "desc";

export function SheetsHistoryDashboard({ spreadsheetId, onOpenSheetsGuide }: SheetsHistoryDashboardProps) {
  const [records, setRecords] = useState<GoogleSheetsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"today" | "yesterday" | "last7days" | "thismonth" | "custom" | "all">("today");
  const todayStr = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("tanggal");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await fetchGoogleSheetsData(spreadsheetId, "Sheet1");
    if (res.success) setRecords(res.data);
    else setErrorMsg(res.error || "Gagal ambil data.");
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [spreadsheetId]);

  const dateFilteredItems = useMemo(() => filterRecordsByDate(records, filterType, customDate), [records, filterType, customDate]);
  const analytics = useMemo(() => calculateAnalytics(dateFilteredItems), [dateFilteredItems]);

  const searchedItems = useMemo(() => {
    if (!searchTerm.trim()) return dateFilteredItems;
    const q = searchTerm.toLowerCase().trim();
    return dateFilteredItems.filter((item) => item.deskripsi.toLowerCase().includes(q) || item.kategori.toLowerCase().includes(q) || item.tanggal.includes(q) || item.jumlah.toString().includes(q));
  }, [dateFilteredItems, searchTerm]);

  const sortedItems = useMemo(() => {
    const copy = [...searchedItems];
    return copy.sort((a, b) => {
      let aVal: any = a[sortField as keyof GoogleSheetsRecord];
      let bVal: any = b[sortField as keyof GoogleSheetsRecord];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [searchedItems, sortField, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, customDate, pageSize]);

  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() => sortedItems.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize), [sortedItems, validCurrentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 opacity-50" />;
    return sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />;
  };

  const handleExportCSV = () => {
    if (sortedItems.length === 0) return;
    const headers = ["No", "Tanggal", "Kategori", "Deskripsi", "Jumlah"];
    const rows = sortedItems.map((item, idx) => [idx + 1, `"${item.tanggal}"`, `"${item.kategori.replace(/"/g, '""')}"`, `"${item.deskripsi.replace(/"/g, '""')}"`, item.jumlah]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `pengeluaran_${filterType}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case "today": return "Hari ini";
      case "yesterday": return "Kemarin";
      case "last7days": return "7 Hari";
      case "thismonth": return "Bulan ini";
      case "custom": return customDate;
      default: return "Semua";
    }
  };

  const sheetsUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : "https://sheets.google.com";

  return (
    <div className="space-y-6">
      <Card className="border-[#27272a] bg-[#18181b] rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#121214] border-b border-[#27272a] pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-emerald-400" /> Riwayat
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">Data langsung dari Google Sheets.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2 border-[#27272a] bg-[#121214] text-xs">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <a href={sheetsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#27272a] bg-[#121214] text-xs text-zinc-300">
                <ExternalLink className="w-3.5 h-3.5" /> Buka Sheets
              </a>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl border border-amber-900/50 bg-amber-950/20 text-amber-200 text-xs flex justify-between gap-3">
              <span className="flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</span>
              <Button onClick={onOpenSheetsGuide} variant="outline" size="sm" className="shrink-0 text-xs h-7">Panduan</Button>
            </div>
          )}

          <div className="p-4 rounded-2xl border border-[#27272a] bg-[#121214] space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filter
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["today", "Hari Ini"],
                ["yesterday", "Kemarin"],
                ["last7days", "7 Hari"],
                ["thismonth", "Bulan Ini"],
                ["all", "Semua"],
              ].map(([val, label]) => (
                <button key={val} onClick={() => setFilterType(val as any)} className={`px-3 py-1.5 rounded-xl text-xs ${filterType === val ? "bg-emerald-500 text-black font-bold" : "bg-[#18181b] border border-[#27272a] text-zinc-400"}`}>
                  {label}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-auto">
                <Input type="date" max={todayStr} value={customDate} onChange={(e) => { if (e.target.value <= todayStr) { setCustomDate(e.target.value); setFilterType("custom"); } }} className={`h-8 w-36 text-xs ${filterType === "custom" ? "border-emerald-500" : ""}`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-[#27272a] bg-[#121214]">
              <div className="flex justify-between text-zinc-500"><span className="text-[11px] uppercase">Total</span><DollarSign className="w-4 h-4 text-emerald-400" /></div>
              <div className="text-xl font-bold font-mono text-emerald-400">{formatRupiah(analytics.totalSpent)}</div>
              <p className="text-[10px] text-zinc-500">{getFilterLabel()}</p>
            </div>
            <div className="p-4 rounded-2xl border border-[#27272a] bg-[#121214]">
              <div className="flex justify-between text-zinc-500"><span className="text-[11px] uppercase">Transaksi</span><Receipt className="w-4 h-4 text-blue-400" /></div>
              <div className="text-xl font-bold font-mono text-white">{analytics.transactionCount}</div>
              <p className="text-[10px] text-zinc-500">baris</p>
            </div>
            <div className="p-4 rounded-2xl border border-[#27272a] bg-[#121214]">
              <div className="flex justify-between text-zinc-500"><span className="text-[11px] uppercase">Rata-rata</span><TrendingUp className="w-4 h-4 text-purple-400" /></div>
              <div className="text-xl font-bold font-mono text-zinc-200">{formatRupiah(analytics.averagePerTransaction)}</div>
              <p className="text-[10px] text-zinc-500">per item</p>
            </div>
            <div className="p-4 rounded-2xl border border-[#27272a] bg-[#121214]">
              <div className="flex justify-between text-zinc-500"><span className="text-[11px] uppercase">Kategori</span><PieChart className="w-4 h-4 text-amber-400" /></div>
              <div className="text-sm font-bold text-white truncate pt-1">{Object.keys(analytics.categoryBreakdown).length ? Object.entries(analytics.categoryBreakdown).sort((a, b) => Number(b[1]) - Number(a[1]))[0][0] : "-"}</div>
              <p className="text-[10px] text-zinc-500">{Object.keys(analytics.categoryBreakdown).length} kategori</p>
            </div>
          </div>

          {Object.keys(analytics.categoryBreakdown).length > 0 && (
            <div className="p-4 rounded-2xl border border-[#27272a] bg-[#121214] space-y-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5 text-amber-400" /> Kategori</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analytics.categoryBreakdown).map(([cat, amount]) => {
                  const percent = analytics.totalSpent > 0 ? Math.round((Number(amount) / analytics.totalSpent) * 100) : 0;
                  return (
                    <div key={cat} className="px-3 py-1.5 rounded-xl bg-[#18181b] border border-[#27272a] flex gap-2 text-xs">
                      <Badge variant={getCategoryBadgeVariant(cat)} className="text-[10px] py-0">{cat}</Badge>
                      <span className="font-mono text-zinc-200">{formatRupiah(Number(amount))}</span>
                      <span className="text-zinc-500">({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="relative max-w-xs w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 text-xs h-9" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!sortedItems.length} className="text-xs gap-1.5">
                  <Download className="w-3.5 h-3.5" /> CSV
                </Button>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="bg-[#121214] border border-[#27272a] text-xs rounded-lg px-2 py-1">
                  <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-[#27272a] bg-[#121214] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#27272a] bg-[#18181b]/80 text-zinc-400 text-[11px] uppercase">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th onClick={() => handleSort("tanggal")} className="py-3 px-4 cursor-pointer"><div className="flex gap-1.5">Tanggal {getSortIcon("tanggal")}</div></th>
                      <th onClick={() => handleSort("kategori")} className="py-3 px-4 cursor-pointer"><div className="flex gap-1.5">Kategori {getSortIcon("kategori")}</div></th>
                      <th onClick={() => handleSort("deskripsi")} className="py-3 px-4 cursor-pointer"><div className="flex gap-1.5">Deskripsi {getSortIcon("deskripsi")}</div></th>
                      <th onClick={() => handleSort("jumlah")} className="py-3 px-4 text-right cursor-pointer"><div className="flex justify-end gap-1.5">Jumlah {getSortIcon("jumlah")}</div></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]/60">
                    {paginatedItems.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center text-zinc-500"><Receipt className="w-6 h-6 mx-auto mb-2" />Tidak ada data</td></tr>
                    ) : (
                      paginatedItems.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-[#18181b]/70">
                          <td className="py-3 px-4 text-center font-mono text-zinc-500">{(validCurrentPage - 1) * pageSize + index + 1}</td>
                          <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{item.tanggal}</td>
                          <td className="py-3 px-4"><Badge variant={getCategoryBadgeVariant(item.kategori)} className="text-[11px]">{item.kategori}</Badge></td>
                          <td className="py-3 px-4 text-zinc-200">{item.deskripsi}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatRupiah(item.jumlah)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <DataTablePagination currentPage={validCurrentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={(p) => setCurrentPage(p)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
