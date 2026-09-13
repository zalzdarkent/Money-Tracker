import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Badge, getCategoryBadgeVariant } from "@/src/components/ui/badge";
import { formatRupiah } from "@/src/lib/utils";
import { WebhookResponse } from "@/src/types";
import { CheckCircle2, Calendar, Table as TableIcon, Camera } from "lucide-react";

interface ExpenseResultCardProps {
  response: WebhookResponse;
  source: string;
}

export function ExpenseResultCard({ response, source }: ExpenseResultCardProps) {
  const items = response.data || [];
  const totalNominal = response.total_nominal || items.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  const firstItem = items[0];

  return (
    <div className="space-y-4">
      {firstItem && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400">Ringkasan</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-2xl">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">Tanggal</span>
              <span className="text-sm font-mono text-white">{firstItem.tanggal}</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-2xl">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">Kategori</span>
              <span className="text-sm font-semibold text-emerald-400 truncate block">{firstItem.kategori}</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-2xl">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">Deskripsi</span>
              <span className="text-sm font-semibold text-white truncate block">{firstItem.deskripsi}</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-2xl">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">Total</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{formatRupiah(totalNominal)}</span>
            </div>
          </div>
        </div>
      )}

      <Card className="border-[#27272a] bg-[#18181b] rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#121214] border-b border-[#27272a] pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-white">{response.message || "Berhasil disimpan"}</CardTitle>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {source === "n8n_webhook" ? "via Webhook" : source === "photo_scan" ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Camera className="w-3 h-3" /> via Foto AI
                    </span>
                  ) : "via AI Lokal"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-500 uppercase">Total</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">{formatRupiah(totalNominal)}</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-zinc-300">
              <TableIcon className="w-4 h-4 text-emerald-400" />
              Rincian ({items.length})
            </span>
            <span className="text-zinc-500">Tersimpan</span>
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#121214] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#18181b]/80 text-zinc-400 text-[10px] uppercase">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Deskripsi</th>
                    <th className="py-2.5 px-3 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/50">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#18181b]/70">
                      <td className="py-2.5 px-3 text-center font-mono text-zinc-500 text-[10px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {item.tanggal}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={getCategoryBadgeVariant(item.kategori)} className="text-[10px] py-0">
                          {item.kategori}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-200">{item.deskripsi}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">{formatRupiah(item.jumlah)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
