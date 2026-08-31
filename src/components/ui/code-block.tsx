import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({ code, language = "json", filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("relative rounded-2xl border border-[#27272a] bg-[#09090b] overflow-hidden font-mono text-xs shadow-inner", className)}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#121214] border-b border-[#27272a] text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
            <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
            <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
          </div>
          {filename && <span className="text-xs text-zinc-300 font-sans font-medium ml-2">{filename}</span>}
          {!filename && <span className="text-[11px] uppercase tracking-wider text-zinc-500">{language}</span>}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[#18181b] hover:bg-[#27272a] text-zinc-300 transition-colors border border-[#27272a] cursor-pointer active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-sans font-medium">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-sans font-medium">Salin Kode</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto max-h-[380px] text-zinc-300 leading-relaxed scrollbar-thin bg-[#09090b]/80">
        <pre>{code}</pre>
      </div>
    </div>
  );
}
