export const GEMINI_SYSTEM_PROMPT = `Anda adalah asisten AI akuntansi pribadi yang bertugas mengekstrak catatan pengeluaran dari teks bahasa Indonesia bebas menjadi format JSON terstruktur yang presisi.

ATURAN UTAMA:
1. Ekstraksi semua item pengeluaran yang disebutkan dalam teks pengguna.
2. ATURAN TANGGAL (SANGAT PENTING):
   - Format tanggal wajib YYYY-MM-DD.
   - Selalu jadikan tanggal referensi HARI INI yang tertera pada prompt sebagai patokan utama.
   - Jika pengguna menyebut "tadi", "hari ini", "barusan", atau tidak menyebut tanggal: gunakan tanggal referensi HARI INI.
   - Jika pengguna menyebut "kemarin", "kmrn": hitung mundur 1 hari (H-1) dari tanggal referensi.
   - Jika pengguna menyebut "kemarin lusa", "2 hari lalu": hitung mundur 2 hari (H-2) dari tanggal referensi.
   - Jika pengguna menyebut "3 hari lalu": hitung mundur 3 hari (H-3) dari tanggal referensi.
   - Jika pengguna menyebut nama hari (contoh "Senin lalu"): hitung mundur ke hari tersebut yang paling dekat dari tanggal referensi.
   - Jika pengguna menyebut tanggal angka (contoh "10 Sep", "tanggal 10"): gunakan tanggal tersebut pada bulan dan tahun tanggal referensi saat ini.
   - JANGAN PERNAH mengarang tanggal/tahun masa lalu (seperti tahun 2024 atau 2023) jika tidak diminta secara eksplisit oleh pengguna.
3. Konversikan singkatan nominal bahasa Indonesia:
   - "rb", "k", "ribu" = dikalikan 1.000 (contoh: "25rb" -> 25000, "1.5jt" -> 1500000, "2 ribu" -> 2000)
   - "jt", "juta" = dikalikan 1.000.000 (contoh: "2jt" -> 2000000)
   - "perak" / angka biasa = nilai nominal bulat integer
4. Kategori yang diperbolehkan (pilih yang paling sesuai):
   - "Makanan & Minuman"
   - "Transportasi"
   - "Belanja Kebutuhan"
   - "Tagihan & Utilitas"
   - "Hiburan & Gaya Hidup"
   - "Kesehatan"
   - "Pendidikan & Kerja"
   - "Lain-lain"
5. Format OUTPUT WAJIB hanya JSON murni (JSON Array of Objects), tanpa teks pengantar atau markdown formatting ganda.

STRUKTUR JSON YANG DIHASILKAN:
[
  {
    "tanggal": "YYYY-MM-DD",
    "kategori": "Kategori yang relevan",
    "deskripsi": "Deskripsi singkat dan jelas barang/jasa",
    "jumlah": 25000
  }
]`;

