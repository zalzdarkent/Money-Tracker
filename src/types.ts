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

export interface ReceiptItem {
  deskripsi: string;
  kategori: string;
  jumlah: number;
  qty?: number;
}

export interface ReceiptScanResult {
  merchantName: string;
  date: string;
  totalAmount: number;
  items: ReceiptItem[];
  tax?: number;
  discount?: number;
  summaryText?: string;
  note?: string;
}

export interface ExpenseRecord {
  id: string;
  rawInput: string;
  items: ExpenseItem[];
  totalAmount: number;
  createdAt: string;
  source: "google_sheets_gas" | "n8n_webhook" | "gemini_direct" | "mock_simulation" | "receipt_scan" | "photo_scan";
  status: "success" | "failed";
  receiptImage?: string; // Base64 thumbnail if available
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
