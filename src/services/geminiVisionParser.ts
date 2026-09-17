import { ExpenseItem } from "@/src/types";
import { getLocalDateString } from "@/src/services/googleSheetsService";
import { callGeminiProxy } from "@/src/services/geminiProxy";

// ----------------------------------------------------------------
// Gemini Vision Parser
// Reads a receipt/nota photo and extracts expense items using
// Gemini 1.5 Flash multimodal API (supports image + text prompt).
// ----------------------------------------------------------------

const CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja Kebutuhan",
  "Tagihan & Utilitas",
  "Hiburan & Gaya Hidup",
  "Kesehatan",
  "Pendidikan & Kerja",
  "Lain-lain",
];

/**
 * Converts a File or Blob to a base64 string (data URI stripped).
 */
async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result = "data:image/jpeg;base64,XXXXXX"
      const [header, base64] = result.split(",");
      const mimeType = header.replace("data:", "").replace(";base64", "");
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Build the Gemini Vision request payload.
 */
function buildRequestPayload(base64: string, mimeType: string, todayDate: string) {
  const systemText = `Anda adalah asisten AI akuntansi pribadi yang bertugas mengekstrak data transaksi dari foto struk/nota/bon belanja.

ATURAN:
1. Ekstrak SEMUA item pengeluaran yang terlihat di foto.
2. Format tanggal WAJIB: YYYY-MM-DD. Jika tidak ada tanggal di foto, gunakan tanggal referensi HARI INI: ${todayDate}.
3. Nominal adalah angka bulat (integer) dalam Rupiah. Jika ada simbol Rp., hapus dan ambil angkanya saja.
4. Kategori yang diperbolehkan: ${CATEGORIES.join(", ")}.
5. Output WAJIB berupa JSON Array of Objects dengan keys persis: tanggal, kategori, deskripsi, jumlah.
6. Jangan tambahkan teks lain di luar JSON array.
7. Jika ada total di struk, JANGAN masukkan baris "Total" sebagai item — hanya item individual.

Contoh output:
[
  {"tanggal":"${todayDate}","kategori":"Makanan & Minuman","deskripsi":"Nasi Goreng","jumlah":25000},
  {"tanggal":"${todayDate}","kategori":"Makanan & Minuman","deskripsi":"Es Teh Manis","jumlah":8000}
]`;

  return {
    contents: [
      {
        parts: [
          {
            text: `${systemText}\n\nEkstrak semua item pengeluaran dari foto struk/nota berikut:`,
          },
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };
}

/**
 * Sanitize and extract JSON array from raw Gemini text output.
 */
function extractJsonFromText(text: string): ExpenseItem[] {
  // Remove markdown code blocks
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```/g, "")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return [parsed];
  } catch {}

  // Try extracting [...] bracket
  const arrStart = cleaned.indexOf("[");
  const arrEnd = cleaned.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd > arrStart) {
    try {
      const parsed = JSON.parse(cleaned.slice(arrStart, arrEnd + 1));
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  throw new Error(
    "Tidak bisa membaca format output dari Gemini. Pastikan foto struk cukup jelas dan terlihat."
  );
}

/**
 * Normalize and validate raw items from Gemini output.
 */
function normalizeItems(rawItems: any[], todayDate: string): ExpenseItem[] {
  return rawItems
    .map((raw) => {
      const item = raw?.json || raw || {};

      // Nominal / jumlah
      let rawNominal =
        item.jumlah ?? item.nominal ?? item.amount ?? item.total ??
        item.harga ?? item.price ?? item.cost ?? item.value;
      if (rawNominal == null) {
        const k = Object.keys(item).find((k) =>
          /jumlah|nominal|amount|total|harga|price|cost/i.test(k)
        );
        if (k) rawNominal = item[k];
      }
      const rawStr = typeof rawNominal === "string"
        ? rawNominal.replace(/[^\d.-]/g, "")
        : String(rawNominal ?? "0");
      const jumlah = Math.round(parseFloat(rawStr) || 0);

      // Description
      let deskripsi =
        item.deskripsi || item.description || item.item || item.nama ||
        item.name || item.title || "";
      if (!deskripsi) {
        const k = Object.keys(item).find((k) =>
          /deskripsi|desc|nama|name|item|title/i.test(k)
        );
        if (k) deskripsi = item[k];
      }
      deskripsi = String(deskripsi).trim();
      if (deskripsi) {
        deskripsi = deskripsi.charAt(0).toUpperCase() + deskripsi.slice(1);
      }

      // Category
      let kategori = item.kategori || item.category || "";
      if (!kategori || !CATEGORIES.includes(kategori)) {
        kategori = "Lain-lain";
      }

      // Date
      let tanggal = item.tanggal || item.date || item.tgl || todayDate;
      if (typeof tanggal === "string") {
        tanggal = tanggal.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
          tanggal = todayDate;
        }
      } else {
        tanggal = todayDate;
      }

      return { tanggal, kategori, deskripsi, jumlah };
    })
    .filter(
      (it) =>
        it.jumlah > 0 &&
        it.deskripsi &&
        !it.deskripsi.toLowerCase().includes("total") &&
        !it.deskripsi.toLowerCase().includes("subtotal") &&
        !it.deskripsi.toLowerCase().includes("grand total")
    );
}

/**
 * Main entry point: parse expense items from an image file using Gemini Vision.
 */
export async function parseExpenseFromImage(imageFile: File): Promise<{
  items: ExpenseItem[];
  rawText: string;
  imagePreviewUrl: string;
}> {
  const todayDate = getLocalDateString();

  // Create object URL for preview
  const imagePreviewUrl = URL.createObjectURL(imageFile);

  // Convert image to base64
  const { base64, mimeType } = await fileToBase64(imageFile);

  // Build and send request to Gemini Vision API
  const payload = buildRequestPayload(base64, mimeType, todayDate);

  // Extract text from Gemini response
  const rawText = await callGeminiProxy({ model: "gemini-3.6-flash", ...payload });

  if (!rawText.trim()) {
    throw new Error(
      "Gemini tidak menghasilkan output teks. Pastikan foto cukup terang dan struk terlihat jelas."
    );
  }

  // Parse and normalize items
  const rawItems = extractJsonFromText(rawText);
  const items = normalizeItems(rawItems, todayDate);

  if (items.length === 0) {
    throw new Error(
      "Tidak ada item pengeluaran yang berhasil diekstrak dari foto. Pastikan foto struk jelas dan nominal terlihat."
    );
  }

  return { items, rawText, imagePreviewUrl };
}
