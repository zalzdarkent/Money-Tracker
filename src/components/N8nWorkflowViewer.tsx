import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { CodeBlock } from "@/src/components/ui/code-block";
import { Button } from "@/src/components/ui/button";
import { N8N_WORKFLOW_JSON, GEMINI_SYSTEM_PROMPT, N8N_CODE_NODE_SCRIPT } from "@/src/data/n8nWorkflow";
import { Webhook, BrainCircuit, Code2, Table, Send, Copy, Check, Download } from "lucide-react";

export function N8nWorkflowViewer() {
  const [copied, setCopied] = useState(false);
  const jsonStr = JSON.stringify(N8N_WORKFLOW_JSON, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "n8n-workflow.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-[#27272a] bg-[#18181b] rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-[#27272a] bg-[#121214] pb-5">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex gap-2 mb-1">
              <Badge variant="outline" className="text-xs border-[#27272a]">n8n</Badge>
              <span className="text-xs text-zinc-500 font-mono">5 Nodes</span>
            </div>
            <CardTitle className="text-lg font-semibold text-white">Workflow n8n</CardTitle>
            <CardDescription className="text-xs text-zinc-400">Webhook → Gemini → Parser → Sheets → Response</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline" size="sm" className="text-xs gap-2 border-[#27272a] bg-[#121214]">
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button onClick={handleCopy} size="sm" className="text-xs gap-2 bg-emerald-500 text-black font-bold">
              {copied ? <><Check className="w-4 h-4" /> Disalin</> : <><Copy className="w-4 h-4" /> Salin JSON</>}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <Tabs defaultValue="visual">
          <TabsList className="grid grid-cols-3 max-w-sm mb-6 bg-[#121214] border border-[#27272a]">
            <TabsTrigger value="visual" className="text-xs">Visual</TabsTrigger>
            <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
            <TabsTrigger value="code" className="text-xs">Kode</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { n: "1", title: "Webhook", desc: "Terima POST /catat-keuangan", icon: Webhook, color: "text-blue-400" },
                { n: "2", title: "Gemini AI", desc: "Ekstrak teks ke JSON", icon: BrainCircuit, color: "text-purple-400" },
                { n: "3", title: "Code", desc: "Validasi & normalisasi", icon: Code2, color: "text-amber-400" },
                { n: "4", title: "Sheets", desc: "Append ke Sheet", icon: Table, color: "text-emerald-400" },
                { n: "5", title: "Response", desc: "Balas JSON ke client", icon: Send, color: "text-rose-400" },
              ].map((node) => (
                <div key={node.n} className="rounded-2xl border border-[#27272a] bg-[#121214] p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded">{node.n}</span><node.icon className={`w-4 h-4 ${node.color}`} /></div>
                  <h4 className="font-semibold text-white text-sm">{node.title}</h4>
                  <p className="text-xs text-zinc-400">{node.desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4 text-xs text-zinc-400">
              Salin JSON → buka n8n di localhost:5678 → buat workflow baru → paste (Ctrl+V) di canvas.
            </div>
          </TabsContent>

          <TabsContent value="json">
            <CodeBlock code={jsonStr} language="json" filename="n8n-workflow.json" />
          </TabsContent>

          <TabsContent value="code" className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Prompt Gemini</h4>
              <CodeBlock code={GEMINI_SYSTEM_PROMPT} language="text" filename="prompt.txt" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Parser JS</h4>
              <CodeBlock code={N8N_CODE_NODE_SCRIPT} language="javascript" filename="parser.js" />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
