import { ExpenseItem } from "@/src/types";

export interface GoogleSheetsRecord extends ExpenseItem {
  id: string;
  rowIndex: number;
}

export interface SheetsAnalytics {
  totalSpent: number;
  transactionCount: number;
  averagePerTransaction: number;
  categoryBreakdown: { [category: string]: number };
  items: GoogleSheetsRecord[];
}

/**
 * Returns local date in YYYY-MM-DD format (avoids UTC timezone offset bugs).
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Helper to get Google Apps Script Web App URL from localStorage or environment
 */
export function getGoogleScriptUrl(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("aether_google_script_url");
    if (custom && custom.trim()) return custom.trim();
  }
  return (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL || "";
}

/**
 * Save Google Apps Script Web App URL into localStorage
 */
export function setGoogleScriptUrl(url: string): void {
  if (typeof window !== "undefined") {
    if (url.trim()) {
      localStorage.setItem("aether_google_script_url", url.trim());
    } else {
      localStorage.removeItem("aether_google_script_url");
    }
  }
}

/**
 * Directly append expense items to Google Sheets via Google Apps Script Web App (doPost).
 * Zero-server, no n8n required. Uses text/plain to prevent CORS preflight blocks.
 */
export async function appendExpensesToGoogleSheets(
  items: ExpenseItem[]
): Promise<{ success: boolean; error?: string }> {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) {
    return { success: false, error: "Google Apps Script Web App URL belum dikonfigurasi." };
  }

  try {
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(items),
    });
    return { success: true };
  } catch (err: any) {
    console.error("Gagal append ke Google Sheets via Apps Script:", err);
    return { success: false, error: err.message || "Gagal menghubungi Google Apps Script." };
  }
}

/**
 * Parses Google Visualization API (gviz) JSON response into structured ExpenseItems.
 * Works seamlessly with public "Viewer" access on Google Sheets with anti-cache headers.
 */
