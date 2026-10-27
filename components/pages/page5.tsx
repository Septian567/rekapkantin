"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import * as XLSX from "xlsx";

const supabase = createClient();

type RiwayatHarian = {
tanggal: string;
modal: number;
modalTambahan: number;
saldoReal: number;
untung: number;
};

type RingkasanMingguan = {
mulai: string;
selesai: string;
modal: number;
modalTambahan: number;
saldoReal: number;
untung: number;
jumlahHari: number;
};

type ModalHarianDB = {
tanggal: string;
modal: number | string | null;
};

type SaldoRealDB = {
tanggal: string;
saldo_real: number | string | null;
};

type ModalMingguanDB = {
tanggal_mulai: string;
tanggal_selesai: string;
modal_tambahan: number | string | null;
};

function formatRupiah(nilai: number): string {
return new Intl.NumberFormat("id-ID", {
style: "currency",
currency: "IDR",
maximumFractionDigits: 0,
}).format(nilai);
}

function formatTanggal(tanggal: string): string {
const [tahun, bulan, hari] = tanggal.split("-").map(Number);

return new Intl.DateTimeFormat("id-ID", {
day: "numeric",
month: "long",
year: "numeric",
timeZone: "UTC",
}).format(new Date(Date.UTC(tahun, bulan - 1, hari)));
}

function formatHariTanggal(tanggal: string): string {
const [tahun, bulan, hari] = tanggal.split("-").map(Number);

return new Intl.DateTimeFormat("id-ID", {
weekday: "long",
day: "numeric",
month: "long",
year: "numeric",
timeZone: "UTC",
}).format(new Date(Date.UTC(tahun, bulan - 1, hari)));
}

function formatISODate(date: Date): string {
const tahun = date.getUTCFullYear();
const bulan = String(date.getUTCMonth() + 1).padStart(2, "0");
const hari = String(date.getUTCDate()).padStart(2, "0");

return `${tahun}-${bulan}-${hari}`;
}

function getPeriodeMingguan(tanggal: string): {
mulai: string;
selesai: string;
} {
const [tahun, bulan, hari] = tanggal.split("-").map(Number);

const date = new Date(Date.UTC(tahun, bulan - 1, hari));
const hariDalamMinggu = date.getUTCDay();

// Hari Minggu menjadi periode tersendiri.
if (hariDalamMinggu === 0) {
const tanggalMinggu = formatISODate(date);


return {
  mulai: tanggalMinggu,
  selesai: tanggalMinggu,
};


}

// Senin sampai Sabtu.
const awalMinggu = new Date(date);

awalMinggu.setUTCDate(
date.getUTCDate() - (hariDalamMinggu - 1)
);

const akhirMinggu = new Date(awalMinggu);

akhirMinggu.setUTCDate(
awalMinggu.getUTCDate() + 5
);

return {
mulai: formatISODate(awalMinggu),
selesai: formatISODate(akhirMinggu),
};
}

function getRingkasanMingguan(
dataRiwayat: RiwayatHarian[]
): RingkasanMingguan[] {
const kelompok = new Map<string, RingkasanMingguan>();

dataRiwayat.forEach((data) => {
const periode = getPeriodeMingguan(data.tanggal);
const key = periode.mulai;


if (!kelompok.has(key)) {
  kelompok.set(key, {
    mulai: periode.mulai,
    selesai: periode.selesai,
    modal: 0,
    modalTambahan: 0,
    saldoReal: 0,
    untung: 0,
    jumlahHari: 0,
  });
}

const ringkasan = kelompok.get(key)!;

ringkasan.modal += data.modal;
ringkasan.modalTambahan += data.modalTambahan;
ringkasan.saldoReal += data.saldoReal;
ringkasan.untung += data.untung;
ringkasan.jumlahHari += 1;


});

return Array.from(kelompok.values()).sort((a, b) =>
b.mulai.localeCompare(a.mulai)
);
}

