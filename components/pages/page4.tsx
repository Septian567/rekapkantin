"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

function getTanggalLokal(): string {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const tanggal = String(sekarang.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${tanggal}`;
}

function formatTanggal(tanggal: string | Date): string {
  const date =
    typeof tanggal === "string"
      ? new Date(`${tanggal.slice(0, 10)}T12:00:00`)
      : tanggal;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatRupiah(nilai: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(nilai) || 0);
}

type RingkasanProps = {
  judul: string;
  nilai: number;
  warna?: string;
  latar?: string;
};

function Ringkasan({
  judul,
  nilai,
  warna = "text-gray-900",
  latar = "bg-white",
}: RingkasanProps) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-gray-200 ${latar} p-4 shadow-sm`}
    >
      <p className="break-words text-xs font-medium leading-5 text-gray-500 sm:text-sm">
        {judul}
      </p>

      <p
        className={`mt-2 break-words text-lg font-bold leading-snug sm:text-xl ${warna}`}
      >
        {formatRupiah(nilai)}
      </p>
    </div>
  );
}

type BarisMingguanProps = {
  judul: string;
  nilai: number;
  warna?: string;
  tebal?: boolean;
};

function BarisMingguan({
  judul,
  nilai,
  warna = "text-gray-900",
  tebal = false,
}: BarisMingguanProps) {
  return (
    <div
      className={`flex min-w-0 items-start justify-between gap-3 p-4 ${
        tebal ? "bg-gray-50" : "bg-white"
      }`}
    >
      <p
        className={`min-w-0 flex-1 break-words text-sm leading-5 ${
          tebal ? "font-bold text-gray-900" : "text-gray-600"
        }`}
      >
        {judul}
      </p>

      <p
        className={`max-w-[58%] shrink-0 break-words text-right text-sm sm:text-base ${
          tebal ? "font-bold" : "font-semibold"
        } ${warna}`}
      >
        {formatRupiah(nilai)}
      </p>
    </div>
  );
}