export async function fetchGoogleSheetsData(
  spreadsheetId: string,
  sheetName?: string
): Promise<{ success: boolean; data: GoogleSheetsRecord[]; error?: string }> {
  if (!spreadsheetId || spreadsheetId.includes("MASUKKAN_ID")) {
    return {
      success: false,
      data: [],
      error: "Spreadsheet ID belum dikonfigurasi di .env atau pengaturan.",
    };
  }

  // Clean spreadsheetId if full URL was pasted
  let cleanId = spreadsheetId.trim();
  const urlMatch = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    cleanId = urlMatch[1];
  }

  try {
    // Add timestamp cache-buster to always get latest data from Google Sheets
    const timestamp = Date.now();
    const baseGviz = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(cleanId)}/gviz/tq?tqx=out:json&t=${timestamp}`;
    const gvizUrl = sheetName && sheetName !== "Sheet1" 
      ? `${baseGviz}&sheet=${encodeURIComponent(sheetName)}` 
      : baseGviz;

    const response = await fetch(gvizUrl, {
      cache: "no-store",
      headers: {
        "Pragma": "no-cache",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Google Sheets berstatus privat. Di Google Sheets, klik tombol 'Bagikan' (Share) -> ubah 'Akses umum' menjadi 'Siapa saja yang memiliki link dapat melihat' (Viewer)."
        );
      }
      throw new Error(`Google Sheets merespon status ${response.status} (${response.statusText})`);
    }

    const rawText = await response.text();
    // gviz format: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
    const jsonMatch = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
    
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      const table = parsed.table;
      
      if (!table || !table.rows) {
        return { success: true, data: [] };
      }

      // Identify column indices by label names
      const cols = (table.cols || []).map((c: any) => (c?.label || "").toLowerCase().trim());
      
      let dateIdx = cols.findIndex((l: string) => l.includes("tanggal") || l.includes("date") || l.includes("tgl") || l.includes("waktu"));
      let catIdx = cols.findIndex((l: string) => l.includes("kategori") || l.includes("category") || l.includes("tipe") || l.includes("jenis"));
      let descIdx = cols.findIndex((l: string) => l.includes("deskripsi") || l.includes("description") || l.includes("item") || l.includes("keterangan") || l.includes("nama") || l.includes("pengeluaran"));
      let amountIdx = cols.findIndex((l: string) => l.includes("jumlah") || l.includes("nominal") || l.includes("amount") || l.includes("rp") || l.includes("total") || l.includes("harga"));

      // Fallback standard column positions [Tanggal, Kategori, Deskripsi, Jumlah]
      if (dateIdx === -1) dateIdx = 0;
      if (catIdx === -1) catIdx = 1;
      if (descIdx === -1) descIdx = 2;
      if (amountIdx === -1) amountIdx = 3;

      const records: GoogleSheetsRecord[] = [];
      const todayStr = getLocalDateString();

      table.rows.forEach((rowObj: any, index: number) => {
        const cells = rowObj.c || [];
        
        const getCellValue = (idx: number) => {
          if (!cells[idx]) return "";
          return cells[idx].f != null ? cells[idx].f : cells[idx].v != null ? cells[idx].v : "";
        };

        const rawDate = getCellValue(dateIdx);
        const rawCat = getCellValue(catIdx);
        const rawDesc = getCellValue(descIdx);
        const rawAmount = getCellValue(amountIdx);

        // 1. Parse date string
        let formattedDate = todayStr;
        if (rawDate != null && rawDate !== "") {
          const strDate = String(rawDate).trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(strDate)) {
            formattedDate = strDate;
          } else if (strDate.includes("Date(")) {
            const match = strDate.match(/Date\((\d+),(\d+),(\d+)/);
            if (match) {
              const year = match[1];
              const month = String(Number(match[2]) + 1).padStart(2, "0");
              const day = String(match[3]).padStart(2, "0");
              formattedDate = `${year}-${month}-${day}`;
            }
          } else {
            const parsedD = new Date(strDate);
            if (!isNaN(parsedD.getTime())) {
              formattedDate = getLocalDateString(parsedD);
            } else {
              formattedDate = strDate;
            }
          }
        }

        // 2. Parse nominal amount
        let nominal = 0;
        if (typeof rawAmount === "number") {
          nominal = Math.round(rawAmount);
        } else {
          const numStr = String(rawAmount || "").replace(/[^\d.-]/g, "");
          nominal = Math.round(parseFloat(numStr) || 0);
        }

        const desc = String(rawDesc || "").trim();
        const cat = String(rawCat || "Lain-lain").trim();

        // Include any valid row
        if (desc || nominal > 0) {
          records.push({
            id: `sheet-row-${index + 1}`,
            rowIndex: index + 2,
            tanggal: formattedDate,
            kategori: cat || "Lain-lain",
            deskripsi: desc || "Pengeluaran",
            jumlah: nominal,
          });
        }
      });

      return {
        success: true,
        data: records.reverse(), // latest appended row first
      };
    }

    throw new Error("Format respon Google Sheets tidak sesuai atau kosong.");
  } catch (err: any) {
    console.warn("Gagal fetch via Google Sheets gviz API:", err);
    return {
      success: false,
      data: [],
      error: err.message || "Gagal mengambil data dari Google Sheets.",
    };
  }
}

/**
 * Filter records by date presets using local date comparisons.
 */
export function filterRecordsByDate(
  records: GoogleSheetsRecord[],
  filterType: "today" | "yesterday" | "last7days" | "thismonth" | "custom" | "all",
  customDate?: string
): GoogleSheetsRecord[] {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  // 7 Days ago
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);

  // Current Year & Month (YYYY-MM)
  const currentMonthStr = todayStr.slice(0, 7);

  return records.filter((rec) => {
    const recDate = rec.tanggal;

    switch (filterType) {
      case "today":
        return recDate === todayStr;
      case "yesterday":
        return recDate === yesterdayStr;
      case "last7days":
        return recDate >= sevenDaysAgoStr && recDate <= todayStr;
      case "thismonth":
        return recDate.startsWith(currentMonthStr) && recDate <= todayStr;
      case "custom":
        if (!customDate) return true;
        return recDate === customDate;
      case "all":
      default:
        return true;
    }
  });
}

/**
 * Calculate financial analytics for a set of records.
 */
export function calculateAnalytics(records: GoogleSheetsRecord[]): SheetsAnalytics {
  const totalSpent = records.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const transactionCount = records.length;
  const averagePerTransaction = transactionCount > 0 ? Math.round(totalSpent / transactionCount) : 0;

  const categoryBreakdown: { [cat: string]: number } = {};
  for (const item of records) {
    const cat = item.kategori || "Lain-lain";
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (Number(item.jumlah) || 0);
  }

  return {
    totalSpent,
    transactionCount,
    averagePerTransaction,
    categoryBreakdown,
    items: records,
  };
}
