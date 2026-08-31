import { ExpenseItem } from "@/src/types";

/**
 * Client/Offline parser fallback that extracts Indonesian expense text
 * into structured JSON items, mirroring what the n8n Gemini Node produces.
 */
export function parseExpenseTextLocally(text: string): ExpenseItem[] {
  const today = new Date().toISOString().split("T")[0];
  const items: ExpenseItem[] = [];

  // Split by commas, newlines, "dan", "lalu", "+"
  const parts = text.split(/[,;\n+]|\s+dan\s+|\s+lalu\s+/i);

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part || part.length < 3) continue;

    // Extract amount
    let amount = 0;
    const amountRegex = /(\d+([.,]\d+)?)\s*(rb|ribu|k|jt|juta|perak|rp)?/i;
    const match = part.match(amountRegex);

    if (match) {
      const numStr = match[1].replace(",", ".");
      const unit = (match[3] || "").toLowerCase();
      let num = parseFloat(numStr);

      if (unit === "rb" || unit === "ribu" || unit === "k") {
        amount = Math.round(num * 1000);
      } else if (unit === "jt" || unit === "juta") {
        amount = Math.round(num * 1000000);
      } else {
        if (num < 1000 && (part.toLowerCase().includes("ribu") || part.toLowerCase().includes("k"))) {
          amount = Math.round(num * 1000);
        } else {
          amount = Math.round(num);
        }
      }
    }

    if (amount === 0) {
      // Fallback number search
      const digitsOnly = part.replace(/[^0-9]/g, "");
      if (digitsOnly) {
        const rawNum = parseInt(digitsOnly, 10);
        if (rawNum < 500) {
          amount = rawNum * 1000;
        } else {
          amount = rawNum;
        }
      }
    }

    if (amount <= 0) continue;

    // Clean description by removing the amount part
    let deskripsi = part
      .replace(amountRegex, "")
      .replace(/beli|bayar|isi|pesan|buat|untuk|ke|rp|idr/gi, "")
      .replace(/[^\w\s-]/g, "")
      .trim();

    if (!deskripsi) {
      deskripsi = part.trim();
    }
    // Capitalize first letter
    deskripsi = deskripsi.charAt(0).toUpperCase() + deskripsi.slice(1);

    // Determine category
    const lower = part.toLowerCase();
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
      lower.includes("lele") ||
      lower.includes("resto") ||
      lower.includes("ayam") ||
      lower.includes("mie") ||
      lower.includes("bakso")
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
      tanggal: today,
      kategori,
      deskripsi,
      jumlah: amount,
    });
  }

  return items;
}
