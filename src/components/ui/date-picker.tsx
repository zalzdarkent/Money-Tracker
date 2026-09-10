import React, { useRef } from "react";
import { Calendar, X } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  min?: string;
  className?: string;
  placeholder?: string;
  onClear?: () => void;
  isActive?: boolean;
}

export function DatePicker({
  value,
  onChange,
  max,
  min,
  className = "",
  placeholder = "Pilih tanggal...",
  onClear,
  isActive = false,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === "function") {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none text-xs font-mono group ${
        isActive
          ? "border-emerald-500 bg-[#18181b] text-emerald-300 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/30"
          : "border-[#27272a] bg-[#121214] text-zinc-300 hover:border-zinc-500 hover:text-white"
      } ${className}`}
    >
      <Calendar className={`w-3.5 h-3.5 transition-colors shrink-0 ${isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-emerald-400"}`} />
      
      <span className="truncate">
        {value ? value : <span className="text-zinc-500 font-sans">{placeholder}</span>}
      </span>

      {/* Hidden/Overlay Native Input for browser picker support with dark color-scheme */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        max={max}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer [color-scheme:dark]"
        tabIndex={-1}
      />

      {onClear && value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="ml-auto text-zinc-500 hover:text-zinc-300 p-0.5 rounded-md hover:bg-zinc-800 transition-colors"
          title="Reset tanggal"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
