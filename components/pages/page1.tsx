"use client";

import { useState } from "react";
import { useProducts } from "../../hooks/useProducts";
import type { Product } from "../../hooks/useProducts";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Page1() {
  const {
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
    openAddForm,
    openEditForm,
    closeForm,
    handleSubmit,
    handleDelete,
  } = useProducts();

  const [productToDelete, setProductToDelete] =
    useState<Product | null>(null);

  async function confirmDelete() {
    if (!productToDelete || deletingId !== null) return;

    const product = productToDelete;

    await handleDelete(product);
    setProductToDelete(null);
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Manajemen Produk
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Daftar produk dan informasi harga jual.
          </p>
        </div>

        <div className="flex w-fit flex-wrap items-center gap-3">
          <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            {products.length} produk
          </span>

          <button
            type="button"
            onClick={openAddForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Tambah Produk
          </button>
        </div>
      </div>

      {/* Pesan error */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Pesan sukses */}
      {message && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700"
        >
          {message}
        </div>
      )}

      {/* Form tambah dan edit */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {editingId !== null ? "Edit Produk" : "Tambah Produk"}
          </h2>

          {/* Nama produk */}
          <div>
            <label
              htmlFor="item"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nama Produk
            </label>

            <input
              id="item"
              type="text"
              required
              maxLength={150}
              value={form.item}
              onChange={(event) =>
                setForm({
                  ...form,
                  item: event.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Contoh: pempek lenjer"
            />
          </div>

          {/* Harga */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="harga_beli"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Harga Beli
              </label>

              <input
                id="harga_beli"
                type="number"
                min="0"
                step="1"
                required
                value={form.harga_beli}
                onChange={(event) =>
                  setForm({
                    ...form,
                    harga_beli: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="3500"
              />
            </div>

            <div>
              <label
                htmlFor="harga_jual"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Harga Jual
              </label>

              <input
                id="harga_jual"
                type="number"
                min="0"
                step="1"
                required
                value={form.harga_jual}
                onChange={(event) =>
                  setForm({
                    ...form,
                    harga_jual: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="6000"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="status"
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as
                    | "aktif"
                    | "nonaktif",
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>

          {/* Tombol form */}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Menyimpan..."
                : editingId !== null
                  ? "Simpan Perubahan"
                  : "Simpan Produk"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={closeForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Tabel produk */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Item
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Harga Beli
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Harga Jual
                </th>

                <th className="px-5 py-4 text-center font-semibold">
                  Status
                </th>

                <th className="px-5 py-4 text-center font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    Memuat data produk...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    Belum ada produk.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium capitalize text-gray-900">
                      {product.item}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right text-gray-600">
                      {formatRupiah(product.harga_beli)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-gray-900">
                      {formatRupiah(product.harga_jual)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          product.status === "aktif"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.status === "aktif"
                          ? "Aktif"
                          : "Nonaktif"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          disabled={
                            deletingId !== null || saving
                          }
                          className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setProductToDelete(product)
                          }
                          disabled={
                            deletingId !== null || saving
                          }
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer tabel */}
        <div className="border-t border-gray-200 bg-gray-50 px-5 py-3">
          <p className="text-xs text-gray-500">
            Menampilkan {products.length} produk
          </p>
        </div>
      </div>

      {/* Informasi */}
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm leading-6 text-blue-800">
          <span className="font-semibold">Informasi:</span>{" "}
          Data produk diambil dari database Supabase. Perubahan
          akan disimpan apabila operasi berhasil dan diizinkan
          oleh kebijakan keamanan database.
        </p>
      </div>

      {/* Modal konfirmasi hapus */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setProductToDelete(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            {/* Ikon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-6 w-6 text-red-600"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.3 3.86 1.82 18.14A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-2.86L13.7 3.86a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </div>

            {/* Judul */}
            <h2
              id="delete-title"
              className="text-lg font-bold text-gray-900"
            >
              Hapus Produk?
            </h2>

            {/* Deskripsi */}
            <p
              id="delete-description"
              className="mt-2 text-sm leading-6 text-gray-600"
            >
              Apakah kamu yakin ingin menghapus produk{" "}
              <span className="font-semibold text-gray-900">
                {productToDelete.item}
              </span>
              ? Data yang dihapus tidak dapat dipulihkan secara
              otomatis.
            </p>

            {/* Tombol konfirmasi */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={deletingId !== null}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deletingId !== null}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === productToDelete.id
                  ? "Menghapus..."
                  : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}