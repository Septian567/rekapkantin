import { NextResponse } from "next/server";
import { google } from "googleapis";

type DailyReport = {
  id: number;
  tanggal: string;
  untung_bersih: number;
  saldo_real: number;
  total_omzet: number;
  total_untung: number;
};

type DailyReportItem = {
  id: number;
  daily_report_id: number;
  product_id: number | null;
  item: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  sisa: number;
  terjual: number;
  omzet: number;
  untung: number;
};

type ExportMode = "all" | "date";

const REPORT_SHEET = "Riwayat Harian";
const ITEM_SHEET = "Rincian Produk";

const REPORT_HEADERS = [
  "ID Laporan",
  "Tanggal",
  "Untung Bersih",
  "Saldo Real",
  "Total Omzet",
];

const ITEM_HEADERS = [
  "ID Rincian",
  "ID Laporan",
  "ID Produk",
  "Nama Item",
  "Harga Beli",
  "Harga Jual",
  "Stok",
  "Sisa",
  "Terjual",
  "Omzet",
  "Untung",
];

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!email || !privateKey || !spreadsheetId) {
    throw new Error(
      "Konfigurasi Google Sheets belum lengkap. Periksa environment variables."
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return {
    sheets: google.sheets({ version: "v4", auth }),
    spreadsheetId,
  };
}

async function ensureSheet(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  title: string
) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });

  const existing = metadata.data.sheets?.some(
    (sheet) => sheet.properties?.title === title
  );

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
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

async function readRows(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  title: string
): Promise<any[][]> {
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${title}'!A:Z`,
  });

  return (result.data.values ?? []) as any[][];
}

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

function mergeById(
  existingRows: any[][],
  incomingRows: any[][],
  header: string[]
): any[][] {
  const rowsById = new Map<string, any[]>();

  // Ambil data lama, abaikan header.
  for (const row of existingRows.slice(1)) {
    const id = normalizeId(row[0]);

    if (id) {
      rowsById.set(id, row);
    }
  }

  // Perbarui ID yang sudah ada atau tambahkan ID baru.
  for (const row of incomingRows) {
    const id = normalizeId(row[0]);

    if (id) {
      rowsById.set(id, row);
    }
  }

  const result = Array.from(rowsById.values());

  // Urutkan berdasarkan ID.
  result.sort((a, b) => {
    const idA = Number(a[0]);
    const idB = Number(b[0]);

    if (Number.isFinite(idA) && Number.isFinite(idB)) {
      return idA - idB;
    }

    return String(a[0]).localeCompare(String(b[0]));
  });

  return [header, ...result];
}

async function replaceSheetData(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  title: string,
  rows: any[][]
) {
  // Hapus data lama agar tidak ada baris sisa.
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${title}'!A:Z`,
  });

  // Tulis data baru mulai dari A1.
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${title}'!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: rows,
    },
  });
}

async function formatRiwayatHarian(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });

  const sheet = metadata.data.sheets?.find(
    (item) => item.properties?.title === REPORT_SHEET
  );

  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined) {
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 2,
              endColumnIndex: 5,
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

    const reports = body.reports as DailyReport[];
    const details = body.details as DailyReportItem[];
    const mode = body.mode as ExportMode;

    if (!Array.isArray(reports) || !Array.isArray(details)) {
      return NextResponse.json(
        {
          success: false,
          message: "Data laporan atau rincian tidak valid.",
        },
        { status: 400 }
      );
    }

    if (mode !== "all" && mode !== "date") {
      return NextResponse.json(
        {
          success: false,
          message: "Mode ekspor tidak valid.",
        },
        { status: 400 }
      );
    }

    const reportIds = new Set(reports.map((report) => String(report.id)));

    // Pastikan semua rincian milik laporan yang ikut dikirim.
    if (
      details.some(
        (item) => !reportIds.has(String(item.daily_report_id))
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Ada rincian produk yang tidak cocok dengan laporan.",
        },
        { status: 400 }
      );
    }

    const { sheets, spreadsheetId } = getSheetsClient();

    await ensureSheet(sheets, spreadsheetId, REPORT_SHEET);
    await ensureSheet(sheets, spreadsheetId, ITEM_SHEET);

    // Kolom Total Untung sengaja tidak dimasukkan.
    const incomingReports = reports.map((report) => [
      report.id,
      report.tanggal,
      report.untung_bersih,
      report.saldo_real,
      report.total_omzet,
    ]);

    const incomingItems = details.map((item) => [
      item.id,
      item.daily_report_id,
      item.product_id ?? "",
      item.item,
      item.harga_beli,
      item.harga_jual,
      item.stok,
      item.sisa,
      item.terjual,
      item.omzet,
      item.untung,
    ]);

    if (mode === "date") {
      // Ekspor tanggal: pertahankan data tanggal lain.
      const [oldReports, oldItems] = await Promise.all([
        readRows(sheets, spreadsheetId, REPORT_SHEET),
        readRows(sheets, spreadsheetId, ITEM_SHEET),
      ]);

      const mergedReports = mergeById(
        oldReports,
        incomingReports,
        REPORT_HEADERS
      );

      const mergedItems = mergeById(
        oldItems,
        incomingItems,
        ITEM_HEADERS
      );

      await replaceSheetData(
        sheets,
        spreadsheetId,
        REPORT_SHEET,
        mergedReports
      );

      await replaceSheetData(
        sheets,
        spreadsheetId,
        ITEM_SHEET,
        mergedItems
      );
    } else {
      // Ekspor semua: sinkronkan data yang dikirim dari Supabase.
      const allReports = [REPORT_HEADERS, ...incomingReports];
      const allItems = [ITEM_HEADERS, ...incomingItems];

      await replaceSheetData(
        sheets,
        spreadsheetId,
        REPORT_SHEET,
        allReports
      );

      await replaceSheetData(
        sheets,
        spreadsheetId,
        ITEM_SHEET,
        allItems
      );
    }

    // Terapkan format Accounting rupiah setelah data ditulis.
    await formatRiwayatHarian(sheets, spreadsheetId);

    return NextResponse.json({
      success: true,
      message:
        mode === "date"
          ? "Ekspor tanggal berhasil. Riwayat tanggal lain tetap dipertahankan."
          : "Seluruh riwayat berhasil disinkronkan dari Supabase.",
      reports: reports.length,
      details: details.length,
      spreadsheetId,
    });
  } catch (error) {
    console.error("Google Sheets export error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat ekspor ke Google Sheets.",
      },
      { status: 500 }
    );
  }
}