export default function Page5() {
const [riwayat, setRiwayat] = useState<RiwayatHarian[]>([]);
const [tanggalTerpilih, setTanggalTerpilih] = useState<string | null>(null);
const [memuat, setMemuat] = useState(true);
const [pesan, setPesan] = useState("");
const [sedangExportExcel, setSedangExportExcel] = useState(false);
const [sedangExportSheets, setSedangExportSheets] = useState(false);
const [pesanExport, setPesanExport] = useState("");

const muatData = useCallback(async () => {
setMemuat(true);
setPesan("");


try {
  // Ambil semua saldo real harian.
  const {
    data: dataSaldoReal,
    error: errorSaldoReal,
  } = await supabase
    .from("daily_reports")
    .select("tanggal, saldo_real")
    .order("tanggal", { ascending: false });

  if (errorSaldoReal) throw errorSaldoReal;

  // Ambil semua modal harian.
  const {
    data: dataModal,
    error: errorModal,
  } = await supabase
    .from("daily_capitals")
    .select("tanggal, modal")
    .order("tanggal", { ascending: false });

  if (errorModal) throw errorModal;

  // Ambil semua modal tambahan mingguan.
  const {
    data: dataModalMingguan,
    error: errorModalMingguan,
  } = await supabase
    .from("weekly_capitals")
    .select("tanggal_mulai, tanggal_selesai, modal_tambahan");

  if (errorModalMingguan) throw errorModalMingguan;

  const daftarSaldoReal = (dataSaldoReal ?? []) as SaldoRealDB[];
  const daftarModal = (dataModal ?? []) as ModalHarianDB[];

  const daftarModalMingguan = (
    dataModalMingguan ?? []
  ) as ModalMingguanDB[];

  // Gabungkan seluruh tanggal yang memiliki data saldo real atau modal.
  const semuaTanggal = new Set<string>();

  daftarSaldoReal.forEach((item) => {
    semuaTanggal.add(item.tanggal.slice(0, 10));
  });

  daftarModal.forEach((item) => {
    semuaTanggal.add(item.tanggal.slice(0, 10));
  });

  // Siapkan lookup modal berdasarkan tanggal.
  const modalPerTanggal = new Map<string, number>();

  daftarModal.forEach((item) => {
    const tanggal = item.tanggal.slice(0, 10);

    modalPerTanggal.set(
      tanggal,
      (modalPerTanggal.get(tanggal) ?? 0) +
        Number(item.modal ?? 0)
    );
  });

  // Siapkan lookup saldo real berdasarkan tanggal.
  const saldoRealPerTanggal = new Map<string, number>();

  daftarSaldoReal.forEach((item) => {
    const tanggal = item.tanggal.slice(0, 10);

    saldoRealPerTanggal.set(
      tanggal,
      (saldoRealPerTanggal.get(tanggal) ?? 0) +
        Number(item.saldo_real ?? 0)
    );
  });

  // Modal tambahan mingguan hanya ditampilkan pada hari pertama
  // periode agar tidak dihitung berulang dalam total.
  const modalTambahanPerTanggal = new Map<string, number>();

  daftarModalMingguan.forEach((item) => {
    const mulai = item.tanggal_mulai.slice(0, 10);

    modalTambahanPerTanggal.set(
      mulai,
      (modalTambahanPerTanggal.get(mulai) ?? 0) +
        Number(item.modal_tambahan ?? 0)
    );
  });

  // Susun riwayat harian dari data Supabase.
  const hasil: RiwayatHarian[] = Array.from(semuaTanggal)
    .sort((a, b) => b.localeCompare(a))
    .map((tanggal) => {
      const modal = modalPerTanggal.get(tanggal) ?? 0;

      const saldoReal =
        saldoRealPerTanggal.get(tanggal) ?? 0;

      const modalTambahan =
        modalTambahanPerTanggal.get(tanggal) ?? 0;

      return {
        tanggal,
        modal,
        modalTambahan,
        saldoReal,
        untung: saldoReal - modal - modalTambahan,
      };
    });

  setRiwayat(hasil);
} catch (error) {
  console.error("Gagal memuat riwayat keuangan:", error);

  setPesan(
    error instanceof Error
      ? error.message
      : "Terjadi kesalahan saat memuat riwayat keuangan."
  );
} finally {
  setMemuat(false);
}


}, []);

useEffect(() => {
void muatData();
}, [muatData]);

const dataTerpilih = riwayat.find(
(data) => data.tanggal === tanggalTerpilih
);

const riwayatTerurut = useMemo(
() =>
[...riwayat].sort((a, b) =>
b.tanggal.localeCompare(a.tanggal)
),
[riwayat]
);

const ringkasanMingguan = useMemo(
() => getRingkasanMingguan(riwayat),
[riwayat]
);

const total = useMemo(
() =>
riwayat.reduce(
(hasil, data) => ({
modal: hasil.modal + data.modal,
modalTambahan:
hasil.modalTambahan + data.modalTambahan,
saldoReal: hasil.saldoReal + data.saldoReal,
untung: hasil.untung + data.untung,
}),
{
modal: 0,
modalTambahan: 0,
saldoReal: 0,
untung: 0,
}
),
[riwayat]
);

// Siapkan data yang sama untuk Excel dan Google Sheets.
function buatDataExport() {
  const dataHarian = riwayatTerurut.map((data) => ({
    Tanggal: data.tanggal,
    "Modal Harian": data.modal,
    "Modal Tambahan Mingguan": data.modalTambahan,
    "Saldo Real": data.saldoReal,
    Untung: data.untung,
  }));
  const dataMingguan = ringkasanMingguan.map((minggu) => ({
    "Tanggal Mulai": minggu.mulai,
    "Tanggal Selesai": minggu.selesai,
    "Jumlah Hari": minggu.jumlahHari,
    "Total Modal Harian": minggu.modal,
    "Total Modal Tambahan": minggu.modalTambahan,
    "Total Saldo Real": minggu.saldoReal,
    "Total Untung": minggu.untung,
  }));
  const dataTotal = [
    { Keterangan: "Total Modal Harian", Nominal: total.modal },
    { Keterangan: "Total Modal Tambahan", Nominal: total.modalTambahan },
    { Keterangan: "Total Saldo Real", Nominal: total.saldoReal },
    { Keterangan: "Total Untung", Nominal: total.untung },
  ];
  return { dataHarian, dataMingguan, dataTotal };
}

function exportExcel() {
  if (memuat || riwayat.length === 0) {
    setPesanExport("Tidak ada data untuk diekspor.");
    return;
  }
  setSedangExportExcel(true);
  setPesanExport("");
  try {
    const { dataHarian, dataMingguan, dataTotal } = buatDataExport();
    const workbook = XLSX.utils.book_new();
    const sheetHarian = XLSX.utils.json_to_sheet(dataHarian);
    const sheetMingguan = XLSX.utils.json_to_sheet(dataMingguan);
    const sheetTotal = XLSX.utils.json_to_sheet(dataTotal);
    sheetHarian["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 28 }, { wch: 20 }, { wch: 18 }];
    sheetMingguan["!cols"] = [{ wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 24 }, { wch: 22 }, { wch: 18 }];
    sheetTotal["!cols"] = [{ wch: 28 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(workbook, sheetHarian, "Riwayat Harian");
    XLSX.utils.book_append_sheet(workbook, sheetMingguan, "Ringkasan Mingguan");
    XLSX.utils.book_append_sheet(workbook, sheetTotal, "Total Akumulasi");
    const tanggalHariIni = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Riwayat_Keuangan_Page5_${tanggalHariIni}.xlsx`);
    setPesanExport("Export Excel berhasil.");
  } catch (error) {
    console.error("Export Excel gagal:", error);
    setPesanExport("Gagal mengekspor data ke Excel.");
  } finally {
    setSedangExportExcel(false);
  }
}

async function exportGoogleSheets() {
  if (memuat || riwayat.length === 0) {
    setPesanExport("Tidak ada data untuk diekspor.");
    return;
  }
  setSedangExportSheets(true);
  setPesanExport("");
  try {
    const { dataHarian, dataMingguan, dataTotal } = buatDataExport();
    const response = await fetch("/api/export-page5-google-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataHarian, dataMingguan, dataTotal }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Gagal mengekspor ke Google Sheets.");
    }
    setPesanExport("Export Google Sheets berhasil. Riwayat harian, ringkasan mingguan, dan total akumulasi telah diperbarui.");
  } catch (error) {
    console.error("Export Google Sheets gagal:", error);
    setPesanExport(error instanceof Error ? error.message : "Gagal mengekspor data ke Google Sheets.");
  } finally {
    setSedangExportSheets(false);
  }
}

return ( <div className="w-full space-y-6">
{/* Judul halaman */} <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"> <div> <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
Riwayat Modal dan Saldo Real </h2>


      <p className="mt-1 text-sm text-gray-500">
        Lihat riwayat harian dan ringkasan saldo real setiap minggu.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void muatData()} disabled={memuat || sedangExportExcel || sedangExportSheets} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
        {memuat ? "Memuat..." : "Muat Ulang"}
      </button>
      <button type="button" onClick={exportExcel} disabled={memuat || riwayat.length === 0 || sedangExportExcel || sedangExportSheets} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50">
        {sedangExportExcel ? "Mengekspor..." : "Export Excel"}
      </button>
      <button type="button" onClick={() => void exportGoogleSheets()} disabled={memuat || riwayat.length === 0 || sedangExportExcel || sedangExportSheets} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
        {sedangExportSheets ? "Mengekspor..." : "Export Google Sheets"}
      </button>
    </div>
  </div>

  {pesanExport && (
    <div role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
      {pesanExport}
    </div>
  )}

  {pesan && (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      Gagal memuat data: {pesan}
    </div>
  )}

  {/* Daftar riwayat harian */}
  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="border-b border-gray-200 px-4 py-4 sm:px-5">
      <h3 className="font-semibold text-gray-800">
        Riwayat Harian
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {memuat
          ? "Memuat data..."
          : `${riwayatTerurut.length} tanggal tercatat`}
      </p>
    </div>

    {memuat ? (
      <p className="p-6 text-center text-sm text-gray-500">
        Sedang mengambil data dari Supabase...
      </p>
    ) : riwayatTerurut.length > 0 ? (
      <div className="divide-y divide-gray-100">
        {riwayatTerurut.map((data) => {
          const terpilih = tanggalTerpilih === data.tanggal;

          return (
            <button
              key={data.tanggal}
              type="button"
              onClick={() =>
                setTanggalTerpilih(
                  terpilih ? null : data.tanggal
                )
              }
              aria-expanded={terpilih}
              className={`flex min-h-16 w-full items-center justify-between gap-3 px-4 py-4 text-left transition sm:px-5 ${
                terpilih ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-800">
                  {formatHariTanggal(data.tanggal)}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Modal: {formatRupiah(data.modal)}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {formatRupiah(data.saldoReal)}
                </p>

                <p
                  className={`mt-1 text-xs ${
                    data.untung >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  Untung: {formatRupiah(data.untung)}
                </p>
              </div>

              <span
                className="text-gray-400"
                aria-hidden="true"
              >
                {terpilih ? "▲" : "▼"}
              </span>
            </button>
          );
        })}
      </div>
    ) : (
      <p className="p-6 text-center text-sm text-gray-500">
        Belum ada riwayat modal dan saldo real.
      </p>
    )}
  </section>

  {/* Rincian tanggal terpilih */}
  {dataTerpilih && (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-5">
        <h3 className="font-bold text-gray-800">
          Rincian Riwayat
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {formatHariTanggal(dataTerpilih.tanggal)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                Keterangan
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Nominal
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-4 py-3 text-gray-700">
                Modal Harian
              </td>

              <td className="px-4 py-3 text-right text-gray-800">
                {formatRupiah(dataTerpilih.modal)}
              </td>
            </tr>

            <tr>
              <td className="px-4 py-3 text-gray-700">
                Modal Tambahan Mingguan
              </td>

              <td className="px-4 py-3 text-right text-gray-800">
                {formatRupiah(dataTerpilih.modalTambahan)}
              </td>
            </tr>

            <tr>
              <td className="px-4 py-3 text-gray-700">
                Saldo Real
              </td>

              <td className="px-4 py-3 text-right text-gray-800">
                {formatRupiah(dataTerpilih.saldoReal)}
              </td>
            </tr>

            <tr>
              <td className="px-4 py-3 font-medium text-green-700">
                Untung
              </td>

              <td
                className={`px-4 py-3 text-right font-semibold ${
                  dataTerpilih.untung >= 0
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {formatRupiah(dataTerpilih.untung)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 border-t border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-500">
            Total Modal
          </p>

          <p className="mt-2 break-words font-bold text-gray-800">
            {formatRupiah(
              dataTerpilih.modal +
                dataTerpilih.modalTambahan
            )}
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            Total Saldo Real
          </p>

          <p className="mt-2 break-words font-bold text-blue-800">
            {formatRupiah(dataTerpilih.saldoReal)}
          </p>
        </div>

        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-700">
            Total Untung
          </p>

          <p
            className={`mt-2 break-words font-bold ${
              dataTerpilih.untung >= 0
                ? "text-green-800"
                : "text-red-800"
            }`}
          >
            {formatRupiah(dataTerpilih.untung)}
          </p>
        </div>
      </div>
    </section>
  )}

  {/* Ringkasan riwayat mingguan */}
  <section className="space-y-4">
    <div>
      <h3 className="font-semibold text-gray-800">
        Ringkasan Riwayat Mingguan
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Rekap riwayat berdasarkan minggu, dari Senin sampai Sabtu.
        Hari Minggu dikelompokkan terpisah.
      </p>
    </div>

    {memuat ? (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">
          Memuat ringkasan mingguan...
        </p>
      </div>
    ) : ringkasanMingguan.length > 0 ? (
      <div className="space-y-4">
        {ringkasanMingguan.map((minggu) => {
          const hariMinggu = minggu.mulai === minggu.selesai;

          return (
            <div
              key={minggu.mulai}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-5">
                <h4 className="font-semibold text-gray-800">
                  {hariMinggu
                    ? `Rekap Hari Minggu, ${formatTanggal(
                        minggu.mulai
                      )}`
                    : `Minggu ${formatTanggal(minggu.mulai)}`}
                </h4>

                {!hariMinggu && (
                  <p className="mt-1 text-sm text-gray-500">
                    Senin – Sabtu, berakhir{" "}
                    {formatTanggal(minggu.selesai)}
                  </p>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  {minggu.jumlahHari} hari tercatat
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Total Modal Harian
                  </p>

                  <p className="mt-2 break-words font-bold text-gray-800">
                    {formatRupiah(minggu.modal)}
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    Total Modal Tambahan
                  </p>

                  <p className="mt-2 break-words font-bold text-blue-800">
                    {formatRupiah(minggu.modalTambahan)}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Total Saldo Real
                  </p>

                  <p className="mt-2 break-words font-bold text-gray-800">
                    {formatRupiah(minggu.saldoReal)}
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    Total Untung
                  </p>

                  <p
                    className={`mt-2 break-words font-bold ${
                      minggu.untung >= 0
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {formatRupiah(minggu.untung)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">
          Belum ada riwayat untuk diringkas.
        </p>
      </div>
    )}
  </section>

  {/* Total akumulasi seluruh riwayat */}
  <section className="space-y-3">
    <div>
      <h3 className="font-semibold text-gray-800">
        Total Akumulasi Seluruh Riwayat
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Total dari seluruh tanggal yang tercatat.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">
          Total Modal Harian
        </p>

        <p className="mt-2 break-words text-lg font-bold text-gray-800">
          {formatRupiah(total.modal)}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">
          Total Modal Tambahan
        </p>

        <p className="mt-2 break-words text-lg font-bold text-blue-700">
          {formatRupiah(total.modalTambahan)}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">
          Total Saldo Real
        </p>

        <p className="mt-2 break-words text-lg font-bold text-gray-800">
          {formatRupiah(total.saldoReal)}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">
          Total Untung
        </p>

        <p
          className={`mt-2 break-words text-lg font-bold ${
            total.untung >= 0
              ? "text-green-700"
              : "text-red-700"
          }`}
        >
          {formatRupiah(total.untung)}
        </p>
      </div>
    </div>
  </section>

  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
    <p className="text-sm leading-6 text-blue-800">
      <span className="font-semibold">Catatan:</span>{" "}
      Data riwayat diambil langsung dari Supabase. Modal harian
      berasal dari tabel daily_capitals, saldo real dari kolom
      saldo_real pada tabel daily_reports, dan modal tambahan dari
      tabel weekly_capitals. Hari Minggu ditampilkan terpisah dari
      periode Senin–Sabtu.
    </p>
  </div>
</div>


);
}
