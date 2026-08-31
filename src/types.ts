export interface ExpenseItem {
  tanggal: string; // Format: YYYY-MM-DD
  kategori: string; // Makanan, Transportasi, Belanja, Tagihan, Hiburan, dll.
  deskripsi: string;
  jumlah: number; // Integer IDR
}

export interface WebhookPayload {
  message: string;
}

export interface WebhookResponse {
  status: "success" | "error";
  total_items?: number;
  total_nominal?: number;
  message?: string;
  data?: ExpenseItem[];
  error?: string;
  timestamp?: string;
}

export interface ExpenseRecord {
  id: string;
  rawInput: string;
  items: ExpenseItem[];
  totalAmount: number;
  createdAt: string;
  source: "n8n_webhook" | "gemini_direct" | "mock_simulation";
  status: "success" | "failed";
}

export interface N8nNodeConfig {
  id: string;
  name: string;
  type: string;
  role: string;
  description: string;
  configSummary: string;
  codeSnippet?: string;
}
