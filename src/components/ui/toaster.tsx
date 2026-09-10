import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X, ArrowRight, Table } from "lucide-react";
import { formatRupiah } from "@/src/lib/utils";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
  itemCount?: number;
  totalNominal?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToasterProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  key?: string;
  toast: ToastMessage;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="pointer-events-auto p-4 rounded-2xl border border-[#27272a] bg-[#121214]/95 backdrop-blur-md shadow-2xl shadow-black/80 flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 fade-in-50 duration-200">
      <div className="flex items-start gap-3">
        {toast.type === "success" ? (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}

        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white font-serif italic">{toast.title}</h4>
          {toast.description && (
            <p className="text-xs text-zinc-400 leading-relaxed">{toast.description}</p>
          )}

          {toast.totalNominal !== undefined && toast.totalNominal > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {formatRupiah(toast.totalNominal)}
              </span>
              {toast.itemCount !== undefined && (
                <span className="text-[10px] text-zinc-500 font-mono">
                  ({toast.itemCount} transaksi)
                </span>
              )}
            </div>
          )}

          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={toast.onAction}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
            >
              <span>{toast.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-[#27272a] transition-all cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