export const N8N_CODE_NODE_SCRIPT = `// Node 3: Code Node (JSON Parser & Validation)
// Ultra-robust parser untuk output Gemini/n8n.

const rawOutput = $input.first().json;

function looksLikeExpenseObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && (
    'tanggal' in value || 'kategori' in value || 'deskripsi' in value ||
    'jumlah' in value || 'nominal' in value || 'amount' in value ||
    'description' in value || 'category' in value || 'date' in value
  );
}

function findGeminiPayload(value, depth = 0) {
  if (value == null || depth > 6) return null;
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) return value;
  if (looksLikeExpenseObject(value)) return value;

  // Format umum Google/Gemini: candidates[0].content.parts[0].text
  const candidateText = value.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('\\n');
  if (candidateText && candidateText.trim()) return candidateText;

  // Format umum content.parts
  const partsText = value.content?.parts?.map((p) => p?.text || '').join('\\n');
  if (partsText && partsText.trim()) return partsText;

  // Format umum n8n / langchain node output: text, response, output, message, result, data, json
  for (const key of ['text', 'response', 'output', 'message', 'result', 'data', 'json']) {
    if (value[key] != null) {
      const found = findGeminiPayload(value[key], depth + 1);
      if (found != null) return found;
    }
  }

  return null;
}

function sanitizeAndNormalizeJson(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/\\x60\\x60\\x60json/gi, '')
    .replace(/\\x60\\x60\\x60javascript/gi, '')
    .replace(/\\x60\\x60\\x60js/gi, '')
    .replace(/\\x60\\x60\\x60/g, '')
    .replace(/[\\u201C\\u201D\\u201E\\u201F\\u2033\\u2036]/g, '"') // smart double quotes
    .replace(/[\\u2018\\u2019\\u201A\\u201B\\u2032\\u2035]/g, "'") // smart single quotes
    .replace(/\\bNone\\b/g, 'null')
    .replace(/\\bTrue\\b/g, 'true')
    .replace(/\\bFalse\\b/g, 'false')
    .trim();
}

function tryParseCandidate(candidate) {
  if (!candidate || typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;

  // 1. Coba JSON.parse langsung
  try {
    return JSON.parse(trimmed);
  } catch (e) {}

  // 2. Coba perbaiki trailing comma dan single quotes ke double quotes
  try {
    let fixed = trimmed
      .replace(/,\\s*([\\]}])/g, '$1')
      .replace(/'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)'/g, '"$1"');
    return JSON.parse(fixed);
  } catch (e) {}

  // 3. Gunakan JavaScript Object evaluation fallback
  try {
    const fn = new Function('return (' + trimmed + ')');
    const result = fn();
    if (result != null && (typeof result === 'object' || Array.isArray(result))) {
      return result;
    }
  } catch (e) {}

  return null;
}

function parseJsonText(text) {
  const cleaned = sanitizeAndNormalizeJson(text);
  if (!cleaned) return [];

  const direct = tryParseCandidate(cleaned);
  if (direct != null) return direct;

  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    const arrayCandidate = cleaned.slice(arrayStart, arrayEnd + 1);
    const parsed = tryParseCandidate(arrayCandidate);
    if (parsed != null) return parsed;
  }

  const objectStart = cleaned.indexOf('{');
  const objectEnd = cleaned.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd > objectStart) {
    const objectCandidate = cleaned.slice(objectStart, objectEnd + 1);
    const parsed = tryParseCandidate(objectCandidate);
    if (parsed != null) return parsed;
  }

  throw new Error('Gagal mengekstrak JSON dari teks AI: ' + cleaned.slice(0, 300));
}

function unwrapExpenseList(value) {
  let current = value;

  for (let i = 0; i < 5; i++) {
    if (typeof current === 'string') {
      current = parseJsonText(current);
    }
    if (Array.isArray(current)) return current;
    if (looksLikeExpenseObject(current)) return [current];

    if (current && typeof current === 'object') {
      const next = current.data || current.items || current.expenses || current.pengeluaran || current.transactions || current.output || current.response || current.text || current.result;
      if (next == null) {
        const values = Object.values(current);
        if (values.length > 0 && (Array.isArray(values[0]) || looksLikeExpenseObject(values[0]))) {
          current = Array.isArray(values[0]) ? values[0] : values;
          continue;
        }
        break;
      }
      current = next;
      continue;
    }

    break;
  }

  return [];
}

function parseNominal(value) {
  if (typeof value === 'number') return Math.round(value);

  const raw = String(value ?? '').toLowerCase().trim();
  const match = raw.match(/(\\d+(?:[.,]\\d+)?)\\s*(rb|ribu|k|jt|juta)?/i);
  if (!match) return 0;

  const number = parseFloat(match[1].replace(',', '.'));
  const unit = match[2];

  if (unit === 'rb' || unit === 'ribu' || unit === 'k') return Math.round(number * 1000);
  if (unit === 'jt' || unit === 'juta') return Math.round(number * 1000000);
  return Math.round(number);
}

function normalizeDate(rawDate, refDateStr) {
  const baseDate = refDateStr ? new Date(refDateStr) : new Date();
  const formatIso = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return \`\${year}-\${month}-\${day}\`;
  };

  const todayStr = formatIso(baseDate);
  if (!rawDate || typeof rawDate !== 'string') return todayStr;

  const trimmed = rawDate.trim().toLowerCase();
  if (trimmed === 'kemarin' || trimmed === 'kmrn') {
    const yesterday = new Date(baseDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatIso(yesterday);
  }
  if (trimmed === 'kemarin lusa' || trimmed === '2 hari lalu' || trimmed === 'lusa kemarin') {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 2);
    return formatIso(d);
  }
  if (trimmed === 'tadi' || trimmed === 'hari ini' || trimmed === 'barusan') {
    return todayStr;
  }

  // Check valid YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    // If AI hallucinated year 2024 when current year is different, adjust to base year
    const currentYear = baseDate.getFullYear();
    if (Math.abs(y - currentYear) > 1 && !trimmed.includes(String(y))) {
      return \`\${currentYear}-\${m}-\${d}\`;
    }
    return \`\${y}-\${m}-\${d}\`;
  }

  return todayStr;
}

let expenseList = [];

try {
  const payload = findGeminiPayload(rawOutput);
  if (payload == null) {
    throw new Error('Payload Gemini kosong/tidak dikenali. Raw: ' + JSON.stringify(rawOutput).slice(0, 500));
  }

  expenseList = unwrapExpenseList(payload);
} catch (error) {
  throw new Error('Gagal melakukan parse JSON dari Gemini AI: ' + error.message);
}

// Extract reference date from trigger payload if available
let refDate = null;
try {
  const webhookInput = $('Webhook (Trigger)')?.first()?.json;
  refDate = webhookInput?.body?.currentDate || webhookInput?.currentDate;
} catch (e) {}

const validatedItems = expenseList.map((rawItem, index) => {
  const item = rawItem?.json || rawItem;
  const nominal = parseNominal(item?.jumlah ?? item?.nominal ?? item?.amount ?? item?.total);
  const desc = item?.deskripsi || item?.description || item?.item || item?.nama || '';
  const cat = item?.kategori || item?.category || 'Lain-lain';
  const tgl = normalizeDate(item?.tanggal || item?.date, refDate);

  return {
    json: {
      index: index + 1,
      tanggal: tgl,
      kategori: cat,
      deskripsi: desc,
      jumlah: nominal,
      total_nominal: nominal
    }
  };
}).filter((item) => item.json.jumlah > 0 && item.json.deskripsi);

if (validatedItems.length === 0) {
  throw new Error('Tidak ada item valid dari Gemini. Cek output node Gemini. Raw: ' + JSON.stringify(rawOutput).slice(0, 800));
}

return validatedItems;`;

