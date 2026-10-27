import { NextResponse } from "next/server";
import { google } from "googleapis";

const SPREADSHEET_ID =
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const REPORTS_SHEET = "Page5 - Riwayat Harian";
const WEEKLY_SHEET = "Page5 - Ringkasan Mingguan";
const TOTAL_SHEET = "Page5 - Total Akumulasi";

type ExportRow = Record<string, string | number | null>;

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!SPREADSHEET_ID || !email || !privateKey) {
    throw new Error(
      "Konfigurasi Google Sheets belum lengkap. Periksa environment variables."
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

async function ensureSheet(
  sheets: ReturnType<typeof google.sheets>,
  title: string
) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID!,
    fields: "sheets.properties",
  });

  const exists = metadata.data.sheets?.some(
    (sheet) => sheet.properties?.title === title
  );

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID!,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title },
            },
          },
        ],
      },
    });
  }
}

function convertRows(rows: ExportRow[]): (string | number)[][] {
  if (rows.length === 0) {
    return [["Tidak ada data"]];
  }

  const headers = Object.keys(rows[0]);

  return [
    headers,
    ...rows.map((row) =>
      headers.map((header) => row[header] ?? "")
    ),
  ];
}

async function writeSheet(
  sheets: ReturnType<typeof google.sheets>,
  title: string,
  rows: ExportRow[]
) {
  const values = convertRows(rows);

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID!,
    range: `'${title}'!A:Z`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID!,
    range: `'${title}'!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values,
    },
  });
}

async function formatCurrencyColumns(
  sheets: ReturnType<typeof google.sheets>,
  title: string,
  startColumnIndex: number,
  endColumnIndex: number
) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID!,
    fields: "sheets.properties",
  });

  const sheet = metadata.data.sheets?.find(
    (item) => item.properties?.title === title
  );

  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID!,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              startColumnIndex,
              endColumnIndex,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: {
                  type: "CURRENCY",
                  pattern: '"Rp" #,##0.00;-"Rp" #,##0.00',
                },
              },
            },
            fields: "userEnteredFormat.numberFormat",
          },
        },
      ],
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const dataHarian = body.dataHarian as ExportRow[];
    const dataMingguan = body.dataMingguan as ExportRow[];
    const dataTotal = body.dataTotal as ExportRow[];

    if (
      !Array.isArray(dataHarian) ||
      !Array.isArray(dataMingguan) ||
      !Array.isArray(dataTotal)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Format data ekspor tidak valid.",
        },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();

    await ensureSheet(sheets, REPORTS_SHEET);
    await ensureSheet(sheets, WEEKLY_SHEET);
    await ensureSheet(sheets, TOTAL_SHEET);

    await writeSheet(sheets, REPORTS_SHEET, dataHarian);
    await writeSheet(sheets, WEEKLY_SHEET, dataMingguan);
    await writeSheet(sheets, TOTAL_SHEET, dataTotal);

    // Riwayat harian:
    // A = Tanggal, B = Modal Harian, C = Modal Tambahan,
    // D = Saldo Real, E = Untung.
    await formatCurrencyColumns(
      sheets,
      REPORTS_SHEET,
      1,
      5
    );

    // Ringkasan mingguan:
    // A = Tanggal Mulai, B = Tanggal Selesai,
    // C = Jumlah Hari, D-G = nilai keuangan.
    await formatCurrencyColumns(
      sheets,
      WEEKLY_SHEET,
      3,
      7
    );

    // Total akumulasi:
    // A = Keterangan, B = Nominal.
    await formatCurrencyColumns(
      sheets,
      TOTAL_SHEET,
      1,
      2
    );

    return NextResponse.json({
      success: true,
      message: "Data Page 5 berhasil diekspor ke Google Sheets.",
      spreadsheetId: SPREADSHEET_ID,
    });
  } catch (error) {
    console.error("Export Page 5 Google Sheets error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengekspor data Page 5.",
      },
      { status: 500 }
    );
  }
}