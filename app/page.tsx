"use client";

import { useEffect, useState } from "react";

import { useAuth } from "../hooks/useAuth";

import Page1 from "../components/pages/page1";
import Page2 from "../components/pages/page2";
import Page3 from "../components/pages/page3";
import Page4 from "../components/pages/page4";
import Page5 from "../components/pages/page5";
import Page6 from "../components/pages/page6";

const allPages = [
  { title: "Manajemen Produk", component: Page1 },
  { title: "Rekap Omzet Harian", component: Page2 },
  { title: "Riwayat Omzet Harian", component: Page3 },
  { title: "Rekap Modal dan Saldo", component: Page4 },
  { title: "Riwayat Modal dan Saldo", component: Page5 },
  { title: "Uang Dingin", component: Page6 },
];

export default function Home() {
  const [activePage, setActivePage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMobileAccount, setShowMobileAccount] =
    useState(false);

  const {
    userInfo,
    loadingUser,
    loggingOut,
    handleLogout,
  } = useAuth();

  const pages =
    userInfo?.role === "penjaga_toko"
      ? allPages.slice(0, 3)
      : allPages;

  const currentPageIndex = Math.min(
    activePage - 1,
    pages.length - 1
  );

  const currentPage = pages[currentPageIndex];
  const ActivePage = currentPage?.component;

  useEffect(() => {
    if (userInfo?.role === "penjaga_toko") {
      setActivePage((current) => Math.min(current, 3));
    }
  }, [userInfo?.role]);

  function getRoleLabel(role: "admin" | "penjaga_toko") {
    return role === "admin" ? "Admin" : "Penjaga Toko";
  }

  function getRoleStyle(role: "admin" | "penjaga_toko") {
    return role === "admin"
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800";
  }

  function selectPage(pageNumber: number) {
    setActivePage(pageNumber);
    setMenuOpen(false);
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100 text-gray-900 md:flex-row">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden w-64 shrink-0 flex-col bg-gray-900 text-white md:flex">
        <div className="border-b border-gray-700 px-6 py-6">
          <h1 className="text-xl font-bold">
            Aplikasi Toko
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Dashboard
          </p>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {pages.map((page, index) => {
            const pageNumber = index + 1;
            const isActive = activePage === pageNumber;

            return (
              <button
                key={page.title}
                type="button"
                onClick={() => setActivePage(pageNumber)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full rounded-lg px-4 py-3 text-left transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {page.title}
              </button>
            );
          })}
        </nav>

        {/* AKUN DESKTOP */}
        <div className="border-t border-gray-700 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Akun Login
          </p>

          {loadingUser ? (
            <p className="text-sm text-gray-400">
              Memuat akun...
            </p>
          ) : userInfo ? (
            <>
              <p className="break-all text-sm font-medium text-white">
                {userInfo.nama}
              </p>

              <p className="mt-1 break-all text-xs text-gray-400">
                {userInfo.email}
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleStyle(
                  userInfo.role
                )}`}
              >
                {getRoleLabel(userInfo.role)}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-3 min-h-11 w-full rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut ? "Keluar..." : "Keluar"}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-400">
              Tidak ada sesi login
            </p>
          )}
        </div>

        <div className="border-t border-gray-700 p-4 text-sm text-gray-400">
          SPA {pages.length} Halaman
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="sticky top-0 z-40 bg-gray-900 text-white shadow-md md:hidden">
        <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 py-3">
          {/* JUDUL */}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold tracking-tight">
              Aplikasi Toko
            </h1>

            <p className="mt-0.5 text-xs text-gray-400">
              {currentPage?.title ?? "Dashboard"}
            </p>
          </div>

          {/* AKUN MOBILE */}
          <button
            type="button"
            onClick={() => {
              setShowMobileAccount((current) => !current);
              setMenuOpen(false);
            }}
            aria-expanded={showMobileAccount}
            aria-label="Tampilkan informasi akun"
            className="flex min-h-11 max-w-[45%] shrink-0 items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 transition hover:bg-gray-700 active:scale-95"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {userInfo?.nama?.charAt(0).toUpperCase() ?? "U"}
            </span>

            <span className="min-w-0 text-left">
              <span className="block truncate text-xs font-semibold">
                {loadingUser
                  ? "Memuat..."
                  : userInfo?.nama ?? "Akun"}
              </span>

              <span className="block text-[10px] text-gray-400">
                {userInfo
                  ? getRoleLabel(userInfo.role)
                  : "Pengguna"}
              </span>
            </span>
          </button>

          {/* HAMBURGER BUTTON */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen((current) => !current);
              setShowMobileAccount(false);
            }}
            aria-label={
              menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 transition hover:bg-gray-700 active:scale-95"
          >
            {menuOpen ? (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* DROPDOWN MENU MOBILE */}
        {menuOpen && (
          <>
            {/* BACKDROP */}
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 top-[72px] z-40 bg-black/40"
            />

            {/* PANEL NAVIGASI */}
            <nav
              id="mobile-navigation"
              aria-label="Navigasi utama"
              className="absolute left-0 right-0 top-full z-50 border-t border-gray-700 bg-gray-900 px-4 pb-4 pt-3 shadow-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Menu Navigasi
                </p>

                <span className="rounded-full bg-gray-800 px-2.5 py-1 text-[11px] text-gray-400">
                  {pages.length} halaman
                </span>
              </div>

              <div className="max-h-[60dvh] space-y-1 overflow-y-auto">
                {pages.map((page, index) => {
                  const pageNumber = index + 1;
                  const isActive = activePage === pageNumber;

                  return (
                    <button
                      key={page.title}
                      type="button"
                      onClick={() => selectPage(pageNumber)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition active:scale-[0.99] ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {pageNumber}
                      </span>

                      <span className="min-w-0 flex-1">
                        {page.title}
                      </span>

                      {isActive && (
                        <svg
                          className="h-5 w-5 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m5 12 4 4L19 6"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 border-t border-gray-700 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowMobileAccount(true);
                  }}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-gray-800"
                >
                  <svg
                    className="h-5 w-5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                    />
                  </svg>

                  Informasi Akun
                </button>
              </div>
            </nav>
          </>
        )}

        {/* PANEL AKUN MOBILE */}
        {showMobileAccount && (
          <>
            <button
              type="button"
              aria-label="Tutup informasi akun"
              onClick={() => setShowMobileAccount(false)}
              className="fixed inset-0 top-[72px] z-40 bg-black/40"
            />

            <section
              aria-label="Informasi akun"
              className="absolute left-3 right-3 top-full z-50 mt-2 rounded-2xl border border-gray-700 bg-gray-800 p-4 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  Informasi Akun
                </h2>

                <button
                  type="button"
                  onClick={() => setShowMobileAccount(false)}
                  aria-label="Tutup informasi akun"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-700 hover:text-white"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6l12 12M18 6L6 18"
                    />
                  </svg>
                </button>
              </div>

              {loadingUser ? (
                <p className="text-sm text-gray-400">
                  Memuat akun...
                </p>
              ) : userInfo ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                      {userInfo.nama.charAt(0).toUpperCase()}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-white">
                        {userInfo.nama}
                      </p>

                      <p className="mt-1 break-all text-xs leading-5 text-gray-400">
                        {userInfo.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleStyle(
                      userInfo.role
                    )}`}
                  >
                    {getRoleLabel(userInfo.role)}
                  </span>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
                      />
                    </svg>

                    {loggingOut ? "Keluar..." : "Keluar dari akun"}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  Tidak ada sesi login
                </p>
              )}
            </section>
          </>
        )}
      </header>

      {/* KONTEN UTAMA */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col md:min-h-screen">
        {/* HEADER DESKTOP */}
        <header className="sticky top-0 z-20 hidden h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 md:flex lg:px-8">
          <h2 className="text-lg font-semibold">
            {currentPage?.title ?? "Dashboard"}
          </h2>

          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">
              {loadingUser
                ? "Memuat akun..."
                : userInfo?.nama ?? ""}
            </p>

            <p className="text-xs text-gray-500">
              {userInfo
                ? `${userInfo.email} · ${getRoleLabel(
                    userInfo.role
                  )}`
                : ""}
              {" · "}
              Halaman {activePage} dari {pages.length}
            </p>
          </div>
        </header>

        {/* AREA KONTEN */}
        <section className="flex w-full flex-1 flex-col p-3 sm:p-5 lg:p-6">
          <div className="flex w-full flex-1 flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-6 lg:p-8">
            <div className="mb-4 border-b border-gray-100 pb-3 md:hidden">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Halaman aktif
              </p>

              <h2 className="mt-1 text-base font-bold leading-6 text-gray-800 sm:text-lg">
                {currentPage?.title ?? "Dashboard"}
              </h2>
            </div>

            {/* HALAMAN AKTIF */}
            <div className="min-w-0 flex-1">
              {ActivePage && <ActivePage />}
            </div>

            {/* INDIKATOR HALAMAN */}
            <div className="mt-6 flex justify-center gap-2 sm:mt-8">
              {pages.map((page, index) => (
                <button
                  key={page.title}
                  type="button"
                  onClick={() => setActivePage(index + 1)}
                  aria-label={`Buka ${page.title}`}
                  aria-current={
                    activePage === index + 1
                      ? "page"
                      : undefined
                  }
                  className={`min-h-6 rounded-full transition-all ${
                    activePage === index + 1
                      ? "w-8 bg-blue-600"
                      : "w-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            {/* TOMBOL NAVIGASI */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 sm:mt-8 sm:flex sm:justify-between sm:gap-4 sm:pt-6">
              <button
                type="button"
                onClick={() =>
                  setActivePage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                disabled={activePage === 1}
                className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-36 sm:px-5"
              >
                <span aria-hidden="true">←</span>
                <span>Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActivePage((current) =>
                    Math.min(pages.length, current + 1)
                  )
                }
                disabled={activePage === pages.length}
                className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-36 sm:px-5"
              >
                <span>Selanjutnya</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              Halaman {activePage} dari {pages.length}
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="px-4 pb-5 pt-2 text-center text-[11px] text-gray-400 sm:px-6 sm:py-4 sm:text-xs">
          © 2026 Aplikasi Toko
        </footer>
      </main>
    </div>
  );
}
