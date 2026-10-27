import { NextResponse } from "next/server";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const SHEET_TRANSAKSI = "Page6 - Catatan Transaksi";
const SHEET_HARIAN = "Page6 - Ringkasan Harian";
const SHEET_TOTAL = "Page6 - Total Akumulasi";

type ExportRow = Record<string, string | number | null | undefined>;

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!SPREADSHEET_ID || !email || !privateKey) {
    throw new Error(
      "Konfigurasi Google Sheets belum lengkap. Periksa GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, dan GOOGLE_PRIVATE_KEY."
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
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
        requests: [{ addSheet: { properties: { title } } }],
      },
    });
  }
}

function convertRows(rows: ExportRow[]): (string | number)[][] {
  if (rows.length === 0) return [["Tidak ada data"]];

  const headers = Object.keys(rows[0]);
  return [
    headers,
    ...rows.map((row) =>
      headers.map((header) => {
        const value = row[header];
        return value === null || value === undefined ? "" : value;
      })
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
    requestBody: { values },
  });
}

async function formatCurrency(
  sheets: ReturnType<typeof google.sheets>,
  title: string,
  startColumnIndex: number,
  endColumnIndex: number,
  startRowIndex = 1,
  endRowIndex?: number
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
              startRowIndex,
              endRowIndex,
              startColumnIndex,
              endColumnIndex,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: {
                  type: "CURRENCY",
                  pattern: '"Rp" #,##0;-"Rp" #,##0',
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
    const { dataTransaksi, dataHarian, dataTotal } = body ?? {};

    if (
      !Array.isArray(dataTransaksi) ||
      !Array.isArray(dataHarian) ||
      !Array.isArray(dataTotal)
    ) {
      return NextResponse.json(
        { success: false, message: "Format data ekspor tidak valid." },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();

    await ensureSheet(sheets, SHEET_TRANSAKSI);
    await ensureSheet(sheets, SHEET_HARIAN);
    await ensureSheet(sheets, SHEET_TOTAL);

    await writeSheet(sheets, SHEET_TRANSAKSI, dataTransaksi);
    await writeSheet(sheets, SHEET_HARIAN, dataHarian);
    await writeSheet(sheets, SHEET_TOTAL, dataTotal);

    // Catatan transaksi: kolom C-E adalah nominal.
    await formatCurrency(sheets, SHEET_TRANSAKSI, 2, 5);
    // Ringkasan harian: kolom B-D adalah nominal.
    await formatCurrency(sheets, SHEET_HARIAN, 1, 4);
    // Total akumulasi: format hanya tiga baris nominal, bukan jumlah transaksi.
    await formatCurrency(sheets, SHEET_TOTAL, 1, 2, 1, 4);

    return NextResponse.json({
      success: true,
      message: "Data Page 6 berhasil diekspor ke Google Sheets.",
      spreadsheetId: SPREADSHEET_ID,
    });
  } catch (error) {
    console.error("Export Page 6 Google Sheets error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengekspor data Page 6.",
      },
      { status: 500 }
    );
  }
}
