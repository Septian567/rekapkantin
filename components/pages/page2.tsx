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



return ( <div className="w-full"> <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"> <div> <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
Rekap Omzet Harian </h1>


      <p className="mt-2 text-sm text-gray-500">
        Isi stok dan sisa. Terjual, omzet, dan untung dihitung otomatis.
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
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

        <div>
          <p className="text-xs text-gray-500">Tanggal Rekap</p>
          <p className="text-sm font-semibold text-gray-900">
            {tanggalHariIni}
          </p>
        </div>
      </div>

      <div className="flex h-fit items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
        <span className="h-2 w-2 rounded-full bg-blue-600" />
        {products.length} jenis produk
      </div>
    </div>
  </div>

  {error && (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {error}
    </div>
  )}

  {success && (
    <div
      role="status"
      className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
    >
      {success}
    </div>
  )}

  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-4 font-semibold">Item</th>
            <th className="px-4 py-4 text-right font-semibold">
              Harga Beli
            </th>
            <th className="px-4 py-4 text-right font-semibold">
              Harga Jual
            </th>
            <th className="px-4 py-4 text-center font-semibold">Stok</th>
            <th className="px-4 py-4 text-center font-semibold">Sisa</th>
            <th className="px-4 py-4 text-center font-semibold">Terjual</th>
            <th className="px-4 py-4 text-right font-semibold">Omzet</th>
            <th className="px-4 py-4 text-right font-semibold">Untung</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-gray-500"
              >
                Memuat data produk...
              </td>
            </tr>
          ) : error && products.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-gray-500"
              >
                Data produk tidak dapat ditampilkan.
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-gray-500"
              >
                Belum ada produk aktif.
              </td>
            </tr>
          ) : (
            rekap.map((product) => (
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
                    className="w-20 rounded-md border border-gray-300 px-2 py-2 text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    className="w-20 rounded-md border border-gray-300 px-2 py-2 text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  {product.valid ? formatRupiah(product.omzet) : "—"}
                </td>

                <td
                  className={`whitespace-nowrap px-4 py-4 text-right font-medium ${
                    product.untung < 0
                      ? "text-red-600"
                      : "text-green-700"
                  }`}
                >
                  {product.valid ? formatRupiah(product.untung) : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>

        <tfoot className="border-t-2 border-gray-200">
          <tr className="bg-green-50">
            <td
              colSpan={7}
              className="px-4 py-4 text-left font-semibold text-green-800"
            >
              Total Untung
            </td>

            <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-green-800">
              {formatRupiah(totalUntung)}
            </td>
          </tr>

          <tr className="bg-emerald-50">
            <td
              colSpan={7}
              className="px-4 py-4 text-left font-semibold text-emerald-800"
            >
              Untung Bersih
            </td>

            <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-emerald-800">
              {formatRupiah(untungBersih)}
            </td>
          </tr>

          <tr className="bg-blue-50">
            <td
              colSpan={7}
              className="px-4 py-4 text-left font-semibold text-blue-800"
            >
              Total Omzet
            </td>

            <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-blue-800">
              {formatRupiah(totalOmzet)}
            </td>
          </tr>

          <tr className="bg-amber-50">
            <td
              colSpan={7}
              className="px-4 py-4 text-left font-semibold text-amber-800"
            >
              Saldo Real
            </td>

            <td className="px-4 py-3">
              <input
                type="text"
                inputMode="numeric"
                aria-label="Saldo real"
                value={
                  saldoRealInput === ""
                    ? ""
                    : formatRupiah(saldoReal)
                }
                onChange={(event) =>
                  updateSaldoReal(event.target.value)
                }
                className="w-full min-w-36 rounded-md border border-amber-300 bg-white px-2 py-2 text-right font-semibold text-amber-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Rp 0"
              />
            </td>
          </tr>

          <tr className="bg-gray-50">
            <td
              colSpan={7}
              className="px-4 py-4 text-left font-semibold text-gray-700"
            >
              Selisih Saldo Real dengan Omzet
            </td>

            <td
              className={`whitespace-nowrap px-4 py-4 text-right font-semibold ${
                saldoSelisih < 0 ? "text-red-600" : "text-gray-800"
              }`}
            >
              {saldoRealInput === "" ? "—" : formatRupiah(saldoSelisih)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500">
        {loading
          ? "Sedang mengambil data dari database..."
          : `Menampilkan ${products.length} jenis produk dari Supabase.`}
      </p>
    </div>
  </div>

  <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
    <p className="text-sm leading-6 text-blue-800">
      <span className="font-semibold">Cara menggunakan:</span> Isi angka
      stok awal dan sisa setiap produk. Terjual, omzet, dan untung akan
      dihitung otomatis. Masukkan saldo real sesuai uang yang benar-benar
      ada. Setelah selesai, tekan tombol Simpan Rekap untuk menyimpan data
      ke Supabase.
    </p>
  </div>

  <div className="mt-5 flex justify-end">
    <button
      type="button"
      onClick={simpanRekap}
      disabled={loading || saving || products.length === 0}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {saving && (
        <svg
          className="h-4 w-4 animate-spin"
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
