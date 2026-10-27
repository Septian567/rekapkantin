"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { createClient } from "../lib/supabase/client";

export type Product = {
  id: number;
  item: string;
  harga_beli: number;
  harga_jual: number;
};

export type ProductInput = {
  stok: string;
  sisa: string;
};

function formatTanggal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatTanggalIndonesia() {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseAngka(value: string) {
  if (value.trim() === "") return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0
    ? Math.floor(parsed)
    : 0;
}

export function useRekapHarian() {
  const [products, setProducts] = useState<Product[]>([]);

  const [productInputs, setProductInputs] = useState<
    Record<number, ProductInput>
  >({});

  const [saldoRealInput, setSaldoRealInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tanggalHariIni = formatTanggalIndonesia();
  const tanggalDatabase = formatTanggal();

  // Mengambil produk aktif dari Supabase.
  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient();

      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, item, harga_beli, harga_jual")
          .eq("status", "aktif")
          .order("id", { ascending: true });

        if (error) throw error;

        const fetchedProducts = (data ?? []) as Product[];

        setProducts(fetchedProducts);

        setProductInputs((previous) => {
          const next: Record<number, ProductInput> = {};

          for (const product of fetchedProducts) {
            next[product.id] = previous[product.id] ?? {
              stok: "",
              sisa: "",
            };
          }

          return next;
        });
      } catch (err) {
        console.error("Gagal mengambil data produk:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil data produk.",
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchProducts();
  }, []);

  // Mengubah input stok atau sisa.
  function updateProductInput(
    productId: number,
    field: keyof ProductInput,
    value: string,
  ) {
    if (
      value !== "" &&
      (!/^\d+$/.test(value) || value.length > 12)
    ) {
      return;
    }

    setSuccess("");
    setError("");

    setProductInputs((previous) => ({
      ...previous,
      [productId]: {
        stok: previous[productId]?.stok ?? "",
        sisa: previous[productId]?.sisa ?? "",
        [field]: value,
      },
    }));
  }

  // Menghitung terjual, omzet, dan untung setiap produk.
  const rekap = useMemo(() => {
    return products.map((product) => {
      const input = productInputs[product.id] ?? {
        stok: "",
        sisa: "",
      };

      const stok = parseAngka(input.stok);
      const sisa = parseAngka(input.sisa);

      const sudahDiisi =
        input.stok.trim() !== "" &&
        input.sisa.trim() !== "";

      const valid = sudahDiisi && sisa <= stok;
      const terjual = valid ? stok - sisa : 0;

      const hargaBeli = Number(product.harga_beli) || 0;
      const hargaJual = Number(product.harga_jual) || 0;

      const omzet = terjual * hargaJual;
      const untung = terjual * (hargaJual - hargaBeli);

      return {
        ...product,
        stok,
        sisa,
        terjual,
        omzet,
        untung,
        sudahDiisi,
        valid,
      };
    });
  }, [products, productInputs]);

  // Menghitung total omzet dan keuntungan.
  const totalOmzet = rekap.reduce(
    (total, product) =>
      total + (product.valid ? product.omzet : 0),
    0,
  );

  const totalUntung = rekap.reduce(
    (total, product) =>
      total + (product.valid ? product.untung : 0),
    0,
  );

  const saldoReal = parseAngka(saldoRealInput);
  const saldoSelisih = saldoReal - totalOmzet;

  // Untung bersih disesuaikan dengan selisih saldo real.
  const untungBersih = totalUntung + saldoSelisih;

  // Mengubah input saldo real.
  function updateSaldoReal(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 15);

    setSaldoRealInput(digits);
    setSuccess("");
    setError("");
  }

  // Menyimpan rekap ke Supabase.
  async function simpanRekap() {
    if (saving) return;

    setError("");
    setSuccess("");

    if (loading) {
      setError("Tunggu sampai data produk selesai dimuat.");
      return;
    }

    if (products.length === 0) {
      setError("Tidak ada produk aktif untuk direkap.");
      return;
    }

    const produkBelumDiisi = rekap.filter(
      (product) => !product.sudahDiisi,
    );

    if (produkBelumDiisi.length > 0) {
      setError(
        `Lengkapi stok dan sisa untuk semua produk. Belum lengkap: ${produkBelumDiisi
          .map((product) => product.item)
          .join(", ")}.`,
      );
      return;
    }

    const produkTidakValid = rekap.filter(
      (product) => !product.valid,
    );

    if (produkTidakValid.length > 0) {
      setError(
        `Sisa tidak boleh melebihi stok: ${produkTidakValid
          .map((product) => product.item)
          .join(", ")}.`,
      );
      return;
    }

    if (saldoRealInput.trim() === "") {
      setError("Masukkan saldo real sebelum menyimpan rekap.");
      return;
    }

    const supabase = createClient();

    setSaving(true);

    try {
      // Periksa apakah rekap tanggal ini sudah ada.
      const {
        data: existingReport,
        error: checkError,
      } = await supabase
        .from("daily_reports")
        .select("id")
        .eq("tanggal", tanggalDatabase)
        .maybeSingle();

      if (checkError) throw checkError;

      let reportId: number;

      if (existingReport) {
        const result = await Swal.fire({
          icon: "warning",
          title: "Rekap Sudah Tersimpan",
          text: `Rekap tanggal ${tanggalHariIni} sudah tersimpan. Apakah kamu ingin mengganti rekap sebelumnya?`,
          showCancelButton: true,
          confirmButtonText: "Ya, Ganti Rekap",
          cancelButtonText: "Batal",
          confirmButtonColor: "#2563eb",
          cancelButtonColor: "#6b7280",
          reverseButtons: true,
        });

        if (!result.isConfirmed) {
          return;
        }

        const {
          data: updatedReport,
          error: updateError,
        } = await supabase
          .from("daily_reports")
          .update({
            saldo_real: saldoReal,
            total_omzet: totalOmzet,
            total_untung: totalUntung,
            untung_bersih: untungBersih,
          })
          .eq("id", existingReport.id)
          .select("id")
          .single();

        if (updateError) throw updateError;

        reportId = updatedReport.id;

        // Hapus rincian lama sebelum menyimpan rincian terbaru.
        const { error: deleteError } = await supabase
          .from("daily_report_items")
          .delete()
          .eq("daily_report_id", reportId);

        if (deleteError) throw deleteError;
      } else {
        const {
          data: newReport,
          error: insertError,
        } = await supabase
          .from("daily_reports")
          .insert({
            tanggal: tanggalDatabase,
            saldo_awal: 0,
            saldo_real: saldoReal,
            total_omzet: totalOmzet,
            total_untung: totalUntung,
            untung_bersih: untungBersih,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;

        reportId = newReport.id;
      }

      const detailRows = rekap.map((product) => ({
        daily_report_id: reportId,
        product_id: product.id,
        item: product.item,
        harga_beli: Number(product.harga_beli) || 0,
        harga_jual: Number(product.harga_jual) || 0,
        stok: product.stok,
        sisa: product.sisa,
        terjual: product.terjual,
        omzet: product.omzet,
        untung: product.untung,
      }));

      const { error: detailError } = await supabase
        .from("daily_report_items")
        .insert(detailRows);

      if (detailError) throw detailError;

      const successMessage =
        `Rekap tanggal ${tanggalHariIni} berhasil disimpan.`;

      setSuccess(successMessage);

      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: successMessage,
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });
    } catch (err) {
      console.error("Gagal menyimpan rekap:", err);

      const errorMessage =
        err instanceof Error
          ? `Gagal menyimpan rekap: ${err.message}`
          : "Terjadi kesalahan saat menyimpan rekap.";

      setError(errorMessage);

      await Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: errorMessage,
        confirmButtonText: "OK",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSaving(false);
    }
  }

  return {
    products,
    productInputs,
    saldoRealInput,
    loading,
    saving,
    error,
    success,
    tanggalHariIni,
    rekap,
    totalOmzet,
    totalUntung,
    saldoReal,
    saldoSelisih,
    untungBersih,
    updateProductInput,
    updateSaldoReal,
    simpanRekap,
  };
}

