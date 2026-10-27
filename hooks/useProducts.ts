"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { createClient } from "../lib/supabase/client";

export type Product = {
id: number;
item: string;
harga_beli: number;
harga_jual: number;
status: "aktif" | "nonaktif";
};

export const emptyForm = {
item: "",
harga_beli: "",
harga_jual: "",
status: "aktif" as "aktif" | "nonaktif",
};

export type ProductForm = typeof emptyForm;

export function useProducts() {
const [supabase] = useState(() => createClient());

const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [deletingId, setDeletingId] = useState<number | null>(null);

const [error, setError] = useState("");
const [message, setMessage] = useState("");

const [form, setForm] = useState<ProductForm>({ ...emptyForm });
const [editingId, setEditingId] = useState<number | null>(null);
const [showForm, setShowForm] = useState(false);

// Mengambil data produk dari Supabase
const loadProducts = useCallback(async () => {
setLoading(true);
setError("");


try {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  setProducts((data ?? []) as Product[]);
} catch (err) {
  console.error("Gagal mengambil produk:", err);

  setError(
    err instanceof Error
      ? err.message
      : "Terjadi kesalahan saat mengambil data produk."
  );
} finally {
  setLoading(false);
}


}, [supabase]);

// Mengambil data saat hook pertama kali digunakan
useEffect(() => {
void loadProducts();
}, [loadProducts]);

// Membuka form tambah produk
function openAddForm() {
setEditingId(null);
setForm({ ...emptyForm });
setError("");
setMessage("");
setShowForm(true);
}

// Membuka form edit produk
function openEditForm(product: Product) {
setEditingId(product.id);


    
setForm({
  item: product.item,
  harga_beli: String(product.harga_beli),
  harga_jual: String(product.harga_jual),
  status: product.status,
});

setError("");
setMessage("");
setShowForm(true);

    

}

// Menutup form
function closeForm() {
setShowForm(false);
setEditingId(null);
setForm({ ...emptyForm });
}

// Menambah atau mengedit produk
async function handleSubmit(
event: React.FormEvent<HTMLFormElement>
) {
event.preventDefault();


    
const item = form.item.trim();
const hargaBeli = Number(form.harga_beli);
const hargaJual = Number(form.harga_jual);

// Validasi input
if (
  !item ||
  !form.harga_beli.trim() ||
  !form.harga_jual.trim() ||
  !Number.isSafeInteger(hargaBeli) ||
  !Number.isSafeInteger(hargaJual) ||
  hargaBeli < 0 ||
  hargaJual < 0
) {
  setError(
    "Isi semua data dengan benar. Harga harus berupa bilangan bulat nonnegatif."
  );
  return;
}

setSaving(true);
setError("");
setMessage("");

try {
  const payload = {
    item,
    harga_beli: hargaBeli,
    harga_jual: hargaJual,
    status: form.status,
  };

  if (editingId !== null) {
    // Update produk
    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", editingId)
      .select("id");

    if (error) {
      throw error;
    }

    if (!data?.length) {
      throw new Error(
        "Produk tidak diperbarui. Periksa izin database atau keberadaan produk."
      );
    }

    closeForm();
    await loadProducts();

    await Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: `Produk "${item}" berhasil diperbarui.`,
      confirmButtonText: "OK",
      confirmButtonColor: "#2563eb",
    });
  } else {
    // Insert produk baru
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id");

    if (error) {
      throw error;
    }

    if (!data?.length) {
      throw new Error("Produk gagal ditambahkan.");
    }

    closeForm();
    await loadProducts();

    await Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: `Produk "${item}" berhasil ditambahkan.`,
      confirmButtonText: "OK",
      confirmButtonColor: "#2563eb",
    });
  }
} catch (err) {
  console.error("Gagal menyimpan produk:", err);

  const errorMessage =
    err instanceof Error
      ? err.message
      : "Terjadi kesalahan saat menyimpan produk.";

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

// Menghapus produk setelah dikonfirmasi oleh modal di Page1
async function handleDelete(product: Product) {
setDeletingId(product.id);
setError("");
setMessage("");


    
try {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", product.id)
    .select("id");

  if (error) {
    throw error;
  }

  if (!data?.length) {
    throw new Error(
      "Produk tidak terhapus. Periksa izin database atau keberadaan produk."
    );
  }

  if (editingId === product.id) {
    closeForm();
  }

  await loadProducts();

  await Swal.fire({
    icon: "success",
    title: "Berhasil!",
    text: `Produk "${product.item}" berhasil dihapus.`,
    confirmButtonText: "OK",
    confirmButtonColor: "#2563eb",
  });
} catch (err) {
  console.error("Gagal menghapus produk:", err);

  const errorMessage =
    err instanceof Error
      ? err.message
      : "Terjadi kesalahan saat menghapus produk.";

  setError(errorMessage);

  await Swal.fire({
    icon: "error",
    title: "Gagal!",
    text: errorMessage,
    confirmButtonText: "OK",
    confirmButtonColor: "#dc2626",
  });
} finally {
  setDeletingId(null);
}

    

}

return {
products,
loading,
saving,
deletingId,
error,
message,
form,
setForm,
editingId,
showForm,
loadProducts,
openAddForm,
openEditForm,
closeForm,
handleSubmit,
handleDelete,
};
}
