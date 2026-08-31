export const GEMINI_SYSTEM_PROMPT = `Anda adalah asisten AI akuntansi pribadi yang bertugas mengekstrak catatan pengeluaran dari teks bahasa Indonesia bebas menjadi format JSON terstruktur yang presisi.

ATURAN UTAMA:
1. Ekstraksi semua item pengeluaran yang disebutkan dalam teks pengguna.
2. Tanggal harus dalam format YYYY-MM-DD. Gunakan tanggal hari ini jika pengguna tidak menyebutkan tanggal tertentu.
3. Konversikan singkatan nominal bahasa Indonesia:
   - "rb", "k", "ribu" = dikalikan 1.000 (contoh: "25rb" -> 25000, "1.5jt" -> 1500000)
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
// Mengambil output dari Gemini AI Node, melakukan parsing aman, 
// memvalidasi field, dan mengembalikan array item untuk Google Sheets Append Row.

const rawOutput = $input.first().json;
let expenseList = [];

try {
  // Ambil teks dari AI node (bisa dari text, response, output, atau message)
  let aiText = rawOutput.text || rawOutput.response || rawOutput.output || (rawOutput.candidates && rawOutput.candidates[0]?.content?.parts[0]?.text) || JSON.stringify(rawOutput);
  
  if (typeof aiText === 'string') {
    // Bersihkan markdown code block jika model AI membungkus dengan json codeblock
    aiText = aiText.replace(new RegExp("\\x60\\x60\\x60json", "gi"), "").replace(new RegExp("\\x60\\x60\\x60", "g"), "").trim();
    expenseList = JSON.parse(aiText);
  } else if (Array.isArray(aiText)) {
    expenseList = aiText;
  } else if (typeof aiText === 'object') {
    expenseList = [aiText];
  }
} catch (error) {
  throw new Error("Gagal melakukan parse JSON dari Gemini AI: " + error.message);
}

if (!Array.isArray(expenseList)) {
  expenseList = [expenseList];
}

const todayStr = new Date().toISOString().split('T')[0];

// Normalisasi dan validasi setiap item
const validatedItems = expenseList.map((item, index) => {
  const nominal = parseInt(String(item.jumlah || item.nominal || item.amount || 0).replace(/[^0-9]/g, ''), 10) || 0;
  return {
    json: {
      index: index + 1,
      tanggal: item.tanggal || todayStr,
      kategori: item.kategori || "Lain-lain",
      deskripsi: item.deskripsi || "Pengeluaran tanpa deskripsi",
      jumlah: nominal,
      total_nominal: nominal
    }
  };
});

if (validatedItems.length === 0) {
  throw new Error("Tidak ada item pengeluaran valid yang berhasil diekstrak.");
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
        "prompt": "=Ekstrak pengeluaran berikut menjadi JSON array sesuai instruksi:\n{{ $json.body.message || $json.message }}"
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
          "schema": []
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
        "respondWith": "json",
        "responseBody": "={\n  \"status\": \"success\",\n  \"message\": \"Berhasil mencatat \" + $items().length + \" transaksi ke Google Sheets!\",\n  \"total_items\": $items().length,\n  \"total_nominal\": $items().reduce((acc, curr) => acc + (curr.json.jumlah || 0), 0),\n  \"data\": $items().map(i => i.json)\n}",
        "options": {
          "responseCode": 200,
          "responseHeaders": {
            "entries": [
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
      "position": [1100, 300]
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
  "Beli kopi 25rb, bensin pertalite 30rb, makan siang warteg 22rb",
  "Belanja bulanan supermarket 450rb, bayar token listrik 200rb, beli galon aqua 20rb",
  "Gojek ke kantor 18k, makan malam pecel lele 28k, laundry 35k",
  "Service ganti oli motor 85rb, beli pulsa kuota internet 100k",
  "Beli obat flu di apotek 45.000, vitamin C 30.000, bayar parkir 4.000"
];
