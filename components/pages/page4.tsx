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
}).format(nilai);
}

type RingkasanProps = {
judul: string;
nilai: number;
warna?: string;
};

function Ringkasan({
judul,
nilai,
warna = "text-gray-900",
}: RingkasanProps) {
return ( <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"> <p className="text-sm text-gray-500">{judul}</p>
<p className={`mt-2 text-xl font-bold ${warna}`}>
{formatRupiah(nilai)} </p> </div>
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
  // Ambil saldo real untuk tanggal yang dipilih.
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

  // Ambil modal harian untuk tanggal yang dipilih.
  const { data: dataModalHarian, error: errorModalHarian } =
    await supabase
      .from("daily_capitals")
      .select("modal")
      .eq("tanggal", tanggalHariIni)
      .maybeSingle();

  if (errorModalHarian) throw errorModalHarian;

  setModalHarian(Number(dataModalHarian?.modal ?? 0));

  // Ambil total modal harian dari Senin sampai Sabtu.
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

  // Ambil total saldo real dari Senin sampai Sabtu.
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

  // Ambil modal tambahan mingguan.
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

return ( <div className="min-h-screen bg-gray-50 p-4 sm:p-6"> <div className="mx-auto max-w-6xl space-y-6">
{/* Header */} <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"> <div> <h1 className="text-2xl font-bold text-gray-900">
Rekap Keuangan </h1> <p className="mt-1 text-sm text-gray-500">
Ringkasan saldo real, modal, dan keuntungan usaha. </p> </div>


      <button
        type="button"
        onClick={() => void muatData()}
        disabled={memuat}
        className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {memuat ? "Memuat..." : "Muat Ulang"}
      </button>
    </div>

    {/* Pilih tanggal */}
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
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
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
      />

      <p className="mt-2 text-sm text-gray-500">
        Tanggal yang dipilih: {formatTanggal(tanggalHariIni)}
      </p>
    </section>

    {pesan && (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        Gagal memuat data: {pesan}
      </div>
    )}

    {/* Rekap harian */}
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Rekap Harian
        </h2>
        <p className="text-sm text-gray-500">
          Periode: {formatTanggal(tanggalHariIni)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Ringkasan
          judul="Total Saldo Real Harian"
          nilai={saldoRealHarian}
        />

        <Ringkasan
          judul="Modal Harian"
          nilai={modalHarian}
          warna="text-orange-600"
        />

        <Ringkasan
          judul="Keuntungan Harian"
          nilai={keuntunganHarian}
          warna={
            keuntunganHarian >= 0
              ? "text-green-600"
              : "text-red-600"
          }
        />
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <label
          htmlFor="modal-harian"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Modal Harian (Rp)
        </label>

        <input
          id="modal-harian"
          type="number"
          min="0"
          step="1"
          value={modalHarian}
          onChange={(event) =>
            setModalHarian(
              event.target.value === ""
                ? 0
                : Number(event.target.value)
            )
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Masukkan modal harian"
        />

        <button
          type="button"
          onClick={() => void simpanModalHarian()}
          disabled={menyimpanHarian || memuat}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {menyimpanHarian
            ? "Menyimpan..."
            : "Simpan Modal Harian"}
        </button>
      </div>
    </section>

    {/* Rekap mingguan */}
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Rekap Mingguan
        </h2>

        <p className="text-sm text-gray-500">
          Periode {formatTanggal(tanggalSenin)} sampai{" "}
          {formatTanggal(tanggalSabtu)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Keterangan
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Jumlah
              </th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-sm text-gray-600">
                Total Saldo Real Mingguan
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                {formatRupiah(totalSaldoRealMingguan)}
              </td>
            </tr>

            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-sm text-gray-600">
                Total Modal Harian
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-orange-600">
                {formatRupiah(totalModalMingguan)}
              </td>
            </tr>

            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-sm text-gray-600">
                Modal Tambahan Mingguan
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-orange-600">
                {formatRupiah(modalTambahan)}
              </td>
            </tr>

            <tr className="bg-gray-50">
              <td className="px-4 py-3 text-sm font-bold text-gray-900">
                Keuntungan Mingguan
              </td>
              <td
                className={`px-4 py-3 text-right text-sm font-bold ${
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

      <div className="rounded-lg border border-gray-200 p-4">
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
          value={modalTambahan}
          onChange={(event) =>
            setModalTambahan(
              event.target.value === ""
                ? 0
                : Number(event.target.value)
            )
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Masukkan modal tambahan mingguan"
        />

        <button
          type="button"
          onClick={() => void simpanModalMingguan()}
          disabled={menyimpanMingguan || memuat}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {menyimpanMingguan
            ? "Menyimpan..."
            : "Simpan Modal Mingguan"}
        </button>
      </div>
    </section>
  </div>
</div>


);
}
