import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Badge, getCategoryBadgeVariant } from "@/src/components/ui/badge";
import { formatRupiah } from "@/src/lib/utils";
import { ExpenseItem, WebhookResponse } from "@/src/types";
import { CheckCircle2, Calendar, Tag, FileText, DollarSign, Layers, Sparkles } from "lucide-react";

interface ExpenseResultCardProps {
  response: WebhookResponse;
  source: string;
}

export function ExpenseResultCard({ response, source }: ExpenseResultCardProps) {
  const items = response.data || [];
  const totalNominal = response.total_nominal || items.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  const firstItem = items[0];

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      {/* 4-Column Quick Metric Overview */}
      {firstItem && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Last AI Extraction Summary
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-2xl">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Date Extracted</span>
              <span className="text-sm font-semibold font-mono text-white truncate block">{firstItem.tanggal}</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-2xl">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Primary Category</span>
              <span className="text-sm font-semibold text-emerald-400 truncate block">{firstItem.kategori}</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-2xl">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Top Item</span>
              <span className="text-sm font-semibold text-white truncate block">{firstItem.deskripsi}</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-2xl">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Batch Total</span>
              <span className="text-sm font-bold font-mono text-emerald-400 truncate block">{formatRupiah(totalNominal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Full Breakdown Card */}
      <Card className="border-[#27272a] bg-[#18181b] shadow-2xl overflow-hidden rounded-2xl">
        <CardHeader className="bg-[#121214] border-b border-[#27272a] pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-serif italic text-white flex items-center gap-2">
                  {response.message || "Transaksi Berhasil Diproses!"}
                </CardTitle>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  Pipeline: {source === "n8n_webhook" ? "n8n Webhook Engine" : "Gemini AI Direct Engine"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Total Pengeluaran</div>
                <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
                  {formatRupiah(totalNominal)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 font-mono">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Item Transaksi Terurai ({items.length} Item)</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              Status: Append to Google Sheets
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[#27272a] bg-[#121214] hover:border-zinc-600 transition-all gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">
                        {item.deskripsi}
                      </span>
                      <Badge variant={getCategoryBadgeVariant(item.kategori)}>
                        {item.kategori}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                      <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {item.tanggal}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right sm:self-center font-mono font-bold text-base text-emerald-400 shrink-0">
                  {formatRupiah(item.jumlah)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
