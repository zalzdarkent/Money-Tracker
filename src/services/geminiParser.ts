import { ExpenseItem } from "@/src/types";

/**
 * Helper to format a Date into YYYY-MM-DD
 */
function formatDateIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Client/Offline parser fallback that extracts Indonesian expense text
 * into structured JSON items, mirroring what the n8n Gemini Node produces.
 */
export function parseExpenseTextLocally(text: string, baseDate: Date = new Date()): ExpenseItem[] {
  const todayStr = formatDateIso(baseDate);
  const items: ExpenseItem[] = [];

  // Split by commas, newlines, "dan", "lalu", "+", "sama"
  const parts = text.split(/[,;\n+]|\s+dan\s+|\s+lalu\s+|\s+sama\s+/i);

  let currentContextDate = todayStr;

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part || part.length < 3) continue;

    const lower = part.toLowerCase();

    // Determine date context for this part
    let itemDate = currentContextDate;
    if (lower.includes("kemarin lusa") || lower.includes("2 hari lalu") || lower.includes("lusa kemarin")) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - 2);
      itemDate = formatDateIso(d);
      currentContextDate = itemDate;
    } else if (lower.includes("kemarin") || lower.includes("kmrn")) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - 1);
      itemDate = formatDateIso(d);
      currentContextDate = itemDate;
    } else if (lower.includes("tadi") || lower.includes("hari ini") || lower.includes("barusan")) {
      itemDate = todayStr;
      currentContextDate = itemDate;
    }

    const qtyRegex = /\b(\d+)\s*(bungkus|bgks|bks|porsi|pcs|buah|biji|butir|cup|gelas|piring|pack|paket|kotak|botol|kaleng|lembar|potong|item|pasang|kg|kilo|liter|ltr)\b/gi;
    
    // Find price match with explicit price unit first (e.g. 40rb, 40 ribu, 40k, 1.5jt, Rp 40.000)
    const priceWithUnitRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta|perak|rp)\b/i;
    let priceMatch = part.match(priceWithUnitRegex);
    
    let amount = 0;
    let priceMatchedStr = "";

    if (priceMatch) {
      const numStr = priceMatch[1].replace(",", ".");
      const unit = (priceMatch[2] || "").toLowerCase();
      let num = parseFloat(numStr);

      if (unit === "rb" || unit === "ribu" || unit === "k") {
        amount = Math.round(num * 1000);
      } else if (unit === "jt" || unit === "juta") {
        amount = Math.round(num * 1000000);
      } else {
        amount = Math.round(num);
      }
      priceMatchedStr = priceMatch[0];
    } else {
      // If no explicit price unit, remove quantity patterns first to avoid capturing quantity as price
      const withoutQty = part.replace(qtyRegex, "");
      const numberRegex = /(\d+([.,]\d+)?)/g;
      const allNumbers = [...withoutQty.matchAll(numberRegex)];
      if (allNumbers.length > 0) {
        // Pick the last number
        const lastNumMatch = allNumbers[allNumbers.length - 1];
        const rawNum = parseInt(lastNumMatch[1].replace(/[^0-9]/g, ""), 10);
        if (rawNum > 0) {
          if (rawNum < 500 && (lower.includes("ribu") || lower.includes("k") || lower.includes("rb"))) {
            amount = rawNum * 1000;
          } else {
            amount = rawNum;
          }
          priceMatchedStr = lastNumMatch[0];
        }
      }
    }

    if (amount <= 0) continue;

    // Clean description by removing the amount and auxiliary words
    let deskripsi = part;
    if (priceMatchedStr) {
      deskripsi = deskripsi.replace(priceMatchedStr, "");
    }
    deskripsi = deskripsi
      .replace(/\b(kemarin lusa|2 hari lalu|kemarin|kmrn|tadi|hari ini|barusan|beli|bayar|isi|pesan|buat|untuk|ke|rp|idr|sama)\b/gi, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!deskripsi) {
      deskripsi = part.trim();
    }
    // Capitalize first letter
    deskripsi = deskripsi.charAt(0).toUpperCase() + deskripsi.slice(1);

    // Determine category
    let kategori = "Lain-lain";

    if (
      lower.includes("kopi") ||
      lower.includes("makan") ||
      lower.includes("minum") ||
      lower.includes("sarapan") ||
      lower.includes("warteg") ||
      lower.includes("nasi") ||
      lower.includes("snack") ||
      lower.includes("gorengan") ||
      lower.includes("lontong") ||
      lower.includes("risol") ||
      lower.includes("roti") ||
      lower.includes("roti bakar") ||
      lower.includes("lele") ||
      lower.includes("resto") ||
      lower.includes("ayam") ||
      lower.includes("mie") ||
      lower.includes("bakso") ||
      lower.includes("sate") ||
      lower.includes("martabak")
    ) {
      kategori = "Makanan & Minuman";
    } else if (
      lower.includes("bensin") ||
      lower.includes("pertalite") ||
      lower.includes("pertamax") ||
      lower.includes("gojek") ||
      lower.includes("grab") ||
      lower.includes("parkir") ||
      lower.includes("tol") ||
      lower.includes("angkot") ||
      lower.includes("kereta") ||
      lower.includes("busway") ||
      lower.includes("oli") ||
      lower.includes("service")
    ) {
      kategori = "Transportasi";
    } else if (
      lower.includes("belanja") ||
      lower.includes("supermarket") ||
      lower.includes("indomaret") ||
      lower.includes("alfamart") ||
      lower.includes("sabun") ||
      lower.includes("galon") ||
      lower.includes("aqua") ||
      lower.includes("beras") ||
      lower.includes("minyak")
    ) {
      kategori = "Belanja Kebutuhan";
    } else if (
      lower.includes("listrik") ||
      lower.includes("pln") ||
      lower.includes("token") ||
      lower.includes("pulsa") ||
      lower.includes("kuota") ||
      lower.includes("wifi") ||
      lower.includes("internet") ||
      lower.includes("indihome") ||
      lower.includes("pdam") ||
      lower.includes("kontrakan") ||
      lower.includes("kost")
    ) {
      kategori = "Tagihan & Utilitas";
    } else if (
      lower.includes("obat") ||
      lower.includes("apotek") ||
      lower.includes("vitamin") ||
      lower.includes("dokter") ||
      lower.includes("klinik") ||
      lower.includes("masker")
    ) {
      kategori = "Kesehatan";
    } else if (
      lower.includes("bioskop") ||
      lower.includes("nonton") ||
      lower.includes("game") ||
      lower.includes("topup") ||
      lower.includes("steam") ||
      lower.includes("spotify") ||
      lower.includes("netflix")
    ) {
      kategori = "Hiburan & Gaya Hidup";
    }

    items.push({
      tanggal: itemDate,
      kategori,
      deskripsi,
      jumlah: amount,
    });
  }

  return items;
}
