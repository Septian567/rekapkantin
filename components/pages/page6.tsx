"use client";

import useCatatanUang from "../../hooks/useCatatanUang";
import { formatRupiah, formatTanggal } from "../../utils/format";

export default function Page6() {
  const {
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
  } = useCatatanUang();

  const inputClass =
    "w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

  const buttonClass =
    "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-5 sm:space-y-8 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-2xl">
              💰
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400 sm:text-sm sm:tracking-[0.22em]">
                Catatan Keuangan Kantin
              </p>

              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-4xl">
                Uang Dingin Harian
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Catat uang masuk dan keluar setiap hari dengan praktis.
                Transaksi pada tanggal yang sama akan digabung dalam
                ringkasan harian.
              </p>
            </div>
          </div>

          {/* Tombol ekspor */}
          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={exportExcel}
              disabled={
                !siap ||
                catatan.length === 0 ||
                sedangExportExcel ||
                sedangExportSheets
              }
              className={`${buttonClass} w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 sm:w-auto`}
            >
              {sedangExportExcel ? (
                "Mengekspor Excel..."
              ) : (
                <>
                  <span className="mr-2" aria-hidden="true">
                    📊
                  </span>
                  Export Excel
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void exportGoogleSheets()}
              disabled={
                !siap ||
                catatan.length === 0 ||
                sedangExportSheets ||
                sedangExportExcel
              }
              className={`${buttonClass} w-full border border-sky-700 bg-sky-950/60 text-sky-300 hover:bg-sky-900 sm:w-auto`}
            >
              {sedangExportSheets ? (
                "Mengekspor Google Sheets..."
              ) : (
                <>
                  <span className="mr-2" aria-hidden="true">
                    📄
                  </span>
                  Export Google Sheets
                </>
              )}
            </button>
          </div>
        </header>

        {/* Pesan status */}
        {pesan && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm leading-6 text-slate-200"
          >
            <span className="min-w-0 flex-1 break-words">{pesan}</span>

            <button
              type="button"
              onClick={() => setPesan("")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Tutup pesan"
            >
              ✕
            </button>
          </div>
        )}

        {/* Ringkasan keuangan */}
        <section aria-label="Ringkasan keuangan" className="space-y-3">
          {/* Saldo utama */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 p-5 sm:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl"
            />

            <div className="relative">
              <p className="text-sm font-medium text-slate-300">
                Saldo Akhir
              </p>

              <p
                className={`mt-3 break-words text-3xl font-extrabold tracking-tight sm:text-4xl ${
                  saldoAkhir >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatRupiah(saldoAkhir)}
              </p>

              <p className="mt-3 text-xs text-slate-400">
                Total pemasukan dikurangi total pengeluaran
              </p>
            </div>
          </div>

          {/* Pemasukan dan pengeluaran */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0 rounded-2xl border border-emerald-900/70 bg-slate-900 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-lg"
                  aria-hidden="true"
                >
                  ↗
                </span>

                <p className="text-xs font-medium text-slate-400 sm:text-sm">
                  Uang Masuk
                </p>
              </div>

              <p className="mt-4 break-words text-lg font-bold leading-tight text-emerald-400 sm:text-2xl">
                {formatRupiah(totalUangMasuk)}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl border border-rose-900/70 bg-slate-900 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-lg"
                  aria-hidden="true"
                >
                  ↘
                </span>

                <p className="text-xs font-medium text-slate-400 sm:text-sm">
                  Uang Keluar
                </p>
              </div>

              <p className="mt-4 break-words text-lg font-bold leading-tight text-rose-400 sm:text-2xl">
                {formatRupiah(totalUangKeluar)}
              </p>
            </div>
          </div>
        </section>

        {/* Form transaksi */}
        <section
          id="form-transaksi"
          className="scroll-mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6"
        >
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">
              {editId ? "✏️" : "＋"}
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold sm:text-xl">
                {editId ? "Edit Transaksi" : "Tambah Transaksi"}
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-400">
                {editId
                  ? "Ubah informasi transaksi yang dipilih."
                  : "Masukkan detail pemasukan atau pengeluaran."}
              </p>
            </div>
          </div>

          <form onSubmit={simpanCatatan} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block min-w-0 space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  Tanggal <span className="text-rose-400">*</span>
                </span>

                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  Keterangan <span className="text-rose-400">*</span>
                </span>

                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Gaji, makan, transportasi"
                  maxLength={500}
                  required
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  Uang Masuk (Rp)
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={uangMasuk}
                  onChange={(e) => setUangMasuk(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} focus:border-emerald-500 focus:ring-emerald-500/20`}
                />

                <span className="block text-xs leading-5 text-slate-500">
                  Isi jika ada pemasukan.
                </span>
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  Uang Keluar (Rp)
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={uangKeluar}
                  onChange={(e) => setUangKeluar(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} focus:border-rose-500 focus:ring-rose-500/20`}
                />

                <span className="block text-xs leading-5 text-slate-500">
                  Isi jika ada pengeluaran.
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-slate-800 pt-4 sm:flex sm:flex-wrap">
              <button
                type="submit"
                disabled={sedangMenyimpan || !siap}
                className={`${buttonClass} w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 sm:w-auto`}
              >
                {sedangMenyimpan
                  ? "Menyimpan..."
                  : editId
                    ? "✓ Simpan Perubahan"
                    : "＋ Tambah Transaksi"}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={`${buttonClass} w-full border border-slate-700 text-slate-300 hover:bg-slate-800 sm:w-auto`}
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
            <h2 className="text-xl font-bold sm:text-2xl">
              Ringkasan Harian
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Pilih tanggal untuk melihat transaksi pada hari tersebut.
            </p>
          </div>

          {!siap ? (
            <div
              role="status"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400"
            >
              Memuat catatan...
            </div>
          ) : ringkasanHarian.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-5 py-10 text-center">
              <div className="text-4xl" aria-hidden="true">
                🧾
              </div>

              <p className="mt-3 font-semibold text-slate-200">
                Belum ada transaksi
              </p>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Tambahkan transaksi pertama menggunakan formulir di atas.
              </p>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("form-transaksi")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className={`${buttonClass} mt-5 bg-emerald-500 text-slate-950 hover:bg-emerald-400`}
              >
                ＋ Buat Transaksi
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {ringkasanHarian.map((item) => {
                const detailTerbuka = tanggalDetail === item.tanggal;

                return (
                  <article
                    key={item.tanggal}
                    className={`min-w-0 overflow-hidden rounded-2xl border bg-slate-900 transition ${
                      detailTerbuka
                        ? "border-emerald-700/70"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">
                            TANGGAL TRANSAKSI
                          </p>

                          <h3 className="mt-1 break-words font-bold text-white sm:text-lg">
                            {formatTanggal(item.tanggal)}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.jumlahTransaksi} transaksi
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setTanggalDetail((sebelumnya) =>
                              sebelumnya === item.tanggal
                                ? null
                                : item.tanggal
                            )
                          }
                          aria-expanded={detailTerbuka}
                          className={`${buttonClass} shrink-0 border border-sky-800 bg-sky-950/40 px-3 text-sky-300 hover:bg-sky-900`}
                        >
                          {detailTerbuka ? "Tutup ▲" : "Detail ▼"}
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="min-w-0 rounded-xl bg-slate-950/70 p-3">
                          <p className="text-xs text-slate-400">Masuk</p>

                          <p className="mt-1 break-words text-sm font-bold text-emerald-400 sm:text-base">
                            {formatRupiah(item.uangMasuk)}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-xl bg-slate-950/70 p-3">
                          <p className="text-xs text-slate-400">Keluar</p>

                          <p className="mt-1 break-words text-sm font-bold text-rose-400 sm:text-base">
                            {formatRupiah(item.uangKeluar)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
                        <span className="text-sm text-slate-400">
                          Saldo berjalan
                        </span>

                        <span
                          className={`break-words text-right text-sm font-bold sm:text-base ${
                            item.saldo >= 0
                              ? "text-sky-400"
                              : "text-rose-400"
                          }`}
                        >
                          {formatRupiah(item.saldo)}
                        </span>
                      </div>
                    </div>

                    {detailTerbuka && (
                      <div className="border-t border-slate-800 bg-slate-950/50 p-4">
                        <div className="mb-4">
                          <h4 className="font-bold text-white">
                            Detail Transaksi
                          </h4>

                          <p className="mt-1 text-sm text-slate-400">
                            {formatTanggal(item.tanggal)}
                          </p>
                        </div>

                        {transaksiDetail.length === 0 ? (
                          <p className="text-sm leading-6 text-slate-400">
                            Tidak ada transaksi untuk tanggal ini.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {transaksiDetail.map((transaksi) => (
                              <div
                                key={transaksi.id}
                                className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-4"
                              >
                                <h5 className="break-words font-semibold leading-6 text-white">
                                  {transaksi.keterangan}
                                </h5>

                                <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <span className="text-slate-400">
                                      Uang masuk
                                    </span>

                                    <span className="break-words text-right font-medium text-emerald-400">
                                      {formatRupiah(transaksi.uangMasuk)}
                                    </span>
                                  </div>

                                  <div className="flex items-start justify-between gap-3">
                                    <span className="text-slate-400">
                                      Uang keluar
                                    </span>

                                    <span className="break-words text-right font-medium text-rose-400">
                                      {formatRupiah(transaksi.uangKeluar)}
                                    </span>
                                  </div>

                                  <div className="flex items-start justify-between gap-3 border-t border-slate-800 pt-2">
                                    <span className="text-slate-400">
                                      Selisih
                                    </span>

                                    <span
                                      className={`break-words text-right font-semibold ${
                                        transaksi.uangMasuk -
                                          transaksi.uangKeluar >=
                                        0
                                          ? "text-sky-400"
                                          : "text-rose-400"
                                      }`}
                                    >
                                      {formatRupiah(
                                        transaksi.uangMasuk -
                                          transaksi.uangKeluar
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      mulaiEdit(transaksi);

                                      document
                                        .getElementById("form-transaksi")
                                        ?.scrollIntoView({
                                          behavior: "smooth",
                                          block: "start",
                                        });
                                    }}
                                    className={`${buttonClass} w-full border border-sky-800 text-sky-300 hover:bg-sky-950`}
                                  >
                                    ✏️ Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void hapusCatatan(transaksi.id)
                                    }
                                    disabled={sedangMenghapus === transaksi.id}
                                    className={`${buttonClass} w-full border border-rose-900 text-rose-300 hover:bg-rose-950`}
                                  >
                                    {sedangMenghapus === transaksi.id
                                      ? "Menghapus..."
                                      : "🗑 Hapus"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-4 text-center">
          <p className="text-xs leading-5 text-slate-500">
            Catatan Keuangan Kantin · Kelola transaksi harian dengan mudah
          </p>
        </footer>
      </div>
    </main>
  );
}
