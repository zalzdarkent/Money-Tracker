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
 * Parses Google Visualization API (gviz) JSON response or CSV text into structured ExpenseItems.
 */
export async function fetchGoogleSheetsData(
  spreadsheetId: string,
  sheetName: string = "Sheet1"
): Promise<{ success: boolean; data: GoogleSheetsRecord[]; error?: string }> {
  if (!spreadsheetId || spreadsheetId.includes("MASUKKAN_ID")) {
    return {
      success: false,
      data: [],
      error: "Spreadsheet ID belum dikonfigurasi di .env atau settings.",
    };
  }

  // Strategy 1: Google Visualization API (gviz)
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
      spreadsheetId
    )}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

    const response = await fetch(gvizUrl);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Google Sheets berstatus privat. Di Google Sheets, klik 'Bagikan' (Share) -> ubah 'Akses umum' menjadi 'Siapa saja yang memiliki link dapat melihat' (Viewer)."
        );
      }
      throw new Error(`Google Sheets merespon status ${response.status} (${response.statusText})`);
    }

    const rawText = await response.text();
    // gviz returns: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
    const jsonMatch = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
    
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      const table = parsed.table;
      
      if (!table || !table.rows) {
        return { success: true, data: [] };
      }

      // Find column indices
      const cols = (table.cols || []).map((c: any) => (c?.label || "").toLowerCase().trim());
      
      let dateIdx = cols.findIndex((l: string) => l.includes("tanggal") || l.includes("date"));
      let catIdx = cols.findIndex((l: string) => l.includes("kategori") || l.includes("category"));
      let descIdx = cols.findIndex((l: string) => l.includes("deskripsi") || l.includes("description") || l.includes("item") || l.includes("keterangan"));
      let amountIdx = cols.findIndex((l: string) => l.includes("jumlah") || l.includes("nominal") || l.includes("amount") || l.includes("rp") || l.includes("total"));

      // Fallback column positions if labels are empty
      if (dateIdx === -1) dateIdx = 0;
      if (catIdx === -1) catIdx = 1;
      if (descIdx === -1) descIdx = 2;
      if (amountIdx === -1) amountIdx = 3;

      const records: GoogleSheetsRecord[] = [];
      const todayStr = new Date().toISOString().split("T")[0];

      table.rows.forEach((rowObj: any, index: number) => {
        const cells = rowObj.c || [];
        
        const getCellValue = (idx: number) => {
          if (!cells[idx]) return "";
          return cells[idx].f || cells[idx].v || "";
        };

        const rawDate = getCellValue(dateIdx);
        const rawCat = getCellValue(catIdx);
        const rawDesc = getCellValue(descIdx);
        const rawAmount = getCellValue(amountIdx);

        // Parse date string
        let formattedDate = todayStr;
        if (rawDate) {
          if (typeof rawDate === "string" && rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = rawDate;
          } else if (typeof rawDate === "string" && rawDate.includes("Date(")) {
            const match = rawDate.match(/Date\((\d+),(\d+),(\d+)\)/);
            if (match) {
              const year = match[1];
              const month = String(Number(match[2]) + 1).padStart(2, "0");
              const day = String(match[3]).padStart(2, "0");
              formattedDate = `${year}-${month}-${day}`;
            }
          } else {
            const parsedD = new Date(rawDate);
            if (!isNaN(parsedD.getTime())) {
              formattedDate = parsedD.toISOString().split("T")[0];
            }
          }
        }

        // Parse amount
        let nominal = 0;
        if (typeof rawAmount === "number") {
          nominal = Math.round(rawAmount);
        } else {
          const numStr = String(rawAmount || "").replace(/[^\d.-]/g, "");
          nominal = Math.round(parseFloat(numStr) || 0);
        }

        const desc = String(rawDesc || "").trim();
        const cat = String(rawCat || "Lain-lain").trim();

        // Only include non-empty rows
        if (desc || nominal > 0) {
          records.push({
            id: `row-${index + 1}`,
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
        data: records.reverse(), // latest first
      };
    }

    throw new Error("Format respon Google Sheets tidak sesuai.");
  } catch (err: any) {
    console.warn("Gagal fetch via gviz API:", err);
    return {
      success: false,
      data: [],
      error: err.message || "Gagal mengambil data dari Google Sheets.",
    };
  }
}

/**
 * Filter records by date presets, with maximum date locked to TODAY (cannot view future/tomorrow).
 */
export function filterRecordsByDate(
  records: GoogleSheetsRecord[],
  filterType: "today" | "yesterday" | "last7days" | "thismonth" | "custom" | "all",
  customDate?: string
): GoogleSheetsRecord[] {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 7 Days ago
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  // Current Year & Month (YYYY-MM)
  const currentMonthStr = todayStr.slice(0, 7);

  return records.filter((rec) => {
    const recDate = rec.tanggal;

    // Safety check: Never allow dates strictly after today
    if (recDate > todayStr) {
      return false;
    }

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
        // Strict guard: if user inputs a future date, block it
        if (customDate > todayStr) return false;
        return recDate === customDate;
      case "all":
      default:
        return recDate <= todayStr;
    }
  });
}

/**
 * Calculate financial analytics for a set of records.
 */
export function calculateAnalytics(records: GoogleSheetsRecord[]): SheetsAnalytics {
  const totalSpent = records.reduce((acc, curr) => acc + curr.jumlah, 0);
  const transactionCount = records.length;
  const averagePerTransaction = transactionCount > 0 ? Math.round(totalSpent / transactionCount) : 0;

  const categoryBreakdown: { [cat: string]: number } = {};
  for (const item of records) {
    const cat = item.kategori || "Lain-lain";
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + item.jumlah;
  }

  return {
    totalSpent,
    transactionCount,
    averagePerTransaction,
    categoryBreakdown,
    items: records,
  };
}