export default function Page4() {
  const [tanggalHariIni, setTanggalHariIni] = useState(getTanggalLokal());

  const [modalHarian, setModalHarian] = useState(0);
  const [modalTambahan, setModalTambahan] = useState(0);
  const [saldoRealHarian, setSaldoRealHarian] = useState(0);
  const [totalModalMingguan, setTotalModalMingguan] = useState(0);
  const [totalSaldoRealMingguan, setTotalSaldoRealMingguan] = useState(0);

  const [memuat, setMemuat] = useState(false);
  const [menyimpanHarian, setMenyimpanHarian] = useState(false);
  const [menyimpanMingguan, setMenyimpanMingguan] = useState(false);
  const [pesan, setPesan] = useState("");

  const {
    tanggalSenin,
    tanggalSabtu,
    tanggalMulai,
    tanggalSelesai,
  } = useMemo(() => {
    const tanggal = new Date(`${tanggalHariIni}T12:00:00`);
    const hari = tanggal.getDay();

    // Minggu = 0, Senin = 1, ..., Sabtu = 6.
    const selisihKeSenin = hari === 0 ? -6 : 1 - hari;

    const senin = new Date(tanggal);
    senin.setDate(tanggal.getDate() + selisihKeSenin);

    const sabtu = new Date(senin);
    sabtu.setDate(senin.getDate() + 5);

    const keFormatTanggal = (date: Date) => {
      const tahun = date.getFullYear();
      const bulan = String(date.getMonth() + 1).padStart(2, "0");
      const hariTanggal = String(date.getDate()).padStart(2, "0");

      return `${tahun}-${bulan}-${hariTanggal}`;
    };

    return {
      tanggalSenin: keFormatTanggal(senin),
      tanggalSabtu: keFormatTanggal(sabtu),
      tanggalMulai: keFormatTanggal(senin),
      tanggalSelesai: keFormatTanggal(sabtu),
    };
  }, [tanggalHariIni]);

  const muatData = useCallback(async () => {
    setMemuat(true);
    setPesan("");

    try {
      // Saldo real harian.
      const { data: dataSaldoHarian, error: errorSaldoHarian } =
        await supabase
          .from("daily_reports")
          .select("saldo_real")
          .eq("tanggal", tanggalHariIni);

      if (errorSaldoHarian) throw errorSaldoHarian;

      const saldoHarian = (dataSaldoHarian ?? []).reduce(
        (total, item) => total + Number(item.saldo_real ?? 0),
        0
      );

      setSaldoRealHarian(saldoHarian);

      // Modal harian.
      const { data: dataModalHarian, error: errorModalHarian } =
        await supabase
          .from("daily_capitals")
          .select("modal")
          .eq("tanggal", tanggalHariIni)
          .maybeSingle();

      if (errorModalHarian) throw errorModalHarian;

      setModalHarian(Number(dataModalHarian?.modal ?? 0));

      // Total modal harian dari Senin sampai Sabtu.
      const { data: dataModalMingguan, error: errorModalMingguan } =
        await supabase
          .from("daily_capitals")
          .select("modal")
          .gte("tanggal", tanggalMulai)
          .lte("tanggal", tanggalSelesai);

      if (errorModalMingguan) throw errorModalMingguan;

      const totalModal = (dataModalMingguan ?? []).reduce(
        (total, item) => total + Number(item.modal ?? 0),
        0
      );

      setTotalModalMingguan(totalModal);

      // Total saldo real dari Senin sampai Sabtu.
      const { data: dataSaldoMingguan, error: errorSaldoMingguan } =
        await supabase
          .from("daily_reports")
          .select("saldo_real")
          .gte("tanggal", tanggalMulai)
          .lte("tanggal", tanggalSelesai);

      if (errorSaldoMingguan) throw errorSaldoMingguan;

      const totalSaldo = (dataSaldoMingguan ?? []).reduce(
        (total, item) => total + Number(item.saldo_real ?? 0),
        0
      );

      setTotalSaldoRealMingguan(totalSaldo);

      // Modal tambahan mingguan.
      const { data: dataModalTambahan, error: errorModalTambahan } =
        await supabase
          .from("weekly_capitals")
          .select("modal_tambahan")
          .eq("tanggal_mulai", tanggalMulai)
          .eq("tanggal_selesai", tanggalSelesai)
          .maybeSingle();

      if (errorModalTambahan) throw errorModalTambahan;

      setModalTambahan(Number(dataModalTambahan?.modal_tambahan ?? 0));
    } catch (error) {
      console.error("Gagal memuat data rekap:", error);

      setPesan(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memuat data rekap."
      );
    } finally {
      setMemuat(false);
    }
  }, [tanggalHariIni, tanggalMulai, tanggalSelesai]);

  useEffect(() => {
    void muatData();
  }, [muatData]);

  async function simpanModalHarian() {
    if (!Number.isFinite(modalHarian) || modalHarian < 0) {
      await Swal.fire({
        icon: "warning",
        title: "Data Tidak Valid",
        text: "Modal harian harus berupa angka nol atau lebih.",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });

      return;
    }

    setMenyimpanHarian(true);

    Swal.fire({
      title: "Menyimpan Modal Harian...",
      text: "Mohon tunggu sebentar.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const { data, error } = await supabase
        .from("daily_capitals")
        .upsert(
          {
            tanggal: tanggalHariIni,
            modal: modalHarian,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "tanggal",
          }
        )
        .select("tanggal");

      if (error) throw error;

      if (!data?.length) {
        throw new Error(
          "Modal harian belum berhasil dikonfirmasi tersimpan. Periksa izin database."
        );
      }

      Swal.close();

      await muatData();

      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Modal harian tanggal ${formatTanggal(
          tanggalHariIni
        )} berhasil disimpan.`,
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });
    } catch (error) {
      console.error("Gagal menyimpan modal harian:", error);
      Swal.close();

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan modal harian.";

      await Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: errorMessage,
        confirmButtonText: "OK",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setMenyimpanHarian(false);
    }
  }

  async function simpanModalMingguan() {
    if (!Number.isFinite(modalTambahan) || modalTambahan < 0) {
      await Swal.fire({
        icon: "warning",
        title: "Data Tidak Valid",
        text: "Modal tambahan mingguan harus berupa angka nol atau lebih.",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });

      return;
    }

    setMenyimpanMingguan(true);

    Swal.fire({
      title: "Menyimpan Modal Mingguan...",
      text: "Mohon tunggu sebentar.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const { data, error } = await supabase
        .from("weekly_capitals")
        .upsert(
          {
            tanggal_mulai: tanggalMulai,
            tanggal_selesai: tanggalSelesai,
            modal_tambahan: modalTambahan,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "tanggal_mulai,tanggal_selesai",
          }
        )
        .select("tanggal_mulai");

      if (error) throw error;

      if (!data?.length) {
        throw new Error(
          "Modal tambahan mingguan belum berhasil dikonfirmasi tersimpan. Periksa izin database."
        );
      }

      Swal.close();

      await muatData();

      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Modal tambahan untuk periode ${formatTanggal(
          tanggalSenin
        )} – ${formatTanggal(tanggalSabtu)} berhasil disimpan.`,
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });
    } catch (error) {
      console.error("Gagal menyimpan modal mingguan:", error);
      Swal.close();

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan modal mingguan.";

      await Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: errorMessage,
        confirmButtonText: "OK",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setMenyimpanMingguan(false);
    }
  }

  const keuntunganHarian = saldoRealHarian - modalHarian;

  const keuntunganMingguan =
    totalSaldoRealMingguan - totalModalMingguan - modalTambahan;

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-gray-50 px-3 py-4 text-gray-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
        {/* Header */}
        <header className="flex min-w-0 flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
              Rekap Keuangan
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Ringkasan saldo real, modal, dan keuntungan usaha.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void muatData()}
            disabled={memuat}
            className="flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-gray-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {memuat ? "Memuat..." : "↻ Muat Ulang"}
          </button>
        </header>

        {/* Pilih tanggal */}
        <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <label
            htmlFor="tanggal-rekap"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Pilih Tanggal Rekap
          </label>

          <input
            id="tanggal-rekap"
            type="date"
            value={tanggalHariIni}
            onChange={(event) => setTanggalHariIni(event.target.value)}
            className="min-h-12 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-3 text-base text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
          />

          <div className="mt-3 rounded-lg bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-700">
              Tanggal yang dipilih
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-blue-900">
              {formatTanggal(tanggalHariIni)}
            </p>
          </div>
        </section>

        {/* Status error */}
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
              className="mt-3 min-h-10 rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Rekap harian */}
        <section className="min-w-0 space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:space-y-6 sm:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg">
                📊
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">
                  Rekap Harian
                </h2>

                <p className="mt-1 break-words text-sm text-gray-500">
                  Periode: {formatTanggal(tanggalHariIni)}
                </p>
              </div>
            </div>
          </div>

          {/* Kartu ringkasan harian */}
          <div className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3">
            <Ringkasan
              judul="Total Saldo Real Harian"
              nilai={saldoRealHarian}
              warna="text-blue-700"
              latar="bg-blue-50/50"
            />

            <Ringkasan
              judul="Modal Harian"
              nilai={modalHarian}
              warna="text-orange-600"
              latar="bg-orange-50/50"
            />

            <Ringkasan
              judul="Keuntungan Harian"
              nilai={keuntunganHarian}
              warna={
                keuntunganHarian >= 0 ? "text-green-600" : "text-red-600"
              }
              latar={
                keuntunganHarian >= 0 ? "bg-green-50/50" : "bg-red-50/50"
              }
            />
          </div>

          {/* Form modal harian */}
          <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-bold text-gray-900">
                Atur Modal Harian
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Masukkan jumlah modal untuk tanggal yang dipilih.
              </p>
            </div>

            <label
              htmlFor="modal-harian"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Modal Harian (Rp)
            </label>

            <div className="min-w-0">
              <input
                id="modal-harian"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={modalHarian}
                onChange={(event) =>
                  setModalHarian(
                    event.target.value === ""
                      ? 0
                      : Number(event.target.value)
                  )
                }
                className="min-h-12 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Masukkan modal harian"
              />
            </div>

            <button
              type="button"
              onClick={() => void simpanModalHarian()}
              disabled={menyimpanHarian || menyimpanMingguan || memuat}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-48"
            >
              {menyimpanHarian ? "Menyimpan..." : "Simpan Modal Harian"}
            </button>
          </div>
        </section>

        {/* Rekap mingguan */}
        <section className="min-w-0 space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:space-y-6 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg">
              📅
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900">
                Rekap Mingguan
              </h2>

              <p className="mt-1 break-words text-sm leading-6 text-gray-500">
                Periode {formatTanggal(tanggalSenin)} sampai{" "}
                {formatTanggal(tanggalSabtu)}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Perhitungan dari Senin hingga Sabtu.
              </p>
            </div>
          </div>

          {/* Ringkasan mingguan */}
          <div className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            <Ringkasan
              judul="Total Saldo Real Mingguan"
              nilai={totalSaldoRealMingguan}
              warna="text-blue-700"
              latar="bg-blue-50/50"
            />

            <Ringkasan
              judul="Total Modal Harian"
              nilai={totalModalMingguan}
              warna="text-orange-600"
              latar="bg-orange-50/50"
            />
          </div>

          {/* Detail mingguan: kartu untuk Android */}
          <div className="overflow-hidden rounded-xl border border-gray-200 sm:hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-800">
                Rincian Keuangan Mingguan
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              <BarisMingguan
                judul="Total Saldo Real Mingguan"
                nilai={totalSaldoRealMingguan}
                warna="text-blue-700"
              />

              <BarisMingguan
                judul="Total Modal Harian"
                nilai={totalModalMingguan}
                warna="text-orange-600"
              />

              <BarisMingguan
                judul="Modal Tambahan Mingguan"
                nilai={modalTambahan}
                warna="text-orange-600"
              />

              <BarisMingguan
                judul="Keuntungan Mingguan"
                nilai={keuntunganMingguan}
                warna={
                  keuntunganMingguan >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
                tebal
              />
            </div>
          </div>

          {/* Tabel untuk tablet dan desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 sm:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-4 text-sm font-semibold text-gray-700">
                    Keterangan
                  </th>

                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    Jumlah
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    Total Saldo Real Mingguan
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-semibold text-blue-700">
                    {formatRupiah(totalSaldoRealMingguan)}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    Total Modal Harian
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-semibold text-orange-600">
                    {formatRupiah(totalModalMingguan)}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    Modal Tambahan Mingguan
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-semibold text-orange-600">
                    {formatRupiah(modalTambahan)}
                  </td>
                </tr>

                <tr className="bg-gray-50">
                  <td className="px-4 py-4 text-sm font-bold text-gray-900">
                    Keuntungan Mingguan
                  </td>

                  <td
                    className={`px-4 py-4 text-right text-sm font-bold ${
                      keuntunganMingguan >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatRupiah(keuntunganMingguan)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Form modal tambahan mingguan */}
          <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-bold text-gray-900">
                Atur Modal Tambahan Mingguan
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Modal tambahan untuk periode {formatTanggal(tanggalSenin)} –{" "}
                {formatTanggal(tanggalSabtu)}.
              </p>
            </div>

            <label
              htmlFor="modal-tambahan"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Modal Tambahan Mingguan (Rp)
            </label>

            <input
              id="modal-tambahan"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={modalTambahan}
              onChange={(event) =>
                setModalTambahan(
                  event.target.value === ""
                    ? 0
                    : Number(event.target.value)
                )
              }
              className="min-h-12 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Masukkan modal tambahan mingguan"
            />

            <button
              type="button"
              onClick={() => void simpanModalMingguan()}
              disabled={menyimpanMingguan || menyimpanHarian || memuat}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-52"
            >
              {menyimpanMingguan
                ? "Menyimpan..."
                : "Simpan Modal Mingguan"}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-3 text-center text-xs leading-5 text-gray-400">
          Rekap keuangan usaha · Data diperbarui dari database.
        </footer>
      </div>
    </main>
  );
}
