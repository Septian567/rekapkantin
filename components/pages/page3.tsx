"use client";

import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "../../lib/supabase/client";

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

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTanggal(tanggal: string) {
  const [year, month, day] = tanggal.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function buatNamaFile(tanggal?: string) {
  const tanggalFile =
    tanggal ??
    new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });

  return `riwayat-omzet-${tanggalFile}.xlsx`;
}

export default function Page3() {
  const [history, setHistory] = useState<DailyReport[]>([]);
  const [items, setItems] = useState<DailyReportItem[]>([]);
  const [tanggalTerpilih, setTanggalTerpilih] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [exportingAll, setExportingAll] = useState(false);
  const [exportingDate, setExportingDate] = useState(false);

  const [exportingSheetsAll, setExportingSheetsAll] = useState(false);
  const [exportingSheetsDate, setExportingSheetsDate] = useState(false);

  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportSuccess, setExportSuccess] = useState("");

  const sedangEkspor =
    exportingAll ||
    exportingDate ||
    exportingSheetsAll ||
    exportingSheetsDate;

  const fetchHistory = useCallback(async () => {
    const supabase = createClient();

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("daily_reports")
        .select(
          "id, tanggal, untung_bersih, saldo_real, total_omzet, total_untung",
        )
        .order("tanggal", { ascending: false });

      if (error) throw error;

      setHistory((data ?? []) as DailyReport[]);
    } catch (err) {
      console.error("Gagal mengambil riwayat omzet:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil riwayat omzet.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  async function toggleTanggal(report: DailyReport) {
    if (tanggalTerpilih === report.id) {
      setTanggalTerpilih(null);
      setItems([]);
      setDetailError("");
      return;
    }

    const supabase = createClient();

    setTanggalTerpilih(report.id);
    setItems([]);
    setDetailError("");
    setLoadingDetail(true);

    try {
      const { data, error } = await supabase
        .from("daily_report_items")
        .select(
          "id, daily_report_id, product_id, item, harga_beli, harga_jual, stok, sisa, terjual, omzet, untung",
        )
        .eq("daily_report_id", report.id)
        .order("id", { ascending: true });

      if (error) throw error;

      setItems((data ?? []) as DailyReportItem[]);
    } catch (err) {
      console.error("Gagal mengambil rincian rekap:", err);

      setDetailError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil rincian rekap.",
      );
    } finally {
      setLoadingDetail(false);
    }
  }

  // Mengambil seluruh rincian produk dengan pagination.
  async function ambilSemuaRincian(reportIds: number[]) {
    const supabase = createClient();
    const semuaRincian: DailyReportItem[] = [];
    const ukuranHalaman = 1000;

    for (const reportId of reportIds) {
      let offset = 0;

      while (true) {
        const { data, error } = await supabase
          .from("daily_report_items")
          .select(
            "id, daily_report_id, product_id, item, harga_beli, harga_jual, stok, sisa, terjual, omzet, untung",
          )
          .eq("daily_report_id", reportId)
          .order("id", { ascending: true })
          .range(offset, offset + ukuranHalaman - 1);

        if (error) throw error;

        const halaman = (data ?? []) as DailyReportItem[];

        semuaRincian.push(...halaman);

        if (halaman.length < ukuranHalaman) break;

        offset += ukuranHalaman;
      }
    }

    return semuaRincian;
  }

  // Ekspor Excel tetap menggunakan dua sheet.
  function unduhExcel(
    reports: DailyReport[],
    details: DailyReportItem[],
    tanggal?: string,
  ) {
    const dataRiwayat = reports.map((report) => ({
      Tanggal: report.tanggal,
      "Untung Bersih": Number(report.untung_bersih),
      "Saldo Real": Number(report.saldo_real),
      "Total Omzet": Number(report.total_omzet),
      "Total Untung": Number(report.total_untung),
    }));

    const laporanById = new Map(
      reports.map((report) => [report.id, report]),
    );

    const dataRincian = details.map((item) => ({
      Tanggal:
        laporanById.get(item.daily_report_id)?.tanggal ?? "",
      Item: item.item,
      "Harga Beli": Number(item.harga_beli),
      "Harga Jual": Number(item.harga_jual),
      Stok: Number(item.stok),
      Sisa: Number(item.sisa),
      Terjual: Number(item.terjual),
      Omzet: Number(item.omzet),
      Untung: Number(item.untung),
    }));

    const workbook = XLSX.utils.book_new();

    const worksheetRiwayat =
      XLSX.utils.json_to_sheet(dataRiwayat);

    const worksheetRincian =
      XLSX.utils.json_to_sheet(dataRincian);

    worksheetRiwayat["!cols"] = [
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    worksheetRincian["!cols"] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      worksheetRiwayat,
      "Riwayat Harian",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      worksheetRincian,
      "Rincian Produk",
    );

    XLSX.writeFile(workbook, buatNamaFile(tanggal));
  }

  // Mengirim data ke API Route Google Sheets.
  async function kirimKeGoogleSheets(
    reports: DailyReport[],
    details: DailyReportItem[],
    mode: ExportMode,
  ) {
    const response = await fetch("/api/export-google-sheets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reports,
        details,
        mode,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ?? "Gagal mengekspor ke Google Sheets.",
      );
    }

    return result as {
      success: boolean;
      message: string;
      reports: number;
      details: number;
      spreadsheetId: string;
    };
  }

  // Mengambil seluruh laporan.
  async function ambilSemuaLaporan() {
    const supabase = createClient();
    const semuaLaporan: DailyReport[] = [];
    const ukuranHalaman = 1000;
    let offset = 0;

    while (true) {
      const { data, error } = await supabase
        .from("daily_reports")
        .select(
          "id, tanggal, untung_bersih, saldo_real, total_omzet, total_untung",
        )
        .order("tanggal", { ascending: true })
        .order("id", { ascending: true })
        .range(offset, offset + ukuranHalaman - 1);

      if (error) throw error;

      const halaman = (data ?? []) as DailyReport[];

      semuaLaporan.push(...halaman);

      if (halaman.length < ukuranHalaman) break;

      offset += ukuranHalaman;
    }

    return semuaLaporan;
  }

  // EKSPOR EXCEL: seluruh riwayat.
  async function exportSemuaRiwayat() {
    if (sedangEkspor) return;

    setExportingAll(true);
    setExportError("");
    setExportSuccess("");

    try {
      const semuaLaporan = await ambilSemuaLaporan();

      if (semuaLaporan.length === 0) {
        throw new Error("Belum ada riwayat yang bisa diekspor.");
      }

      const semuaRincian = await ambilSemuaRincian(
        semuaLaporan.map((report) => report.id),
      );

      unduhExcel(semuaLaporan, semuaRincian);
    } catch (err) {
      console.error("Gagal mengekspor semua riwayat:", err);

      setExportError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengekspor semua riwayat.",
      );
    } finally {
      setExportingAll(false);
    }
  }

  // EKSPOR EXCEL: tanggal terpilih.
  async function exportTanggalIni() {
    if (sedangEkspor) return;

    if (tanggalTerpilih === null) {
      setExportError("Pilih tanggal riwayat terlebih dahulu.");
      return;
    }

    const report = history.find(
      (item) => item.id === tanggalTerpilih,
    );

    if (!report) {
      setExportError(
        "Riwayat tanggal yang dipilih tidak ditemukan.",
      );
      return;
    }

    setExportingDate(true);
    setExportError("");
    setExportSuccess("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("daily_reports")
        .select(
          "id, tanggal, untung_bersih, saldo_real, total_omzet, total_untung",
        )
        .eq("id", report.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "Riwayat tanggal tersebut tidak ditemukan.",
        );
      }

      const laporan = data as DailyReport;

      const rincian = await ambilSemuaRincian([
        laporan.id,
      ]);

      unduhExcel(
        [laporan],
        rincian,
        laporan.tanggal,
      );
    } catch (err) {
      console.error("Gagal mengekspor riwayat tanggal:", err);

      setExportError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengekspor tanggal ini.",
      );
    } finally {
      setExportingDate(false);
    }
  }

  // EKSPOR GOOGLE SHEETS: seluruh riwayat.
  async function exportSemuaKeGoogleSheets() {
    if (sedangEkspor) return;

    setExportingSheetsAll(true);
    setExportError("");
    setExportSuccess("");

    try {
      const semuaLaporan = await ambilSemuaLaporan();

      if (semuaLaporan.length === 0) {
        throw new Error(
          "Belum ada riwayat yang bisa diekspor.",
        );
      }

      const semuaRincian = await ambilSemuaRincian(
        semuaLaporan.map((report) => report.id),
      );

      const result = await kirimKeGoogleSheets(
        semuaLaporan,
        semuaRincian,
        "all",
      );

      setExportSuccess(
        `${result.message} ${result.reports} laporan dan ${result.details} rincian produk.`,
      );
    } catch (err) {
      console.error(
        "Gagal mengekspor semua riwayat ke Google Sheets:",
        err,
      );

      setExportError(
        err instanceof Error
          ? err.message
          : "Gagal mengekspor ke Google Sheets.",
      );
    } finally {
      setExportingSheetsAll(false);
    }
  }

  // EKSPOR GOOGLE SHEETS: tanggal terpilih.
  async function exportTanggalKeGoogleSheets() {
    if (sedangEkspor) return;

    if (tanggalTerpilih === null) {
      setExportError("Pilih tanggal riwayat terlebih dahulu.");
      return;
    }

    const report = history.find(
      (item) => item.id === tanggalTerpilih,
    );

    if (!report) {
      setExportError(
        "Riwayat tanggal yang dipilih tidak ditemukan.",
      );
      return;
    }

    setExportingSheetsDate(true);
    setExportError("");
    setExportSuccess("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("daily_reports")
        .select(
          "id, tanggal, untung_bersih, saldo_real, total_omzet, total_untung",
        )
        .eq("id", report.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "Riwayat tanggal tersebut tidak ditemukan.",
        );
      }

      const laporan = data as DailyReport;

      const rincian = await ambilSemuaRincian([
        laporan.id,
      ]);

      const result = await kirimKeGoogleSheets(
        [laporan],
        rincian,
        "date",
      );

      setExportSuccess(result.message);
    } catch (err) {
      console.error(
        "Gagal mengekspor tanggal ke Google Sheets:",
        err,
      );

      setExportError(
        err instanceof Error
          ? err.message
          : "Gagal mengekspor tanggal ke Google Sheets.",
      );
    } finally {
      setExportingSheetsDate(false);
    }
  }

  const riwayatTerpilih = history.find(
    (report) => report.id === tanggalTerpilih,
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
            Riwayat Omzet Harian
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Pilih tanggal untuk melihat rincian penjualan dan saldo harian.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void exportSemuaRiwayat()}
            disabled={
              loading ||
              history.length === 0 ||
              sedangEkspor
            }
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingAll
              ? "Mengekspor..."
              : "Ekspor Semua Riwayat"}
          </button>

          <button
            type="button"
            onClick={() => void exportTanggalIni()}
            disabled={
              loading ||
              !riwayatTerpilih ||
              sedangEkspor
            }
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingDate
              ? "Mengekspor..."
              : "Ekspor Tanggal Ini"}
          </button>

          <button
            type="button"
            onClick={() => void exportSemuaKeGoogleSheets()}
            disabled={
              loading ||
              history.length === 0 ||
              sedangEkspor
            }
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingSheetsAll
              ? "Mengirim..."
              : "Ekspor Semua ke Google Sheets"}
          </button>

          <button
            type="button"
            onClick={() => void exportTanggalKeGoogleSheets()}
            disabled={
              loading ||
              !riwayatTerpilih ||
              sedangEkspor
            }
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingSheetsDate
              ? "Mengirim..."
              : "Ekspor Tanggal ke Google Sheets"}
          </button>

          <button
            type="button"
            onClick={() => void fetchHistory()}
            disabled={loading || sedangEkspor}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Muat Ulang"}
          </button>
        </div>
      </div>

      {/* Pesan ekspor */}
      {exportError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Ekspor gagal.</p>
          <p className="mt-1">{exportError}</p>
        </div>
      )}

      {exportSuccess && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          <p className="font-semibold">Ekspor berhasil.</p>
          <p className="mt-1">{exportSuccess}</p>
        </div>
      )}

      {/* Pesan kesalahan riwayat */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Gagal mengambil riwayat.</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* Daftar riwayat */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-5">
          <h3 className="font-semibold text-gray-800">
            Daftar Tanggal
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {loading
              ? "Sedang mengambil data..."
              : `${history.length} tanggal riwayat`}
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              Memuat riwayat omzet dari Supabase...
            </div>
          ) : error ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              Riwayat omzet tidak dapat ditampilkan.
            </div>
          ) : history.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-medium text-gray-700">
                Belum ada riwayat omzet.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Rekap yang sudah disimpan akan muncul di sini.
              </p>
            </div>
          ) : (
            history.map((report) => {
              const isSelected =
                tanggalTerpilih === report.id;

              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => void toggleTanggal(report)}
                  aria-expanded={isSelected}
                  className={`flex min-h-16 w-full items-center justify-between gap-3 px-4 py-4 text-left transition sm:px-5 ${
                    isSelected
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">
                      {formatTanggal(report.tanggal)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Rekap harian
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 sm:gap-5">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        {formatRupiah(
                          Number(report.total_omzet),
                        )}
                      </p>

                      <p className="mt-1 text-xs text-green-700">
                        Untung{" "}
                        {formatRupiah(
                          Number(report.total_untung),
                        )}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className="text-xs text-gray-400"
                    >
                      {isSelected ? "▲" : "▼"}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Rincian tanggal terpilih */}
      {riwayatTerpilih && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-5">
            <h3 className="font-bold text-gray-800">
              Rincian Riwayat Omzet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {formatTanggal(riwayatTerpilih.tanggal)}
            </p>

            <p className="mt-2 text-xs text-blue-700">
              Tombol ekspor tanggal akan menggunakan tanggal yang sedang dipilih.
            </p>
          </div>

          {loadingDetail ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              Memuat rincian produk...
            </div>
          ) : detailError ? (
            <div
              role="alert"
              className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {detailError}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Item
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Harga Beli
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Harga Jual
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Stok
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Sisa
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Terjual
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Omzet
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Untung
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          Belum ada rincian produk untuk tanggal ini.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 capitalize text-gray-700">
                            {item.item}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">
                            {formatRupiah(
                              Number(item.harga_beli),
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">
                            {formatRupiah(
                              Number(item.harga_jual),
                            )}
                          </td>

                          <td className="px-4 py-3 text-center text-gray-700">
                            {item.stok}
                          </td>

                          <td className="px-4 py-3 text-center text-gray-700">
                            {item.sisa}
                          </td>

                          <td className="px-4 py-3 text-center text-gray-700">
                            {item.terjual}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                            {formatRupiah(Number(item.omzet))}
                          </td>

                          <td
                            className={`whitespace-nowrap px-4 py-3 text-right ${
                              Number(item.untung) < 0
                                ? "text-red-600"
                                : "text-green-700"
                            }`}
                          >
                            {formatRupiah(Number(item.untung))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-3 font-semibold text-gray-800"
                      >
                        Total
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-gray-800">
                        {formatRupiah(
                          Number(riwayatTerpilih.total_omzet),
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-green-700">
                        {formatRupiah(
                          Number(riwayatTerpilih.total_untung),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid gap-3 border-t border-gray-200 p-4 sm:grid-cols-3 sm:p-5">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Untung Bersih
                  </p>

                  <p className="mt-2 break-words font-bold text-gray-800">
                    {formatRupiah(
                      Number(riwayatTerpilih.untung_bersih),
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    Total Omzet
                  </p>

                  <p className="mt-2 break-words font-bold text-blue-800">
                    {formatRupiah(
                      Number(riwayatTerpilih.total_omzet),
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    Saldo Real
                  </p>

                  <p className="mt-2 break-words font-bold text-green-800">
                    {formatRupiah(
                      Number(riwayatTerpilih.saldo_real),
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!loading &&
        !error &&
        history.length > 0 &&
        !riwayatTerpilih && (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-500">
              Klik salah satu tanggal di atas untuk melihat rincian produk dan saldo harian.
            </p>
          </div>
        )}
    </div>
  );
}
