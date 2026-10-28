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

  const inputClass =
    "min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-gray-700";

  const buttonClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 pb-8 sm:space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7h16M4 12h16M4 17h10"
                  />
                </svg>
              </span>

              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Inventaris
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Manajemen Produk
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Kelola produk, harga, dan status produk dengan mudah.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:shrink-0">
            <div className="flex min-h-12 flex-1 flex-col justify-center rounded-xl bg-blue-50 px-4 sm:flex-none">
              <span className="text-xl font-bold text-blue-700">
                {products.length}
              </span>
              <span className="text-xs font-medium text-blue-600">
                Total produk
              </span>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              className={`${buttonClass} flex-1 bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 sm:flex-none`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 5v14m-7-7h14"
                />
              </svg>
              Tambah Produk
            </button>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          <span className="font-bold">!</span>
          <p className="min-w-0 break-words">{error}</p>
        </div>
      )}

      {/* Success */}
      {message && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700"
        >
          <span aria-hidden="true">✓</span>
          <p className="min-w-0 break-words">{message}</p>
        </div>
      )}

      {/* Form Tambah / Edit */}
      {showForm && (
        <section
          id="product-form"
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 bg-gray-50/70 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId !== null
                    ? "Edit Produk"
                    : "Tambah Produk"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Lengkapi informasi produk di bawah ini.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Tutup formulir"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m6 6 12 12M18 6 6 18"
                  />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
            <div>
              <label htmlFor="item" className={labelClass}>
                Nama Produk
              </label>

              <input
                id="item"
                type="text"
                required
                maxLength={150}
                autoComplete="off"
                value={form.item}
                onChange={(event) =>
                  setForm({
                    ...form,
                    item: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="Contoh: Pempek Lenjer"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="harga_beli" className={labelClass}>
                  Harga Beli (Rp)
                </label>

                <input
                  id="harga_beli"
                  type="number"
                  inputMode="numeric"
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
                  className={inputClass}
                  placeholder="3500"
                />
              </div>

              <div>
                <label htmlFor="harga_jual" className={labelClass}>
                  Harga Jual (Rp)
                </label>

                <input
                  id="harga_jual"
                  type="number"
                  inputMode="numeric"
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
                  className={inputClass}
                  placeholder="6000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className={labelClass}>
                Status Produk
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
                className={inputClass}
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={closeForm}
                className={`${buttonClass} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 sm:min-w-32`}
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={saving}
                className={`${buttonClass} bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 sm:min-w-40`}
              >
                {saving ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                    Menyimpan...
                  </>
                ) : editingId !== null ? (
                  "Simpan Perubahan"
                ) : (
                  "Simpan Produk"
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Daftar Produk */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Daftar Produk
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Informasi harga dan status setiap produk.
            </p>
          </div>

          <span className="mt-2 w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 sm:mt-0">
            {products.length} item
          </span>
        </div>

        {/* Loading */}
        {loading ? (
          <div
            role="status"
            className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center"
          >
            <span
              className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-gray-500">
              Memuat data produk...
            </p>
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center px-5 py-14 text-center sm:py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-8 w-8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m6-6H6"
                />
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="4"
                />
              </svg>
            </div>

            <h3 className="text-base font-bold text-gray-900">
              Belum ada produk
            </h3>

            <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
              Mulai tambahkan produk untuk melihat daftar inventaris
              kamu di sini.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className={`${buttonClass} mt-5 bg-blue-600 text-white hover:bg-blue-700`}
            >
              + Tambah Produk Pertama
            </button>
          </div>
        ) : (
          <>
            {/* Tampilan Kartu: Android / Mobile */}
            <div className="divide-y divide-gray-100 md:hidden">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="p-4 transition hover:bg-gray-50/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold uppercase text-blue-600">
                        {product.item.trim().charAt(0) || "P"}
                      </div>

                      <div className="min-w-0 pt-0.5">
                        <h3 className="break-words text-base font-bold capitalize leading-6 text-gray-900">
                          {product.item}
                        </h3>

                        <p className="mt-1 text-xs text-gray-400">
                          ID Produk: {product.id}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        product.status === "aktif"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.status === "aktif"
                        ? "Aktif"
                        : "Nonaktif"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Harga Beli
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold text-gray-700">
                        {formatRupiah(product.harga_beli)}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-xl bg-blue-50/70 p-3">
                      <p className="text-xs font-medium text-blue-600">
                        Harga Jual
                      </p>

                      <p className="mt-1 break-words text-sm font-bold text-blue-700">
                        {formatRupiah(product.harga_jual)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => openEditForm(product)}
                      disabled={deletingId !== null || saving}
                      className={`${buttonClass} border border-blue-200 bg-white text-blue-700 hover:bg-blue-50`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14 5 5 5M4 20l4.5-1 10-10a2.12 2.12 0 0 0-3-3l-10 10L4 20Z"
                        />
                      </svg>
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductToDelete(product)}
                      disabled={deletingId !== null || saving}
                      className={`${buttonClass} border border-red-200 bg-white text-red-600 hover:bg-red-50`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"
                        />
                      </svg>
                      Hapus
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Tampilan Tabel: Tablet / Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Produk
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-right font-semibold">
                      Harga Beli
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-right font-semibold">
                      Harga Jual
                    </th>

                    <th className="px-6 py-4 text-center font-semibold">
                      Status
                    </th>

                    <th className="px-6 py-4 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold uppercase text-blue-600">
                            {product.item.trim().charAt(0) || "P"}
                          </div>

                          <span className="break-words font-semibold capitalize text-gray-900">
                            {product.item}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right text-gray-600">
                        {formatRupiah(product.harga_beli)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-gray-900">
                        {formatRupiah(product.harga_jual)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            product.status === "aktif"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {product.status === "aktif"
                            ? "Aktif"
                            : "Nonaktif"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(product)}
                            disabled={deletingId !== null || saving}
                            className="min-h-10 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            disabled={deletingId !== null || saving}
                            className="min-h-10 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Daftar */}
            <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3 sm:px-6">
              <p className="text-xs font-medium text-gray-500">
                Menampilkan {products.length} produk
              </p>
            </div>
          </>
        )}
      </section>

      {/* Informasi */}
      <aside className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="h-5 w-5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 11v5m0-8h.01"
            />
          </svg>
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-blue-900">
            Informasi Database
          </h3>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            Data produk diambil dari database Supabase. Perubahan
            disimpan apabila operasi berhasil dan diizinkan oleh
            kebijakan keamanan database.
          </p>
        </div>
      </aside>

      {/* Modal Konfirmasi Hapus */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              if (deletingId === null) {
                setProductToDelete(null);
              }
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-gray-200 sm:hidden" />

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.3 3.86 1.82 18.14A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-2.86L13.7 3.86a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </div>

            <h2
              id="delete-title"
              className="text-xl font-bold text-gray-900"
            >
              Hapus Produk?
            </h2>

            <p
              id="delete-description"
              className="mt-2 text-sm leading-6 text-gray-500"
            >
              Apakah kamu yakin ingin menghapus produk{" "}
              <span className="break-words font-semibold text-gray-900">
                {productToDelete.item}
              </span>
              ? Data yang dihapus tidak dapat dipulihkan secara
              otomatis.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={deletingId !== null}
                className={`${buttonClass} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 sm:min-w-28`}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deletingId !== null}
                className={`${buttonClass} bg-red-600 text-white hover:bg-red-700 sm:min-w-32`}
              >
                {deletingId === productToDelete.id
                  ? "Menghapus..."
                  : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
