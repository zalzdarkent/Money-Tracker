import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Badge, getCategoryBadgeVariant } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { formatRupiah, formatDateIndo } from "@/src/lib/utils";
import { ExpenseRecord } from "@/src/types";
import { History, Trash2, Calendar, Receipt, DollarSign, Clock } from "lucide-react";

interface HistoryListProps {
  records: ExpenseRecord[];
  onClear: () => void;
}

export function HistoryList({ records, onClear }: HistoryListProps) {
  if (records.length === 0) {
    return (
      <Card className="border-[#27272a] bg-[#18181b] text-center py-10 rounded-2xl shadow-xl">
        <CardContent className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#121214] border border-[#27272a] text-zinc-500 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <CardTitle className="text-base text-zinc-300 font-serif italic">
            Belum Ada Riwayat Transaksi
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 max-w-sm mx-auto">
            Ketikkan pengeluaran Anda di formulir di atas dan kirim untuk melihat rincian item transaksi di sini.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const grandTotal = records.reduce((acc, rec) => acc + rec.totalAmount, 0);
  const totalItemCount = records.reduce((acc, rec) => acc + rec.items.length, 0);

  return (
    <Card className="border-[#27272a] bg-[#18181b] shadow-2xl overflow-hidden rounded-2xl">
      <CardHeader className="border-b border-[#27272a] bg-[#121214] pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-base font-serif italic text-white">
                Riwayat Sesi Pencatatan
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              Total {records.length} batch pengiriman ({totalItemCount} baris data transaksi)
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block font-semibold">Akumulasi Total</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {formatRupiah(grandTotal)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 border-[#27272a] bg-[#18181b] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Bersihkan
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {records.map((record) => (
          <div
            key={record.id}
            className="rounded-xl border border-[#27272a] bg-[#121214] p-4 space-y-3 hover:border-zinc-600 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272a] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {new Date(record.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <Badge
                  variant={record.source === "n8n_webhook" ? "default" : "secondary"}
                  className="text-[10px] py-0 font-mono"
                >
                  {record.source === "n8n_webhook" ? "n8n Webhook" : "Direct AI Engine"}
                </Badge>
              </div>

              <span className="text-sm font-bold text-emerald-400 font-mono">
                {formatRupiah(record.totalAmount)}
              </span>
            </div>

            <p className="text-xs text-zinc-400 italic bg-[#18181b] p-2.5 rounded-xl border border-[#27272a]">
              "{record.rawInput}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {record.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-semibold text-zinc-200 truncate">{item.deskripsi}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getCategoryBadgeVariant(item.kategori)} className="text-[10px] py-0">
                        {item.kategori}
                      </Badge>
                      <span className="text-[10px] text-zinc-500 font-mono">{item.tanggal}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 shrink-0">
                    {formatRupiah(item.jumlah)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
