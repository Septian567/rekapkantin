"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

import { createClient } from "../../lib/supabase/client";

type CatatanUang = {
  id: string;
  tanggal: string;
  uangMasuk: number;
  uangKeluar: number;
  keterangan: string;
};

type CatatanUangDB = {
  id: string;
  tanggal: string;
  uang_masuk: number | string;
  uang_keluar: number | string;
  keterangan: string | null;
};

type RingkasanHarian = {
  tanggal: string;
  uangMasuk: number;
  uangKeluar: number;
  saldo: number;
  jumlahTransaksi: number;
};

// Konfigurasi SweetAlert dengan tema cerah.
const swalLight = {
  background: "#ffffff",
  color: "#1e293b",
  confirmButtonColor: "#10b981",
  cancelButtonColor: "#64748b",
  customClass: {
    popup: "rounded-2xl",
    confirmButton: "rounded-lg px-5 py-2.5 font-semibold",
    cancelButton: "rounded-lg px-5 py-2.5 font-semibold",
  },
};

const tanggalHariIni = () => {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const hari = String(sekarang.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${hari}`;
};

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);

const formatTanggal = (tanggal: string) => {
  if (!tanggal) return "-";

  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  const tanggalObj = new Date(tahun, bulan - 1, hari);

  return tanggalObj.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function Page6() {
  const supabase = useMemo(() => createClient(), []);

  const [catatan, setCatatan] = useState<CatatanUang[]>([]);
  const [siap, setSiap] = useState(false);

  const [tanggal, setTanggal] = useState(tanggalHariIni());
  const [uangMasuk, setUangMasuk] = useState("");
  const [uangKeluar, setUangKeluar] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [pesan, setPesan] = useState("");
  const [tanggalDetail, setTanggalDetail] = useState<string | null>(null);

  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [sedangMenghapus, setSedangMenghapus] = useState<string | null>(
    null
  );
  const [sedangExportExcel, setSedangExportExcel] = useState(false);
  const [sedangExportSheets, setSedangExportSheets] = useState(false);

  // READ: Memuat catatan transaksi dari Supabase.
  const muatCatatan = useCallback(async () => {
    try {
      const {
        data: { user },
        error: errorAuth,
      } = await supabase.auth.getUser();

      if (errorAuth || !user) {
        setCatatan([]);
        setPesan(
          "Silakan login terlebih dahulu untuk melihat catatan."
        );
        setSiap(true);
        return;
      }

      const { data, error } = await supabase
        .from("catatan_uang_dingin")
        .select("id, tanggal, uang_masuk, uang_keluar, keterangan")
        .eq("user_id", user.id)
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gagal memuat catatan:", error);
        setPesan(`Gagal memuat catatan: ${error.message}`);
        setSiap(true);
        return;
      }

      const hasil: CatatanUang[] = (
        (data ?? []) as CatatanUangDB[]
      ).map((item) => ({
        id: item.id,
        tanggal: item.tanggal,
        uangMasuk: Number(item.uang_masuk ?? 0),
        uangKeluar: Number(item.uang_keluar ?? 0),
        keterangan: item.keterangan ?? "",
      }));

      setCatatan(hasil);
      setSiap(true);
    } catch (error) {
      console.error("Terjadi kesalahan saat memuat catatan:", error);
      setPesan("Terjadi kesalahan saat memuat catatan.");
      setSiap(true);
    }
  }, [supabase]);

  useEffect(() => {
    void muatCatatan();
  }, [muatCatatan]);

  // Mereset formulir.
  const resetForm = () => {
    setTanggal(tanggalHariIni());
    setUangMasuk("");
    setUangKeluar("");
    setKeterangan("");
    setEditId(null);
  };

  // CREATE dan UPDATE.
  const simpanCatatan = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setPesan("");

    const masuk = Number(uangMasuk || 0);
    const keluar = Number(uangKeluar || 0);
    const keteranganBersih = keterangan.trim();

    // Validasi formulir.
    if (!tanggal) {
      setPesan("Tanggal wajib diisi.");
      return;
    }

    if (!Number.isFinite(masuk) || !Number.isFinite(keluar)) {
      setPesan("Nominal uang tidak valid.");
      return;
    }

    if (masuk < 0 || keluar < 0) {
      setPesan("Nominal tidak boleh negatif.");
      return;
    }

    if (
      !Number.isSafeInteger(masuk) ||
      !Number.isSafeInteger(keluar)
    ) {
      setPesan("Nominal harus berupa bilangan bulat yang valid.");
      return;
    }

    if (masuk === 0 && keluar === 0) {
      setPesan("Isi nominal uang masuk atau uang keluar.");
      return;
    }

    if (!keteranganBersih) {
      setPesan("Keterangan transaksi wajib diisi.");
      return;
    }

    setSedangMenyimpan(true);

    try {
      const {
        data: { user },
        error: errorAuth,
      } = await supabase.auth.getUser();

      if (errorAuth || !user) {
        setPesan(
          "Sesi login tidak ditemukan. Silakan login kembali."
        );

        await Swal.fire({
          ...swalLight,
          icon: "error",
          title: "Sesi Login Tidak Ditemukan",
          text: "Silakan login kembali untuk melanjutkan.",
          confirmButtonText: "Mengerti",
        });

        return;
      }

      const dataSimpan = {
        tanggal,
        uang_masuk: masuk,
        uang_keluar: keluar,
        keterangan: keteranganBersih,
      };

      if (editId) {
        // UPDATE.
        const { data, error } = await supabase
          .from("catatan_uang_dingin")
          .update(dataSimpan)
          .eq("id", editId)
          .eq("user_id", user.id)
          .select("id");

        if (error) {
          console.error("Gagal mengedit catatan:", error);
          setPesan(`Gagal mengedit catatan: ${error.message}`);

          await Swal.fire({
            ...swalLight,
            icon: "error",
            title: "Gagal Memperbarui!",
            text: error.message,
            confirmButtonText: "Coba Lagi",
          });

          return;
        }

        if (!data || data.length === 0) {
          setPesan(
            "Transaksi tidak ditemukan atau tidak memiliki izin untuk diperbarui."
          );

          await Swal.fire({
            ...swalLight,
            icon: "warning",
            title: "Transaksi Tidak Diperbarui",
            text: "Data tidak ditemukan atau kamu tidak memiliki izin untuk mengubahnya.",
            confirmButtonText: "OK",
          });

          return;
        }

        resetForm();
        await muatCatatan();

        await Swal.fire({
          ...swalLight,
          icon: "success",
          title: "Berhasil Diperbarui!",
          text: "Catatan transaksi berhasil diperbarui.",
          confirmButtonText: "Mantap!",
        });
      } else {
        // CREATE.
        const { error } = await supabase
          .from("catatan_uang_dingin")
          .insert({
            ...dataSimpan,
            user_id: user.id,
          });

        if (error) {
          console.error("Gagal menyimpan catatan:", error);
          setPesan(`Gagal menyimpan catatan: ${error.message}`);

          await Swal.fire({
            ...swalLight,
            icon: "error",
            title: "Gagal Menyimpan!",
            text: error.message,
            confirmButtonText: "Coba Lagi",
          });

          return;
        }

        resetForm();
        await muatCatatan();

        await Swal.fire({
          ...swalLight,
          icon: "success",
          title: "Berhasil Disimpan!",
          text: "Transaksi baru berhasil ditambahkan.",
          confirmButtonText: "Mantap!",
        });
      }
    } catch (error) {
      console.error("Terjadi kesalahan saat menyimpan:", error);

      await Swal.fire({
        ...swalLight,
        icon: "error",
        title: "Terjadi Kesalahan!",
        text: "Terjadi kesalahan saat menyimpan transaksi. Silakan coba lagi.",
        confirmButtonText: "OK",
      });
    } finally {
      setSedangMenyimpan(false);
    }
  };

  // Mengisi formulir untuk mengedit transaksi.
  const mulaiEdit = (item: CatatanUang) => {
    setEditId(item.id);
    setTanggal(item.tanggal);
    setUangMasuk(
      item.uangMasuk ? String(item.uangMasuk) : ""
    );
    setUangKeluar(
      item.uangKeluar ? String(item.uangKeluar) : ""
    );
    setKeterangan(item.keterangan);
    setPesan("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // DELETE: Menghapus transaksi dengan konfirmasi SweetAlert.
  const hapusCatatan = async (id: string) => {
    const konfirmasi = await Swal.fire({
      ...swalLight,
      icon: "warning",
      title: "Hapus Transaksi?",
      text: "Transaksi yang dihapus tidak dapat dikembalikan.",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      reverseButtons: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
    });

    if (!konfirmasi.isConfirmed) return;

    setPesan("");
    setSedangMenghapus(id);

    try {
      const {
        data: { user },
        error: errorAuth,
      } = await supabase.auth.getUser();

      if (errorAuth || !user) {
        setPesan(
          "Sesi login tidak ditemukan. Silakan login kembali."
        );

        await Swal.fire({
          ...swalLight,
          icon: "error",
          title: "Sesi Login Tidak Ditemukan",
          text: "Silakan login kembali untuk menghapus transaksi.",
          confirmButtonText: "Mengerti",
        });

        return;
      }

      const { data, error } = await supabase
        .from("catatan_uang_dingin")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id");

      if (error) {
        console.error("Gagal menghapus catatan:", error);
        setPesan(`Gagal menghapus catatan: ${error.message}`);

        await Swal.fire({
          ...swalLight,
          icon: "error",
          title: "Gagal Menghapus!",
          text: error.message,
          confirmButtonText: "Coba Lagi",
        });

        return;
      }

      if (!data || data.length === 0) {
        setPesan(
          "Transaksi tidak ditemukan atau tidak memiliki izin untuk dihapus."
        );

        await Swal.fire({
          ...swalLight,
          icon: "warning",
          title: "Transaksi Tidak Dihapus",
          text: "Data tidak ditemukan atau kamu tidak memiliki izin untuk menghapusnya.",
          confirmButtonText: "OK",
        });

        return;
      }

      setCatatan((sebelumnya) =>
        sebelumnya.filter((item) => item.id !== id)
      );

      if (editId === id) {
        resetForm();
      }

      await Swal.fire({
        ...swalLight,
        icon: "success",
        title: "Berhasil Dihapus!",
        text: "Transaksi berhasil dihapus.",
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error("Terjadi kesalahan saat menghapus:", error);

      await Swal.fire({
        ...swalLight,
        icon: "error",
        title: "Terjadi Kesalahan!",
        text: "Transaksi tidak dapat dihapus. Silakan coba lagi.",
        confirmButtonText: "OK",
      });
    } finally {
      setSedangMenghapus(null);
    }
  };

  // Mengelompokkan transaksi berdasarkan tanggal.
  const ringkasanHarian: RingkasanHarian[] = useMemo(() => {
    const grup = new Map<
      string,
      {
        uangMasuk: number;
        uangKeluar: number;
        jumlahTransaksi: number;
      }
    >();

    for (const item of catatan) {
      const sebelumnya = grup.get(item.tanggal) ?? {
        uangMasuk: 0,
        uangKeluar: 0,
        jumlahTransaksi: 0,
      };

      sebelumnya.uangMasuk += item.uangMasuk;
      sebelumnya.uangKeluar += item.uangKeluar;
      sebelumnya.jumlahTransaksi += 1;

      grup.set(item.tanggal, sebelumnya);
    }

    const tanggalUrut = Array.from(grup.keys()).sort((a, b) =>
      b.localeCompare(a)
    );

    let saldoBerjalan = 0;
    const hasilTerbalik: RingkasanHarian[] = [];

    // Menghitung saldo dari tanggal terlama ke tanggal terbaru.
    for (const tgl of [...tanggalUrut].reverse()) {
      const item = grup.get(tgl)!;

      saldoBerjalan += item.uangMasuk - item.uangKeluar;

      hasilTerbalik.push({
        tanggal: tgl,
        uangMasuk: item.uangMasuk,
        uangKeluar: item.uangKeluar,
        saldo: saldoBerjalan,
        jumlahTransaksi: item.jumlahTransaksi,
      });
    }

    return hasilTerbalik.reverse();
  }, [catatan]);

  const totalUangMasuk = catatan.reduce(
    (total, item) => total + item.uangMasuk,
    0
  );

  const totalUangKeluar = catatan.reduce(
    (total, item) => total + item.uangKeluar,
    0
  );

  const saldoAkhir = totalUangMasuk - totalUangKeluar;

  const transaksiDetail = tanggalDetail
    ? catatan
        .filter((item) => item.tanggal === tanggalDetail)
        .slice()
        .sort((a, b) => b.id.localeCompare(a.id))
    : [];

  // Data ekspor dibuat dari data yang sudah dimuat dan difilter berdasarkan user login.
  const buatDataExport = () => {
    const dataTransaksi = [...catatan]
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .map((item) => ({
        Tanggal: item.tanggal,
        Keterangan: item.keterangan,
        "Uang Masuk": item.uangMasuk,
        "Uang Keluar": item.uangKeluar,
        Selisih: item.uangMasuk - item.uangKeluar,
      }));

    const dataHarian = ringkasanHarian.map((item) => ({
      Tanggal: item.tanggal,
      "Uang Masuk": item.uangMasuk,
      "Uang Keluar": item.uangKeluar,
      "Saldo Berjalan": item.saldo,
      "Jumlah Transaksi": item.jumlahTransaksi,
    }));

    const dataTotal = [
      { Keterangan: "Total Uang Masuk", Nominal: totalUangMasuk },
      { Keterangan: "Total Uang Keluar", Nominal: totalUangKeluar },
      { Keterangan: "Saldo Akhir", Nominal: saldoAkhir },
      { Keterangan: "Jumlah Transaksi", Nominal: catatan.length },
    ];

    return { dataTransaksi, dataHarian, dataTotal };
  };

  const exportExcel = () => {
    if (!siap || catatan.length === 0) {
      setPesan("Tidak ada data untuk diekspor.");
      return;
    }

    setSedangExportExcel(true);
    setPesan("");

    try {
      const { dataTransaksi, dataHarian, dataTotal } = buatDataExport();
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(dataTransaksi),
        "Catatan Transaksi"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(dataHarian),
        "Ringkasan Harian"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(dataTotal),
        "Total Akumulasi"
      );

      XLSX.writeFile(
        workbook,
        `Uang_Dingin_Page6_${tanggalHariIni()}.xlsx`
      );
      setPesan("Export Excel berhasil.");
    } catch (error) {
      console.error("Export Excel Page 6 gagal:", error);
      setPesan("Gagal mengekspor data ke Excel.");
    } finally {
      setSedangExportExcel(false);
    }
  };

  const exportGoogleSheets = async () => {
    if (!siap || catatan.length === 0) {
      setPesan("Tidak ada data untuk diekspor.");
      return;
    }

    setSedangExportSheets(true);
    setPesan("");

    try {
      const { dataTransaksi, dataHarian, dataTotal } = buatDataExport();
      const response = await fetch("/api/export-page6-google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataTransaksi, dataHarian, dataTotal }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengekspor ke Google Sheets.");
      }

      setPesan("Export Google Sheets berhasil. Catatan transaksi, ringkasan harian, dan total akumulasi telah diperbarui.");
    } catch (error) {
      console.error("Export Google Sheets Page 6 gagal:", error);
      setPesan(
        error instanceof Error
          ? error.message
          : "Gagal mengekspor data ke Google Sheets."
      );
    } finally {
      setSedangExportSheets(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Catatan Keuangan Kantin
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Uang Dingin Harian
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Catat uang masuk dan uang keluar setiap hari. Transaksi
            pada tanggal yang sama akan digabung dalam ringkasan
            harian.
          </p>

          <div className="flex flex-wrap gap-3 pt-3">
            <button
              type="button"
              onClick={exportExcel}
              disabled={!siap || catatan.length === 0 || sedangExportExcel || sedangExportSheets}
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sedangExportExcel ? "Mengekspor Excel..." : "Export Excel"}
            </button>
            <button
              type="button"
              onClick={() => void exportGoogleSheets()}
              disabled={!siap || catatan.length === 0 || sedangExportSheets || sedangExportExcel}
              className="rounded-xl border border-sky-700 bg-sky-950/60 px-4 py-2.5 text-sm font-semibold text-sky-300 transition hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sedangExportSheets ? "Mengekspor Google Sheets..." : "Export Google Sheets"}
            </button>
          </div>
        </header>

        {/* Pesan status */}
        {pesan && (
          <div
            role="status"
            className="flex items-start justify-between gap-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm"
          >
            <span>{pesan}</span>

            <button
              type="button"
              onClick={() => setPesan("")}
              className="text-slate-400 hover:text-white"
              aria-label="Tutup pesan"
            >
              ✕
            </button>
          </div>
        )}

        {/* Kartu ringkasan keuangan */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Uang Masuk
            </p>

            <p className="mt-2 break-words text-xl font-bold text-emerald-400 sm:text-2xl">
              {formatRupiah(totalUangMasuk)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Uang Keluar
            </p>

            <p className="mt-2 break-words text-xl font-bold text-rose-400 sm:text-2xl">
              {formatRupiah(totalUangKeluar)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Saldo Akhir</p>

            <p
              className={`mt-2 break-words text-xl font-bold sm:text-2xl ${
                saldoAkhir >= 0
                  ? "text-sky-400"
                  : "text-rose-400"
              }`}
            >
              {formatRupiah(saldoAkhir)}
            </p>
          </div>
        </section>

        {/* Form tambah dan edit transaksi */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              {editId ? "Edit Transaksi" : "Tambah Transaksi"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Masukkan detail transaksi uang dingin kamu.
            </p>
          </div>

          <form onSubmit={simpanCatatan} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  Tanggal
                </span>

                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  Keterangan
                </span>

                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Gaji, makan, transportasi"
                  maxLength={500}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  Uang Masuk (Rp)
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={uangMasuk}
                  onChange={(e) => setUangMasuk(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  Uang Keluar (Rp)
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={uangKeluar}
                  onChange={(e) => setUangKeluar(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-rose-500"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={sedangMenyimpan || !siap}
                className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sedangMenyimpan
                  ? "Menyimpan..."
                  : editId
                    ? "Simpan Perubahan"
                    : "Tambah Transaksi"}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Ringkasan harian */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Ringkasan Harian</h2>

            <p className="mt-1 text-sm text-slate-400">
              Satu baris untuk setiap tanggal. Tekan Detail untuk
              melihat transaksi pada tanggal tersebut.
            </p>
          </div>

          {!siap ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              Memuat catatan...
            </div>
          ) : ringkasanHarian.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
              <p className="font-medium text-slate-300">
                Belum ada transaksi.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Tambahkan transaksi pertama menggunakan formulir di
                atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="px-4 py-4 font-medium">
                      Tanggal
                    </th>

                    <th className="px-4 py-4 text-right font-medium">
                      Uang Masuk
                    </th>

                    <th className="px-4 py-4 text-right font-medium">
                      Uang Keluar
                    </th>

                    <th className="px-4 py-4 text-right font-medium">
                      Saldo Berjalan
                    </th>

                    <th className="px-4 py-4 text-center font-medium">
                      Transaksi
                    </th>

                    <th className="px-4 py-4 text-center font-medium">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ringkasanHarian.map((item) => (
                    <tr
                      key={item.tanggal}
                      className="border-t border-slate-800 transition hover:bg-slate-900/70"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-medium">
                        {formatTanggal(item.tanggal)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right text-emerald-400">
                        {formatRupiah(item.uangMasuk)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right text-rose-400">
                        {formatRupiah(item.uangKeluar)}
                      </td>

                      <td
                        className={`whitespace-nowrap px-4 py-4 text-right font-semibold ${
                          item.saldo >= 0
                            ? "text-sky-400"
                            : "text-rose-400"
                        }`}
                      >
                        {formatRupiah(item.saldo)}
                      </td>

                      <td className="px-4 py-4 text-center">
                        {item.jumlahTransaksi}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setTanggalDetail((sebelumnya) =>
                              sebelumnya === item.tanggal
                                ? null
                                : item.tanggal
                            )
                          }
                          className="rounded-lg border border-slate-700 px-3 py-2 font-medium text-sky-400 transition hover:bg-slate-800"
                        >
                          {tanggalDetail === item.tanggal
                            ? "Tutup"
                            : "Detail"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Detail transaksi */}
        {tanggalDetail && (
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  Detail Transaksi
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {formatTanggal(tanggalDetail)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTanggalDetail(null)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                Tutup Detail
              </button>
            </div>

            {transaksiDetail.length === 0 ? (
              <p className="text-sm text-slate-400">
                Tidak ada transaksi untuk tanggal ini.
              </p>
            ) : (
              <div className="space-y-3">
                {transaksiDetail.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words font-semibold text-white">
                          {item.keterangan}
                        </h3>

                        <div className="mt-3 space-y-1 text-sm">
                          <p className="text-emerald-400">
                            Masuk: {formatRupiah(item.uangMasuk)}
                          </p>

                          <p className="text-rose-400">
                            Keluar: {formatRupiah(item.uangKeluar)}
                          </p>

                          <p className="pt-1 text-slate-400">
                            Selisih:{" "}
                            <span className="font-semibold text-slate-200">
                              {formatRupiah(
                                item.uangMasuk - item.uangKeluar
                              )}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => mulaiEdit(item)}
                          className="rounded-lg border border-sky-800 px-3 py-2 text-sm font-medium text-sky-400 transition hover:bg-sky-950"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void hapusCatatan(item.id)}
                          disabled={sedangMenghapus === item.id}
                          className="rounded-lg border border-rose-900 px-3 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sedangMenghapus === item.id
                            ? "Menghapus..."
                            : "Hapus"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