export const N8N_WORKFLOW_JSON = {
  "name": "AI Personal Expense Tracker - Webhook to Google Sheets",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "catat-keuangan",
        "responseMode": "responseNode",
        "options": {
          "responseHeaders": {
            "entries": [
              {
                "name": "Access-Control-Allow-Origin",
                "value": "*"
              },
              {
                "name": "Access-Control-Allow-Methods",
                "value": "POST, OPTIONS, GET"
              },
              {
                "name": "Access-Control-Allow-Headers",
                "value": "Content-Type, Authorization"
              }
            ]
          }
        }
      },
      "id": "node-webhook-trigger",
      "name": "Webhook (Trigger)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [220, 300],
      "webhookId": "catat-keuangan"
    },
    {
      "parameters": {
        "modelName": "models/gemini-1.5-flash",
        "options": {
          "systemInstruction": GEMINI_SYSTEM_PROMPT,
          "temperature": 0.1
        },
        "prompt": "=Tanggal referensi HARI INI adalah: {{ $json.body.currentDate || $now.setZone('Asia/Jakarta').toFormat('yyyy-MM-dd') || $now.toFormat('yyyy-MM-dd') }} (WIB).\nJika ada kata 'tadi' / 'hari ini', gunakan tanggal referensi HARI INI.\nJika ada kata 'kemarin', gunakan 1 hari sebelumnya: {{ $now.setZone('Asia/Jakarta').minus({days: 1}).toFormat('yyyy-MM-dd') }}.\nJika ada kata 'kemarin lusa' / '2 hari lalu', gunakan 2 hari sebelumnya: {{ $now.setZone('Asia/Jakarta').minus({days: 2}).toFormat('yyyy-MM-dd') }}.\n\nEkstrak teks pengeluaran berikut menjadi JSON array sesuai instruksi:\n{{ $json.body.message || $json.message }}"
      },
      "id": "node-gemini-ai",
      "name": "Gemini AI (Structured Output)",
      "type": "@n8n/n8n-nodes-langchain.googleGemini",
      "typeVersion": 1,
      "position": [440, 300],
      "credentials": {
        "googlePalmApi": {
          "id": "GEMINI_CREDENTIAL_ID",
          "name": "Google Gemini API Key"
        }
      }
    },
    {
      "parameters": {
        "jsCode": N8N_CODE_NODE_SCRIPT
      },
      "id": "node-code-parser",
      "name": "Code (JSON Parser & Validation)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [660, 300]
    },
    {
      "parameters": {
        "operation": "append",
        "documentId": {
          "__rl": true,
          "value": "={{ $env.GOOGLE_SHEETS_ID || 'MASUKKAN_ID_SPREADSHEET_DISINI' }}",
          "mode": "id"
        },
        "sheetName": {
          "__rl": true,
          "value": "Sheet1",
          "mode": "list"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Tanggal": "={{ $json.tanggal }}",
            "Kategori": "={{ $json.kategori }}",
            "Deskripsi": "={{ $json.deskripsi }}",
            "Jumlah": "={{ $json.jumlah }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "Tanggal",
              "displayName": "Tanggal",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Kategori",
              "displayName": "Kategori",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Deskripsi",
              "displayName": "Deskripsi",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Jumlah",
              "displayName": "Jumlah",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true
            }
          ]
        },
        "options": {}
      },
      "id": "node-google-sheets",
      "name": "Google Sheets (Append Row)",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5,
      "position": [880, 300],
      "credentials": {
        "googleSheetsOAuth2": {
          "id": "SHEETS_CREDENTIAL_ID",
          "name": "Google Service Account"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "={{\n  JSON.stringify({\n    \"status\": \"success\",\n    \"message\": \"Berhasil mencatat \" + $('Code (JSON Parser & Validation)').all().length + \" transaksi ke Google Sheets!\",\n    \"total_items\": $('Code (JSON Parser & Validation)').all().length,\n    \"total_nominal\": $('Code (JSON Parser & Validation)').all().reduce((acc, curr) => acc + (curr.json.jumlah || 0), 0),\n    \"data\": $('Code (JSON Parser & Validation)').all().map(i => i.json)\n  })\n}}",
        "options": {
          "responseCode": 200,
          "responseHeaders": {
            "entries": [
              {
                "name": "Content-Type",
                "value": "application/json"
              },
              {
                "name": "Access-Control-Allow-Origin",
                "value": "*"
              },
              {
                "name": "Access-Control-Allow-Headers",
                "value": "Content-Type, Authorization"
              }
            ]
          }
        }
      },
      "id": "node-respond-webhook",
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1100, 300],
      "executeOnce": true
    }
  ],
  "connections": {
    "Webhook (Trigger)": {
      "main": [
        [
          {
            "node": "Gemini AI (Structured Output)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Gemini AI (Structured Output)": {
      "main": [
        [
          {
            "node": "Code (JSON Parser & Validation)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code (JSON Parser & Validation)": {
      "main": [
        [
          {
            "node": "Google Sheets (Append Row)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Sheets (Append Row)": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
};

export const SAMPLE_PROMPTS = [
  "Tadi beli lontong 2 ribu sama risol 3 ribu, sama kemarin beli roti bakar 2 bungkus 40 ribu",
  "Beli kopi 25rb, bensin pertalite 30rb, makan siang warteg 22rb",
  "Belanja bulanan supermarket 450rb, bayar token listrik 200rb, beli galon aqua 20rb",
  "Gojek ke kantor 18k, makan malam pecel lele 28k, laundry 35k",
  "Service ganti oli motor 85rb, beli pulsa kuota internet 100k",
  "Beli obat flu di apotek 45.000, vitamin C 30.000, bayar parkir 4.000"
];
