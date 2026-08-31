import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { CodeBlock } from "@/src/components/ui/code-block";
import { Button } from "@/src/components/ui/button";
import { 
  N8N_WORKFLOW_JSON, 
  GEMINI_SYSTEM_PROMPT, 
  N8N_CODE_NODE_SCRIPT 
} from "@/src/data/n8nWorkflow";
import { 
  Webhook, 
  BrainCircuit, 
  Code2, 
  Table, 
  Send, 
  ArrowRight, 
  Copy, 
  Check, 
  FileJson, 
  Sparkles,
  Info,
  Download
} from "lucide-react";

export function N8nWorkflowViewer() {
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const jsonWorkflowString = JSON.stringify(N8N_WORKFLOW_JSON, null, 2);

  const handleCopyWorkflow = async () => {
    try {
      await navigator.clipboard.writeText(jsonWorkflowString);
      setCopiedWorkflow(true);
      setTimeout(() => setCopiedWorkflow(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadWorkflow = () => {
    const blob = new Blob([jsonWorkflowString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "n8n-expense-tracker-workflow.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-[#27272a] bg-[#18181b] shadow-2xl overflow-hidden rounded-2xl">
      <CardHeader className="border-b border-[#27272a] bg-[#121214] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
                n8n Workflow Engine
              </span>
              <Badge variant="outline" className="text-zinc-400 text-[11px] font-mono border-[#27272a]">
                5 Nodes Pipeline
              </Badge>
            </div>
            <CardTitle className="text-lg sm:text-xl font-serif italic text-white flex items-center gap-2">
              Blueprint Arsitektur Workflow n8n Localhost
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-zinc-400">
              Alur otomasi end-to-end dari trigger HTTP Webhook, parsing LLM Gemini, validasi JS, hingga append Google Sheets.
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleDownloadWorkflow}
              variant="outline"
              size="sm"
              className="gap-2 border-[#27272a] bg-[#121214] text-zinc-300 hover:text-white hover:bg-[#27272a] text-xs rounded-xl cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download .json</span>
            </Button>
            
            <Button 
              onClick={handleCopyWorkflow}
              variant="default"
              size="sm"
              className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 shrink-0 cursor-pointer"
            >
              {copiedWorkflow ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>JSON Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Workflow JSON</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <Tabs defaultValue="visual">
          <TabsList className="grid grid-cols-3 max-w-md mb-6 bg-[#121214] border border-[#27272a]">
            <TabsTrigger value="visual" className="text-xs">Diagram Visual</TabsTrigger>
            <TabsTrigger value="json" className="text-xs">JSON Export n8n</TabsTrigger>
            <TabsTrigger value="code" className="text-xs">Prompt & Script</TabsTrigger>
          </TabsList>

          {/* TAB 1: VISUAL FLOW */}
          <TabsContent value="visual" className="space-y-6">
            {/* Visual Node Flow Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              {/* Node 1 */}
              <div className="rounded-2xl border border-[#27272a] bg-[#121214] p-4 flex flex-col justify-between space-y-3 relative group hover:border-zinc-500 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs font-bold font-mono">1</span>
                    <Webhook className="w-4 h-4 text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-white text-sm">Webhook Trigger</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Menerima POST request <code className="text-blue-300 font-mono">/catat-keuangan</code> dari Frontend.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#27272a] text-[10px] text-blue-400 font-mono">
                  Method: POST
                </div>
              </div>

              {/* Node 2 */}
              <div className="rounded-2xl border border-[#27272a] bg-[#121214] p-4 flex flex-col justify-between space-y-3 relative group hover:border-zinc-500 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center text-xs font-bold font-mono">2</span>
                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-white text-sm">Gemini AI Node</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Mengekstrak teks bebas menjadi JSON Array terstruktur dengan System Prompt presisi.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#27272a] text-[10px] text-purple-400 font-mono">
                  Model: Gemini 1.5 Flash
                </div>
              </div>

              {/* Node 3 */}
              <div className="rounded-2xl border border-[#27272a] bg-[#121214] p-4 flex flex-col justify-between space-y-3 relative group hover:border-zinc-500 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs font-bold font-mono">3</span>
                    <Code2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="font-semibold text-white text-sm">Code Parser</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Memvalidasi data JSON, normalisasi tanggal & sanitasi integer nominal.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#27272a] text-[10px] text-amber-400 font-mono">
                  Type: JavaScript Code
                </div>
              </div>

              {/* Node 4 */}
              <div className="rounded-2xl border border-[#27272a] bg-[#121214] p-4 flex flex-col justify-between space-y-3 relative group hover:border-zinc-500 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-bold font-mono">4</span>
                    <Table className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="font-semibold text-white text-sm">Google Sheets</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Operasi <em>Append Row</em> setiap transaksi ke kolom Tanggal, Kategori, Deskripsi, Jumlah.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#27272a] text-[10px] text-emerald-400 font-mono">
                  Auth: Service Account
                </div>
              </div>

              {/* Node 5 */}
              <div className="rounded-2xl border border-[#27272a] bg-[#121214] p-4 flex flex-col justify-between space-y-3 relative group hover:border-zinc-500 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center text-xs font-bold font-mono">5</span>
                    <Send className="w-4 h-4 text-rose-400" />
                  </div>
                  <h4 className="font-semibold text-white text-sm">Respond Webhook</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Mengembalikan JSON summary status ke Frontend beserta metadata hasil pencatatan.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#27272a] text-[10px] text-rose-400 font-mono">
                  Status: 200 OK + CORS
                </div>
              </div>
            </div>

            {/* How to import guide */}
            <div className="rounded-2xl border border-[#27272a] bg-[#121214] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Cara Import ke n8n Canvas:</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    1. Klik tombol <strong>Salin Workflow JSON</strong> di atas.<br />
                    2. Buka dashboard n8n (<code className="text-emerald-400 font-mono">http://localhost:5678</code>), buat workflow baru.<br />
                    3. Tekan <kbd className="px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-200 text-[10px] font-mono">Ctrl + V</kbd> (atau <kbd className="px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-200 text-[10px] font-mono">Cmd + V</kbd> di Mac) langsung di atas kanvas n8n.
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleCopyWorkflow}
                variant="outline"
                size="sm"
                className="shrink-0 text-xs gap-1.5 border-[#27272a] bg-[#18181b] text-zinc-300 hover:text-white"
              >
                <FileJson className="w-3.5 h-3.5" />
                Copy Full JSON
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: JSON EXPORT */}
          <TabsContent value="json" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                File JSON lengkap n8n siap pakai (kompatibel dengan n8n v1.x+):
              </p>
            </div>
            <CodeBlock code={jsonWorkflowString} language="json" filename="n8n-expense-tracker-workflow.json" />
          </TabsContent>

          {/* TAB 3: PROMPTS & CODE */}
          <TabsContent value="code" className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">A</span>
                <h4 className="font-semibold text-sm text-white">System Prompt Gemini AI (Node 2)</h4>
              </div>
              <CodeBlock code={GEMINI_SYSTEM_PROMPT} language="text" filename="Gemini AI System Instructions" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">B</span>
                <h4 className="font-semibold text-sm text-white">JavaScript Code (Node 3: Parser & Validator)</h4>
              </div>
              <CodeBlock code={N8N_CODE_NODE_SCRIPT} language="javascript" filename="n8n-code-node.js" />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
