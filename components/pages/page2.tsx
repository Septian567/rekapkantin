"use client";

import {
  formatRupiah,
  useRekapHarian,
} from "../../hooks/useRekapHarian";

export default function Page2() {
  const {
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
  } = useRekapHarian();

  return (
    <div className="mx-auto w-full min-w-0 space-y-5 sm:space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Rekap Omzet Harian
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Isi stok awal dan sisa produk. Jumlah terjual, omzet,
            dan untung akan dihitung otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:flex sm:flex-wrap">
          {/* TANGGAL */}
          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 sm:px-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 4.5h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Z"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-xs text-gray-500">Tanggal Rekap</p>
              <p className="break-words text-sm font-semibold text-gray-900">
                {tanggalHariIni}
              </p>
            </div>
          </div>

          {/* JUMLAH PRODUK */}
          <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
            {products.length} jenis produk
          </div>
        </div>
      </header>

      {/* PESAN ERROR */}
      {error && (
        <div
          role="alert"
          className="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
        >
          <div className="flex items-start gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.3 3.86 1.82 18.14A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-2.86L13.7 3.86a2 2 0 0 0-3.4 0Z"
              />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* PESAN SUKSES */}
      {success && (
        <div
          role="status"
          className="break-words rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-700"
        >
          <div className="flex items-start gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
            </svg>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* RINGKASAN */}
      <section className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3v18h18M7 14l4-4 4 4 6-7"
              />
            </svg>
            <p className="text-sm font-medium">Total Omzet</p>
          </div>

          <p className="mt-3 break-words text-xl font-bold text-blue-800 sm:text-2xl">
            {formatRupiah(totalOmzet)}
          </p>
          <p className="mt-1 text-xs text-blue-700">
            Total penjualan hari ini
          </p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2v20m5-15H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
              />
            </svg>
            <p className="text-sm font-medium">Total Untung</p>
          </div>

          <p
            className={`mt-3 break-words text-xl font-bold sm:text-2xl ${
              totalUntung < 0 ? "text-red-700" : "text-green-800"
            }`}
          >
            {formatRupiah(totalUntung)}
          </p>
          <p className="mt-1 text-xs text-green-700">
            Keuntungan dari produk terjual
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <p className="text-sm font-medium">Untung Bersih</p>
          </div>

          <p
            className={`mt-3 break-words text-xl font-bold sm:text-2xl ${
              untungBersih < 0 ? "text-red-700" : "text-emerald-800"
            }`}
          >
            {formatRupiah(untungBersih)}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Perhitungan bersih harian
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h18m-5 5h2"
              />
            </svg>
            <p className="text-sm font-medium">Saldo Real</p>
          </div>

          <p className="mt-3 break-words text-xl font-bold text-amber-800 sm:text-2xl">
            {saldoRealInput === "" ? "—" : formatRupiah(saldoReal)}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Uang aktual yang dihitung
          </p>
        </div>
      </section>

      {/* DAFTAR PRODUK */}
      <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 sm:text-lg">
              Input Rekap Produk
            </h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Masukkan stok awal dan sisa setiap produk.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700">
            {rekap.length} produk
          </span>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col items-center justify-center px-4 py-12">
            <div
              className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
              role="status"
              aria-label="Memuat data"
            />
            <p className="mt-4 text-sm text-gray-500">
              Memuat data produk...
            </p>
          </div>
        ) : error && products.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">
              Data produk tidak dapat ditampilkan.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-7 w-7 text-gray-400"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7h18M5 7l1 14h12l1-14M9 7V4h6v3"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900">
              Belum ada produk aktif
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Produk aktif akan muncul di halaman rekap harian.
            </p>
          </div>
        ) : (
          <>
            {/* KARTU MOBILE */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {rekap.map((product) => {
                const input = productInputs[product.id];

                return (
                  <article key={product.id} className="min-w-0 p-4">
                    {/* NAMA PRODUK */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Nama Produk
                        </p>
                        <h3 className="mt-1 break-words text-base font-bold capitalize leading-6 text-gray-900">
                          {product.item}
                        </h3>
                      </div>

                      {product.sudahDiisi && (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            product.valid
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {product.valid ? "Valid" : "Periksa sisa"}
                        </span>
                      )}
                    </div>

                    {/* HARGA */}
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                        <p className="text-[11px] text-gray-500">
                          Harga Beli
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-gray-700">
                          {formatRupiah(Number(product.harga_beli))}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl bg-blue-50 p-3">
                        <p className="text-[11px] text-blue-600">
                          Harga Jual
                        </p>
                        <p className="mt-1 break-words text-sm font-bold text-blue-700">
                          {formatRupiah(Number(product.harga_jual))}
                        </p>
                      </div>
                    </div>

                    {/* INPUT STOK DAN SISA */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <label
                          htmlFor={`stok-${product.id}`}
                          className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                          Stok Awal
                        </label>
                        <input
                          id={`stok-${product.id}`}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          aria-label={`Stok ${product.item}`}
                          value={input?.stok ?? ""}
                          onChange={(event) =>
                            updateProductInput(
                              product.id,
                              "stok",
                              event.target.value,
                            )
                          }
                          className="min-h-12 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-3 text-center text-base font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          placeholder="0"
                        />
                      </div>

                      <div className="min-w-0">
                        <label
                          htmlFor={`sisa-${product.id}`}
                          className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                          Sisa
                        </label>
                        <input
                          id={`sisa-${product.id}`}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          aria-label={`Sisa ${product.item}`}
                          value={input?.sisa ?? ""}
                          onChange={(event) =>
                            updateProductInput(
                              product.id,
                              "sisa",
                              event.target.value,
                            )
                          }
                          className={`min-h-12 w-full min-w-0 rounded-xl border bg-white px-3 py-3 text-center text-base font-semibold text-gray-900 outline-none focus:ring-4 ${
                            !product.valid && product.sudahDiisi
                              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                          }`}
                          placeholder="0"
                        />

                        {!product.valid && product.sudahDiisi && (
                          <p className="mt-1.5 text-xs leading-5 text-red-600">
                            Sisa tidak boleh melebihi stok.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* HASIL OTOMATIS */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-gray-100 p-3">
                        <p className="text-xs text-gray-500">Terjual</p>
                        <p className="mt-1 text-base font-bold text-gray-900">
                          {product.valid ? product.terjual : "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <p className="text-xs text-blue-600">Omzet</p>
                        <p className="mt-1 break-words text-sm font-bold text-blue-800">
                          {product.valid
                            ? formatRupiah(product.omzet)
                            : "—"}
                        </p>
                      </div>

                      <div className="col-span-2 rounded-xl border border-green-100 bg-green-50 p-3">
                        <p className="text-xs text-green-700">Untung</p>
                        <p
                          className={`mt-1 break-words text-base font-bold ${
                            product.untung < 0
                              ? "text-red-600"
                              : "text-green-800"
                          }`}
                        >
                          {product.valid
                            ? formatRupiah(product.untung)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* TABEL DESKTOP DAN TABLET */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Item</th>
                    <th className="whitespace-nowrap px-4 py-4 text-right font-semibold">
                      Harga Beli
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 text-right font-semibold">
                      Harga Jual
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Stok
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Sisa
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Terjual
                    </th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Omzet
                    </th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Untung
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {rekap.map((product) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-medium capitalize text-gray-900">
                        {product.item}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right text-gray-600">
                        {formatRupiah(Number(product.harga_beli))}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right text-gray-600">
                        {formatRupiah(Number(product.harga_jual))}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          aria-label={`Stok ${product.item}`}
                          value={productInputs[product.id]?.stok ?? ""}
                          onChange={(event) =>
                            updateProductInput(
                              product.id,
                              "stok",
                              event.target.value,
                            )
                          }
                          className="min-h-11 w-20 rounded-lg border border-gray-300 px-2 py-2 text-center text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="0"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          aria-label={`Sisa ${product.item}`}
                          value={productInputs[product.id]?.sisa ?? ""}
                          onChange={(event) =>
                            updateProductInput(
                              product.id,
                              "sisa",
                              event.target.value,
                            )
                          }
                          className={`min-h-11 w-20 rounded-lg border px-2 py-2 text-center text-base outline-none focus:ring-2 ${
                            !product.valid && product.sudahDiisi
                              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                          }`}
                          placeholder="0"
                        />

                        {!product.valid && product.sudahDiisi && (
                          <p className="mt-1 text-xs text-red-600">
                            Sisa melebihi stok
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center font-medium text-gray-900">
                        {product.valid ? product.terjual : "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-blue-700">
                        {product.valid
                          ? formatRupiah(product.omzet)
                          : "—"}
                      </td>

                      <td
                        className={`whitespace-nowrap px-4 py-4 text-right font-medium ${
                          product.untung < 0
                            ? "text-red-600"
                            : "text-green-700"
                        }`}
                      >
                        {product.valid
                          ? formatRupiah(product.untung)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* FOOTER PRODUK */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs leading-5 text-gray-500">
            {loading
              ? "Sedang mengambil data dari database..."
              : `Menampilkan ${products.length} jenis produk dari Supabase.`}
          </p>
        </div>
      </section>

      {/* RINGKASAN SALDO */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-4 sm:px-5">
          <h2 className="text-base font-bold text-gray-900">
            Ringkasan Saldo
          </h2>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Masukkan uang aktual untuk membandingkannya dengan omzet.
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <label
              htmlFor="saldo-real"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Saldo Real (Rp)
            </label>

            <input
              id="saldo-real"
              type="text"
              inputMode="numeric"
              aria-label="Saldo real"
              value={
                saldoRealInput === "" ? "" : formatRupiah(saldoReal)
              }
              onChange={(event) => updateSaldoReal(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-base font-semibold text-amber-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              placeholder="Masukkan saldo real"
            />

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Masukkan jumlah uang yang benar-benar tersedia. Gunakan
              angka saja.
            </p>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              saldoSelisih < 0
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <p className="text-sm font-medium text-gray-600">
              Selisih Saldo Real dengan Omzet
            </p>

            <p
              className={`mt-2 break-words text-xl font-bold sm:text-2xl ${
                saldoSelisih < 0 ? "text-red-700" : "text-gray-900"
              }`}
            >
              {saldoRealInput === ""
                ? "—"
                : formatRupiah(saldoSelisih)}
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              {saldoRealInput === ""
                ? "Isi saldo real untuk melihat selisih."
                : saldoSelisih < 0
                  ? "Saldo real lebih rendah daripada total omzet."
                  : saldoSelisih > 0
                    ? "Saldo real lebih tinggi daripada total omzet."
                    : "Saldo real sama dengan total omzet."}
            </p>
          </div>
        </div>
      </section>

      {/* CARA MENGGUNAKAN */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
            />
          </svg>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-900">
              Cara menggunakan
            </p>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              Isi stok awal dan sisa setiap produk. Jumlah terjual,
              omzet, dan untung akan dihitung otomatis. Masukkan
              saldo real sesuai uang yang benar-benar ada, kemudian
              tekan tombol Simpan Rekap untuk menyimpan data ke Supabase.
            </p>
          </div>
        </div>
      </div>

      {/* TOMBOL SIMPAN */}
      <div className="sticky bottom-0 z-10 -mx-1 border-t border-gray-200 bg-white/95 p-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <button
          type="button"
          onClick={simpanRekap}
          disabled={loading || saving || products.length === 0}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
        >
          {saving && (
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}

          {saving ? "Menyimpan..." : "Simpan Rekap"}
        </button>
      </div>
    </div>
  );
}