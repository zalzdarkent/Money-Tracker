import { ExpenseItem, ReceiptScanResult } from "@/src/types";
import { parseExpenseTextLocally } from "./geminiParser";

/**
 * Helper to get current stored Gemini API key
 */
export function getGeminiApiKey(): string {
  if (typeof window !== "undefined") {
    const customKey = localStorage.getItem("aether_gemini_api_key");
    if (customKey && customKey.trim()) {
      return customKey.trim();
    }
  }
  return (
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.GEMINI_API_KEY ||
    ""
  );
}

/**
 * Helper to get current Gemini Model (default: gemini-1.5-flash or gemini-2.0-flash)
 */
export function getGeminiModel(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("aether_gemini_model");
    if (custom && custom.trim()) {
      return custom.trim();
    }
  }
  return (
    (import.meta as any).env?.VITE_GEMINI_MODEL ||
    "gemini-1.5-flash"
  );
}

/**
 * Save user custom Gemini Model into localStorage
 */
export function setGeminiModel(model: string): void {
  if (typeof window !== "undefined") {
    if (model.trim()) {
      localStorage.setItem("aether_gemini_model", model.trim());
    } else {
      localStorage.removeItem("aether_gemini_model");
    }
  }
}

/**
 * Save user custom API key into localStorage
 */
export function setGeminiApiKey(key: string): void {
  if (typeof window !== "undefined") {
    if (key.trim()) {
      localStorage.setItem("aether_gemini_api_key", key.trim());
    } else {
      localStorage.removeItem("aether_gemini_api_key");
    }
  }
}

/**
 * Clean Base64 string by removing data URL prefix
 */
export function cleanBase64(dataUriOrBase64: string): { base64: string; mimeType: string } {
  let mimeType = "image/jpeg";
  let base64 = dataUriOrBase64;

  const match = dataUriOrBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (match) {
    mimeType = match[1];
    base64 = match[2];
  }
  return { base64, mimeType };
}

/**
 * Helper to get today's local date string (YYYY-MM-DD)
 */
function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse JSON string returned from Gemini safely
 */
function safeJsonParse<T>(rawText: string, fallback: T): T {
  try {
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```javascript/gi, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    const arrayMatch = rawText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]) as T;
      } catch {}
    }
    const objMatch = rawText.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]) as T;
      } catch {}
    }
    return fallback;
  }
}

/**
 * Call Gemini REST API directly using standard browser fetch.
 * Zero external SDK, zero server overhead.
 */
async function callGeminiApi(
  model: string,
  apiKey: string,
  parts: any[]
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}

/**
 * Scans a receipt / invoice / shopping bill image using Gemini Vision Flash
 */
export async function scanReceiptWithGemini(
  imageDataUrlOrBase64: string
): Promise<ReceiptScanResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API Key belum dikonfigurasi. Masukkan API Key di pengaturan atau di file .env."
    );
  }

  const { base64, mimeType } = cleanBase64(imageDataUrlOrBase64);
  const todayStr = getTodayIso();

  const prompt = `Anda adalah asisten AI akuntansi profesional yang sangat teliti dalam membaca struk belanja, nota, bon, dan invoice pembayaran di Indonesia (Indomaret, Alfamart, Superindo, restoran, cafe, SPBU, tiket parkir, toko kelontong, dsb).
Analisis gambar struk ini dan ekstrak informasinya secara presisi dalam format JSON:

Petunjuk Khusus:
1. merchantName: Nama toko / tempat belanja (contoh: "Indomaret", "Alfamart", "Starbucks", "SPBU Pertamina"). Jika tidak ada nama toko, gunakan "Toko / Merchant".
2. date: Tanggal transaksi dalam format YYYY-MM-DD. Tanggal referensi hari ini adalah ${todayStr}. Jika tahun pada struk tidak terbaca jelas, gunakan tahun sekarang (${new Date().getFullYear()}).
3. totalAmount: Grand Total / Jumlah Total Akhir yang harus dibayar (angka bulat murni dalam Rupiah).
4. items: Array dari setiap item/barang belanjaan yang ada di struk:
   - deskripsi: Nama item/barang yang bersih dan mudah dibaca
   - kategori: Pilih SATU kategori paling cocok dari:
     ["Makanan & Minuman", "Transportasi", "Belanja Kebutuhan", "Tagihan & Utilitas", "Kesehatan", "Hiburan & Gaya Hidup", "Pendidikan & Kerja", "Lain-lain"]
   - jumlah: Total harga untuk item tersebut (harga setelah diskon item jika ada, integer bulat)
   - qty: Kuantitas barang (integer, default 1)
5. summaryText: Rangkuman singkat 1 baris untuk mode ringkas, contoh: "Belanja Indomaret (Minyak Goreng, Susu, Roti)"
6. tax: Nominal PPN/PB1 jika tertera
7. discount: Nominal total diskon/hemat jika tertera
8. note: Catatan singkat jika ada info penting (misal: metode bayar QRIS / Tunai).

Harap kembalikan HANYA format JSON valid tanpa format markdown lain.`;

  const selectedModel = getGeminiModel();
  const preferredModels = Array.from(
    new Set([selectedModel, "gemini-1.5-flash", "gemini-2.0-flash"])
  );

  let lastError: any = null;

  for (const model of preferredModels) {
    try {
      const parts = [
        {
          inlineData: {
            mimeType,
            data: base64,
          },
        },
        { text: prompt },
      ];

      const text = await callGeminiApi(model, apiKey, parts);
      const parsed = safeJsonParse<any>(text, null);

      if (parsed && typeof parsed === "object") {
        const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
        const validatedItems = rawItems
          .map((it: any) => ({
            deskripsi: String(it.deskripsi || it.name || it.item || "Barang Belanjaan").trim(),
            kategori: String(it.kategori || it.category || "Belanja Kebutuhan").trim(),
            jumlah: Math.round(Number(it.jumlah || it.price || it.total) || 0),
            qty: Number(it.qty || it.quantity || 1) || 1,
          }))
          .filter((it: any) => it.jumlah > 0 && it.deskripsi);

        const totalNominal = Math.round(
          Number(parsed.totalAmount || parsed.total || parsed.grandTotal) ||
            validatedItems.reduce((acc: number, curr: any) => acc + curr.jumlah, 0)
        );

        return {
          merchantName: String(parsed.merchantName || "Struk Belanja").trim(),
          date: String(parsed.date || todayStr).slice(0, 10),
          totalAmount: totalNominal,
          items: validatedItems,
          tax: parsed.tax ? Number(parsed.tax) : undefined,
          discount: parsed.discount ? Number(parsed.discount) : undefined,
          summaryText:
            parsed.summaryText ||
            `Belanja di ${parsed.merchantName || "Struk"} (${validatedItems.length} item)`,
          note: parsed.note || undefined,
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Gagal memindai dengan model ${model}:`, err);
    }
  }

  throw new Error(
    lastError?.message ||
      "Gagal membaca struk belanja dengan Gemini. Pastikan gambar jelas dan Gemini API Key valid."
  );
}

