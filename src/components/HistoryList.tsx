import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Badge, getCategoryBadgeVariant } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { formatRupiah } from "@/src/lib/utils";
import { ExpenseRecord } from "@/src/types";
import { DataTablePagination } from "@/src/components/ui/data-table-pagination";
import { History, Trash2, Calendar, Receipt, Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Table as TableIcon, LayoutGrid, Clock } from "lucide-react";

interface HistoryListProps {
  records: ExpenseRecord[];
  onClear: () => void;
}

type SortField = "tanggal" | "kategori" | "deskripsi" | "jumlah" | "createdAt";
type SortDirection = "asc" | "desc";

interface FlatRow {
  id: string;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  rawInput: string;
  source: string;
  createdAt: string;
}

export function HistoryList({ records, onClear }: HistoryListProps) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const allRows: FlatRow[] = useMemo(() => {
    const rows: FlatRow[] = [];
    records.forEach((rec) => rec.items.forEach((item, idx) => rows.push({ id: `${rec.id}-${idx}`, tanggal: item.tanggal, kategori: item.kategori, deskripsi: item.deskripsi, jumlah: item.jumlah, rawInput: rec.rawInput, source: rec.source, createdAt: rec.createdAt })));
    return rows;
  }, [records]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return allRows;
    const q = searchTerm.toLowerCase();
    return allRows.filter((r) => r.deskripsi.toLowerCase().includes(q) || r.kategori.toLowerCase().includes(q) || r.tanggal.includes(q) || r.jumlah.toString().includes(q));
  }, [allRows, searchTerm]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    return copy.sort((a, b) => {
      let av: any = a[sortField], bv: any = b[sortField];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDirection === "asc" ? -1 : 1;
      if (av > bv) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortField, sortDirection]);

  useMemo(() => setCurrentPage(1), [searchTerm, pageSize]);

  const totalItems = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => sortedRows.slice((validPage - 1) * pageSize, validPage * pageSize), [sortedRows, validPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection((p) => (p === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDirection("desc"); }
  };

  const getSortIcon = (field: SortField) => sortField !== field ? <ArrowUpDown className="w-3.5 h-3.5 opacity-40" /> : sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />;

  const handleExportCSV = () => {
    if (!sortedRows.length) return;
    const headers = ["No", "Tanggal", "Kategori", "Deskripsi", "Jumlah"];
    const rows = sortedRows.map((r, i) => [i + 1, `"${r.tanggal}"`, `"${r.kategori.replace(/"/g, '""')}"`, `"${r.deskripsi.replace(/"/g, '""')}"`, r.jumlah]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `riwayat_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (records.length === 0) {
    return (
      <Card className="border-[#27272a] bg-[#18181b] text-center py-10 rounded-2xl">
        <CardContent className="space-y-2">
          <Receipt className="w-6 h-6 mx-auto text-zinc-600" />
          <p className="text-sm text-zinc-400">Belum ada riwayat</p>
          <p className="text-xs text-zinc-600">Tambah pengeluaran untuk melihatnya di sini.</p>
        </CardContent>
      </Card>
    );
  }

  const grandTotal = records.reduce((acc, rec) => acc + rec.totalAmount, 0);

  return (
    <Card className="border-[#27272a] bg-[#18181b] rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-[#27272a] bg-[#121214] pb-4">
        <div className="flex justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold text-white">Riwayat Sesi</CardTitle>
              <Badge variant="outline" className="text-[10px]">{allRows.length} item</Badge>
            </div>
            <CardDescription className="text-xs text-zinc-500">{records.length} batch • {allRows.length} transaksi</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-emerald-400">{formatRupiah(grandTotal)}</span>
            <Button variant="outline" size="sm" onClick={onClear} className="text-xs border-[#27272a] text-red-400"><Trash2 className="w-3.5 h-3.5 mr-1" />Hapus</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 text-xs h-8" />
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex bg-[#121214] border border-[#27272a] rounded-xl p-0.5">
              <button onClick={() => setViewMode("table")} className={`px-2.5 py-1 rounded-lg text-xs flex gap-1.5 ${viewMode === "table" ? "bg-[#27272a] text-white" : "text-zinc-500"}`}><TableIcon className="w-3 h-3" />Tabel</button>
              <button onClick={() => setViewMode("cards")} className={`px-2.5 py-1 rounded-lg text-xs flex gap-1.5 ${viewMode === "cards" ? "bg-[#27272a] text-white" : "text-zinc-500"}`}><LayoutGrid className="w-3 h-3" />Kartu</button>
            </div>
            {viewMode === "table" && (
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="bg-[#121214] border border-[#27272a] text-xs rounded-xl px-2 py-1">
                <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
              </select>
            )}
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs h-8"><Download className="w-3 h-3 mr-1" />CSV</Button>
          </div>
        </div>

        {viewMode === "table" ? (
          <div className="rounded-xl border border-[#27272a] bg-[#121214] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#18181b]/80 text-zinc-400 text-[10px] uppercase">
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th onClick={() => handleSort("tanggal")} className="py-2.5 px-3 cursor-pointer"><div className="flex gap-1">Tanggal {getSortIcon("tanggal")}</div></th>
                    <th onClick={() => handleSort("kategori")} className="py-2.5 px-3 cursor-pointer"><div className="flex gap-1">Kategori {getSortIcon("kategori")}</div></th>
                    <th onClick={() => handleSort("deskripsi")} className="py-2.5 px-3 cursor-pointer"><div className="flex gap-1">Deskripsi {getSortIcon("deskripsi")}</div></th>
                    <th onClick={() => handleSort("jumlah")} className="py-2.5 px-3 text-right cursor-pointer"><div className="flex justify-end gap-1">Jumlah {getSortIcon("jumlah")}</div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/50">
                  {paginatedRows.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-zinc-500">Tidak ada hasil</td></tr>
                  ) : paginatedRows.map((row, i) => (
                    <tr key={row.id} className="hover:bg-[#18181b]/50">
                      <td className="py-2.5 px-3 text-center font-mono text-zinc-500">{(validPage - 1) * pageSize + i + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap flex gap-1"><Calendar className="w-3 h-3" />{row.tanggal}</td>
                      <td className="py-2.5 px-3"><Badge variant={getCategoryBadgeVariant(row.kategori)} className="text-[10px] py-0">{row.kategori}</Badge></td>
                      <td className="py-2.5 px-3 text-zinc-200 truncate max-w-[180px]">{row.deskripsi}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{formatRupiah(row.jumlah)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DataTablePagination currentPage={validPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setCurrentPage} />
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec) => (
              <div key={rec.id} className="rounded-xl border border-[#27272a] bg-[#121214] p-3 space-y-2">
                <div className="flex justify-between text-xs border-b border-[#27272a] pb-2">
                  <span className="flex items-center gap-1 text-zinc-500"><Clock className="w-3 h-3" />{new Date(rec.createdAt).toLocaleTimeString("id-ID")}</span>
                  <span className="font-mono font-bold text-emerald-400">{formatRupiah(rec.totalAmount)}</span>
                </div>
                <p className="text-xs italic text-zinc-400">"{rec.rawInput}"</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {rec.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs">
                      <div><div className="font-semibold text-zinc-200">{it.deskripsi}</div><Badge variant={getCategoryBadgeVariant(it.kategori)} className="text-[9px] py-0">{it.kategori}</Badge></div>
                      <span className="font-mono font-bold text-emerald-400">{formatRupiah(it.jumlah)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
