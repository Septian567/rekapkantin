"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

import { createClient } from "../lib/supabase/client";

import type {
CatatanUang,
CatatanUangDB,
RingkasanHarian,
} from "../types/catatan-uang";

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

export const tanggalHariIni = () => {
const sekarang = new Date();
const tahun = sekarang.getFullYear();
const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
const hari = String(sekarang.getDate()).padStart(2, "0");

return `${tahun}-${bulan}-${hari}`;
};

export default function useCatatanUang() {
const supabase = useMemo(() => createClient(), []);

// State
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
const [sedangMenghapus, setSedangMenghapus] = useState<string | null>(null);
const [sedangExportExcel, setSedangExportExcel] = useState(false);
const [sedangExportSheets, setSedangExportSheets] = useState(false);

// READ
const muatCatatan = useCallback(async () => {
try {
const {
data: { user },
error: errorAuth,
} = await supabase.auth.getUser();


  if (errorAuth || !user) {
    setCatatan([]);
    setPesan("Silakan login terlebih dahulu untuk melihat catatan.");
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

  const hasil: CatatanUang[] = ((data ?? []) as CatatanUangDB[]).map(
    (item) => ({
      id: item.id,
      tanggal: item.tanggal,
      uangMasuk: Number(item.uang_masuk ?? 0),
      uangKeluar: Number(item.uang_keluar ?? 0),
      keterangan: item.keterangan ?? "",
    })
  );

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

// RESET FORM
const resetForm = useCallback(() => {
setTanggal(tanggalHariIni());
setUangMasuk("");
setUangKeluar("");
setKeterangan("");
setEditId(null);
}, []);

// CREATE DAN UPDATE
const simpanCatatan = async (e: FormEvent<HTMLFormElement>) => {
e.preventDefault();
setPesan("");


const masuk = Number(uangMasuk || 0);
const keluar = Number(uangKeluar || 0);
const keteranganBersih = keterangan.trim();

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

if (!Number.isSafeInteger(masuk) || !Number.isSafeInteger(keluar)) {
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
    setPesan("Sesi login tidak ditemukan. Silakan login kembali.");

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

// EDIT
const mulaiEdit = (item: CatatanUang) => {
setEditId(item.id);
setTanggal(item.tanggal);
setUangMasuk(item.uangMasuk ? String(item.uangMasuk) : "");
setUangKeluar(item.uangKeluar ? String(item.uangKeluar) : "");
setKeterangan(item.keterangan);
setPesan("");


window.scrollTo({
  top: 0,
  behavior: "smooth",
});


};

// DELETE
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
    setPesan("Sesi login tidak ditemukan. Silakan login kembali.");

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

// RINGKASAN HARIAN
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

// TOTAL KEUANGAN
const totalUangMasuk = catatan.reduce(
(total, item) => total + item.uangMasuk,
0
);

const totalUangKeluar = catatan.reduce(
(total, item) => total + item.uangKeluar,
0
);

const saldoAkhir = totalUangMasuk - totalUangKeluar;

// DETAIL TRANSAKSI
const transaksiDetail = useMemo(
() =>
tanggalDetail
? catatan
.filter((item) => item.tanggal === tanggalDetail)
.slice()
.sort((a, b) => b.id.localeCompare(a.id))
: [],
[catatan, tanggalDetail]
);

// DATA EKSPOR
const buatDataExport = useCallback(() => {
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


}, [
catatan,
ringkasanHarian,
totalUangMasuk,
totalUangKeluar,
saldoAkhir,
]);

// EXPORT EXCEL
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

// EXPORT GOOGLE SHEETS
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
    body: JSON.stringify({
      dataTransaksi,
      dataHarian,
      dataTotal,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Gagal mengekspor ke Google Sheets."
    );
  }

  setPesan(
    "Export Google Sheets berhasil. Catatan transaksi, ringkasan harian, dan total akumulasi telah diperbarui."
  );
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

return {
catatan,
siap,
tanggal,
setTanggal,
uangMasuk,
setUangMasuk,
uangKeluar,
setUangKeluar,
keterangan,
setKeterangan,
editId,
pesan,
setPesan,
tanggalDetail,
setTanggalDetail,
sedangMenyimpan,
sedangMenghapus,
sedangExportExcel,
sedangExportSheets,
resetForm,
simpanCatatan,
mulaiEdit,
hapusCatatan,
ringkasanHarian,
totalUangMasuk,
totalUangKeluar,
saldoAkhir,
transaksiDetail,
exportExcel,
exportGoogleSheets,
};
}