/**
 * Super-fast direct text parsing using Gemini Flash in browser (~0.8 - 1.2 detik).
 * Automatically falls back to local regex parser if offline or error occurs.
 */
export async function parseExpenseTextWithGemini(
  text: string,
  baseDate: Date = new Date()
): Promise<ExpenseItem[]> {
  const apiKey = getGeminiApiKey();

  // If no API key, use local regex parser directly
  if (!apiKey) {
    return parseExpenseTextLocally(text, baseDate);
  }

  try {
    const todayStr = getTodayIso();
    const prompt = `Anda adalah asisten AI akuntansi pribadi.
Tanggal referensi HARI INI adalah: ${todayStr} (WIB).
Jika ada kata 'tadi' / 'hari ini', gunakan ${todayStr}.
Jika ada kata 'kemarin', gunakan 1 hari sebelum ${todayStr}.
Jika ada kata 'kemarin lusa' / '2 hari lalu', gunakan 2 hari sebelum ${todayStr}.

Ekstrak teks pengeluaran bebas bahasa Indonesia berikut menjadi JSON Array of Objects dengan key:
- tanggal: string format YYYY-MM-DD
- kategori: pilih salah satu dari ["Makanan & Minuman", "Transportasi", "Belanja Kebutuhan", "Tagihan & Utilitas", "Hiburan & Gaya Hidup", "Kesehatan", "Pendidikan & Kerja", "Lain-lain"]
- deskripsi: nama pengeluaran rapi
- jumlah: angka bulat integer dalam Rupiah

Teks pengguna:
"${text}"

Kembalikan HANYA array JSON valid.`;

    const model = getGeminiModel();
    const parts = [{ text: prompt }];

    const rawText = await callGeminiApi(model, apiKey, parts);
    const parsed = safeJsonParse<any[]>(rawText, []);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .map((item: any) => ({
          tanggal: String(item.tanggal || todayStr),
          kategori: String(item.kategori || "Lain-lain"),
          deskripsi: String(item.deskripsi || "Pengeluaran"),
          jumlah: Math.round(Number(item.jumlah) || 0),
        }))
        .filter((it) => it.jumlah > 0 && it.deskripsi);
    }

    return parseExpenseTextLocally(text, baseDate);
  } catch (err) {
    console.warn("Direct Gemini parsing gagal, beralih ke parser lokal:", err);
    return parseExpenseTextLocally(text, baseDate);
  }
}
