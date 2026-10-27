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

function getPeriodeMingguan(
  tanggal: string
): {
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

type KartuNominalProps = {
  judul: string;
  nilai: number;
  warna?: string;
  latar?: string;
};

function KartuNominal({
  judul,
  nilai,
  warna = "text-gray-900",
  latar = "bg-white",
}: KartuNominalProps) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-gray-200 ${latar} p-3 shadow-sm sm:p-4`}
    >
      <p className="text-xs leading-5 text-gray-500 sm:text-sm">
        {judul}
      </p>

      <p
        className={`mt-2 break-words text-base font-bold leading-6 sm:text-lg ${warna}`}
      >
        {formatRupiah(nilai)}
      </p>
    </div>
  );
}

type BarisNominalProps = {
  judul: string;
  nilai: number;
  warna?: string;
};

function BarisNominal({
  judul,
  nilai,
  warna = "text-gray-900",
}: BarisNominalProps) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 py-3">
      <p className="min-w-0 flex-1 text-sm leading-5 text-gray-600">
        {judul}
      </p>

      <p
        className={`max-w-[60%] shrink-0 break-words text-right text-sm font-semibold sm:max-w-none ${warna}`}
      >
        {formatRupiah(nilai)}
      </p>
    </div>
  );
}

export default function Page5() {
  const [riwayat, setRiwayat] = useState<RiwayatHarian[]>([]);
  const [tanggalTerpilih, setTanggalTerpilih] = useState<string | null>(
    null
  );
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
        .select(
          "tanggal_mulai, tanggal_selesai, modal_tambahan"
        );

      if (errorModalMingguan) throw errorModalMingguan;

      const daftarSaldoReal = (dataSaldoReal ?? []) as SaldoRealDB[];
      const daftarModal = (dataModal ?? []) as ModalHarianDB[];
      const daftarModalMingguan = (
        dataModalMingguan ?? []
      ) as ModalMingguanDB[];

      // Gabungkan seluruh tanggal yang memiliki data.
      const semuaTanggal = new Set<string>();

      daftarSaldoReal.forEach((item) => {
        semuaTanggal.add(item.tanggal.slice(0, 10));
      });

      daftarModal.forEach((item) => {
        semuaTanggal.add(item.tanggal.slice(0, 10));
      });

      // Modal harian berdasarkan tanggal.
      const modalPerTanggal = new Map<string, number>();

      daftarModal.forEach((item) => {
        const tanggal = item.tanggal.slice(0, 10);

        modalPerTanggal.set(
          tanggal,
          (modalPerTanggal.get(tanggal) ?? 0) +
            Number(item.modal ?? 0)
        );
      });

      // Saldo real berdasarkan tanggal.
      const saldoRealPerTanggal = new Map<string, number>();

      daftarSaldoReal.forEach((item) => {
        const tanggal = item.tanggal.slice(0, 10);

        saldoRealPerTanggal.set(
          tanggal,
          (saldoRealPerTanggal.get(tanggal) ?? 0) +
            Number(item.saldo_real ?? 0)
        );
      });

      // Modal tambahan mingguan hanya dicatat pada hari pertama periode.
      const modalTambahanPerTanggal = new Map<string, number>();

      daftarModalMingguan.forEach((item) => {
        const mulai = item.tanggal_mulai.slice(0, 10);

        modalTambahanPerTanggal.set(
          mulai,
          (modalTambahanPerTanggal.get(mulai) ?? 0) +
            Number(item.modal_tambahan ?? 0)
        );
      });

      // Susun riwayat harian.
      const hasil: RiwayatHarian[] = Array.from(semuaTanggal)
        .sort((a, b) => b.localeCompare(a))
        .map((tanggal) => {
          const modal = modalPerTanggal.get(tanggal) ?? 0;
          const saldoReal = saldoRealPerTanggal.get(tanggal) ?? 0;
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

      // Tutup rincian apabila tanggalnya tidak lagi tersedia.
      setTanggalTerpilih((tanggalSebelumnya) =>
        tanggalSebelumnya &&
        hasil.some((item) => item.tanggal === tanggalSebelumnya)
          ? tanggalSebelumnya
          : null
      );
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
      {
        Keterangan: "Total Modal Tambahan",
        Nominal: total.modalTambahan,
      },
      {
        Keterangan: "Total Saldo Real",
        Nominal: total.saldoReal,
      },
      { Keterangan: "Total Untung", Nominal: total.untung },
    ];

    return { dataHarian, dataMingguan, dataTotal };
  }

  function exportExcel() {
    if (
      memuat ||
      riwayat.length === 0 ||
      sedangExportExcel ||
      sedangExportSheets
    ) {
      if (!memuat && riwayat.length === 0) {
        setPesanExport("Tidak ada data untuk diekspor.");
      }

      return;
    }

    setSedangExportExcel(true);
    setPesanExport("");

    try {
      const { dataHarian, dataMingguan, dataTotal } =
        buatDataExport();

      const workbook = XLSX.utils.book_new();

      const sheetHarian = XLSX.utils.json_to_sheet(dataHarian);
      const sheetMingguan = XLSX.utils.json_to_sheet(dataMingguan);
      const sheetTotal = XLSX.utils.json_to_sheet(dataTotal);

      sheetHarian["!cols"] = [
        { wch: 14 },
        { wch: 20 },
        { wch: 28 },
        { wch: 20 },
        { wch: 18 },
      ];

      sheetMingguan["!cols"] = [
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 22 },
        { wch: 24 },
        { wch: 22 },
        { wch: 18 },
      ];

      sheetTotal["!cols"] = [
        { wch: 28 },
        { wch: 22 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        sheetHarian,
        "Riwayat Harian"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        sheetMingguan,
        "Ringkasan Mingguan"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        sheetTotal,
        "Total Akumulasi"
      );

      // Gunakan tanggal lokal agar tidak bergeser karena zona waktu.
      const sekarang = new Date();
      const tahun = sekarang.getFullYear();
      const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
      const hari = String(sekarang.getDate()).padStart(2, "0");
      const tanggalHariIni = `${tahun}-${bulan}-${hari}`;

      XLSX.writeFile(
        workbook,
        `Riwayat_Keuangan_Page5_${tanggalHariIni}.xlsx`
      );

      setPesanExport("Export Excel berhasil.");
    } catch (error) {
      console.error("Export Excel gagal:", error);
      setPesanExport("Gagal mengekspor data ke Excel.");
    } finally {
      setSedangExportExcel(false);
    }
  }

  async function exportGoogleSheets() {
    if (
      memuat ||
      riwayat.length === 0 ||
      sedangExportExcel ||
      sedangExportSheets
    ) {
      if (!memuat && riwayat.length === 0) {
        setPesanExport("Tidak ada data untuk diekspor.");
      }

      return;
    }

    setSedangExportSheets(true);
    setPesanExport("");

    try {
      const { dataHarian, dataMingguan, dataTotal } =
        buatDataExport();

      const response = await fetch(
        "/api/export-page5-google-sheets",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataHarian,
            dataMingguan,
            dataTotal,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengekspor ke Google Sheets."
        );
      }

      setPesanExport(
        "Export Google Sheets berhasil. Riwayat harian, ringkasan mingguan, dan total akumulasi telah diperbarui."
      );
    } catch (error) {
      console.error("Export Google Sheets gagal:", error);

      setPesanExport(
        error instanceof Error
          ? error.message
          : "Gagal mengekspor data ke Google Sheets."
      );
    } finally {
      setSedangExportSheets(false);
    }
  }

  const sedangEkspor = sedangExportExcel || sedangExportSheets;

  return (
    <main className="w-full min-w-0 space-y-5 overflow-x-clip pb-6 sm:space-y-6">
      {/* Header halaman */}
      <header className="space-y-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
            Riwayat Modal dan Saldo Real
          </h1>

          <p className="text-sm leading-6 text-gray-500">
            Lihat riwayat harian dan ringkasan saldo real setiap
            minggu.
          </p>
        </div>

        {/* Tombol dibuat besar dan penuh di Android */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <button
            type="button"
            onClick={() => void muatData()}
            disabled={memuat || sedangEkspor}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {memuat ? "Memuat..." : "Muat Ulang"}
          </button>

          <button
            type="button"
            onClick={exportExcel}
            disabled={memuat || riwayat.length === 0 || sedangEkspor}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sedangExportExcel ? "Mengekspor..." : "Export Excel"}
          </button>

          <button
            type="button"
            onClick={() => void exportGoogleSheets()}
            disabled={memuat || riwayat.length === 0 || sedangEkspor}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sedangExportSheets
              ? "Mengekspor..."
              : "Export Google Sheets"}
          </button>
        </div>
      </header>

      {/* Pesan export */}
      {pesanExport && (
        <div
          role="status"
          className="break-words rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-800"
        >
          {pesanExport}
        </div>
      )}

      {/* Pesan error */}
      {pesan && (
        <div
          role="alert"
          className="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
        >
          <p className="font-semibold">Gagal memuat data</p>
          <p className="mt-1">{pesan}</p>

          <button
            type="button"
            onClick={() => void muatData()}
            disabled={memuat}
            className="mt-3 min-h-10 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Daftar riwayat harian */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
          <h2 className="font-bold text-gray-900">
            Riwayat Harian
          </h2>

          <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
            {memuat
              ? "Memuat data..."
              : `${riwayatTerurut.length} tanggal tercatat`}
          </p>
        </div>

        {memuat ? (
          <div className="p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-3 text-sm text-gray-500">
              Sedang mengambil data dari Supabase...
            </p>
          </div>
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
                  className={`flex min-h-[88px] w-full min-w-0 items-center gap-3 px-3 py-4 text-left transition active:bg-blue-100 sm:px-5 ${
                    terpilih
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Ikon tanggal */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
                      terpilih
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    aria-hidden="true"
                  >
                    {terpilih ? "✓" : "▦"}
                  </div>

                  {/* Tanggal dan modal */}
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold leading-5 text-gray-900 sm:text-base">
                      {formatHariTanggal(data.tanggal)}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                      Modal: {formatRupiah(data.modal)}
                    </p>

                    {data.modalTambahan > 0 && (
                      <p className="mt-1 break-words text-xs text-blue-700">
                        Modal tambahan:{" "}
                        {formatRupiah(data.modalTambahan)}
                      </p>
                    )}
                  </div>

                  {/* Saldo dan keuntungan */}
                  <div className="min-w-0 max-w-[44%] shrink-0 text-right">
                    <p className="break-words text-sm font-bold leading-5 text-gray-900 sm:text-base">
                      {formatRupiah(data.saldoReal)}
                    </p>

                    <p
                      className={`mt-1 break-words text-xs font-semibold leading-5 sm:text-sm ${
                        data.untung >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {data.untung >= 0 ? "+" : ""}
                      {formatRupiah(data.untung)}
                    </p>
                  </div>

                  <span
                    className="shrink-0 text-xs text-gray-400"
                    aria-hidden="true"
                  >
                    {terpilih ? "▲" : "▼"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-gray-700">
              Belum ada riwayat keuangan
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Data akan muncul setelah tanggal memiliki data modal
              harian atau saldo real.
            </p>
          </div>
        )}
      </section>

      {/* Rincian tanggal terpilih */}
      {dataTerpilih && (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-gray-900">
                  Rincian Riwayat
                </h2>

                <p className="mt-1 break-words text-sm leading-5 text-gray-500">
                  {formatHariTanggal(dataTerpilih.tanggal)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTanggalTerpilih(null)}
                aria-label="Tutup rincian riwayat"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Daftar nominal tanpa tabel horizontal */}
          <div className="divide-y divide-gray-100 px-4 sm:px-5">
            <BarisNominal
              judul="Modal Harian"
              nilai={dataTerpilih.modal}
            />

            <BarisNominal
              judul="Modal Tambahan Mingguan"
              nilai={dataTerpilih.modalTambahan}
              warna="text-blue-700"
            />

            <BarisNominal
              judul="Saldo Real"
              nilai={dataTerpilih.saldoReal}
            />

            <BarisNominal
              judul="Untung"
              nilai={dataTerpilih.untung}
              warna={
                dataTerpilih.untung >= 0
                  ? "text-green-700"
                  : "text-red-700"
              }
            />
          </div>

          {/* Kartu ringkasan rincian */}
          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-gray-50/70 p-3 sm:grid-cols-3 sm:p-5">
            <KartuNominal
              judul="Total Modal"
              nilai={
                dataTerpilih.modal +
                dataTerpilih.modalTambahan
              }
              latar="bg-white"
            />

            <KartuNominal
              judul="Total Saldo Real"
              nilai={dataTerpilih.saldoReal}
              warna="text-blue-800"
              latar="bg-blue-50"
            />

            <KartuNominal
              judul="Total Untung"
              nilai={dataTerpilih.untung}
              warna={
                dataTerpilih.untung >= 0
                  ? "text-green-800"
                  : "text-red-800"
              }
              latar="bg-green-50"
            />
          </div>
        </section>
      )}

      {/* Ringkasan mingguan */}
      <section className="min-w-0 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Ringkasan Riwayat Mingguan
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Rekap riwayat berdasarkan minggu, dari Senin sampai
            Sabtu. Hari Minggu dikelompokkan terpisah.
          </p>
        </div>

        {memuat ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-sm text-gray-500">
              Memuat ringkasan mingguan...
            </p>
          </div>
        ) : ringkasanMingguan.length > 0 ? (
          <div className="space-y-3">
            {ringkasanMingguan.map((minggu) => {
              const hariMinggu = minggu.mulai === minggu.selesai;

              return (
                <article
                  key={minggu.mulai}
                  className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-4 sm:px-5">
                    <h3 className="break-words font-bold leading-6 text-gray-900">
                      {hariMinggu
                        ? `Rekap Hari Minggu, ${formatTanggal(
                            minggu.mulai
                          )}`
                        : `Minggu ${formatTanggal(minggu.mulai)}`}
                    </h3>

                    {!hariMinggu && (
                      <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                        Senin–Sabtu, berakhir{" "}
                        {formatTanggal(minggu.selesai)}
                      </p>
                    )}

                    <span className="mt-2 inline-flex rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {minggu.jumlahHari} hari tercatat
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
                    <KartuNominal
                      judul="Total Modal Harian"
                      nilai={minggu.modal}
                    />

                    <KartuNominal
                      judul="Total Modal Tambahan"
                      nilai={minggu.modalTambahan}
                      warna="text-blue-800"
                      latar="bg-blue-50"
                    />

                    <KartuNominal
                      judul="Total Saldo Real"
                      nilai={minggu.saldoReal}
                    />

                    <KartuNominal
                      judul="Total Untung"
                      nilai={minggu.untung}
                      warna={
                        minggu.untung >= 0
                          ? "text-green-800"
                          : "text-red-800"
                      }
                      latar="bg-green-50"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-sm text-gray-500">
              Belum ada riwayat untuk diringkas.
            </p>
          </div>
        )}
      </section>

      {/* Total akumulasi */}
      <section className="min-w-0 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Total Akumulasi Seluruh Riwayat
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Total dari seluruh tanggal yang tercatat.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KartuNominal
            judul="Total Modal Harian"
            nilai={total.modal}
          />

          <KartuNominal
            judul="Total Modal Tambahan"
            nilai={total.modalTambahan}
            warna="text-blue-800"
            latar="bg-blue-50"
          />

          <KartuNominal
            judul="Total Saldo Real"
            nilai={total.saldoReal}
          />

          <KartuNominal
            judul="Total Untung"
            nilai={total.untung}
            warna={
              total.untung >= 0
                ? "text-green-800"
                : "text-red-800"
            }
            latar="bg-green-50"
          />
        </div>
      </section>

      {/* Catatan */}
      <aside className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm leading-6 text-blue-800">
          <span className="font-semibold">Catatan:</span>{" "}
          Data riwayat diambil langsung dari Supabase. Modal harian
          berasal dari tabel{" "}
          <code className="break-all">daily_capitals</code>, saldo
          real dari kolom{" "}
          <code className="break-all">saldo_real</code> pada tabel{" "}
          <code className="break-all">daily_reports</code>, dan modal
          tambahan dari tabel{" "}
          <code className="break-all">weekly_capitals</code>. Hari
          Minggu ditampilkan terpisah dari periode Senin–Sabtu.
        </p>
      </aside>
    </main>
  );
}