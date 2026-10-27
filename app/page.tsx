"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "../lib/supabase/client";

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

type UserInfo = {
  email: string;
  nama: string;
  role: "admin" | "penjaga_toko";
};

export default function Home() {
  const [activePage, setActivePage] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();

  // Batasi halaman berdasarkan role pengguna.
  const pages =
    userInfo?.role === "penjaga_toko"
      ? allPages.slice(0, 3)
      : allPages;

  const ActivePage = pages[activePage - 1].component;

  // Memuat informasi pengguna dan memantau status autentikasi.
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (authError || !user) {
          setUserInfo(null);
          setLoadingUser(false);
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("id, nama, role")
            .eq("id", user.id)
            .single();

        if (!mounted) return;

        if (
          profileError ||
          !profile ||
          !["admin", "penjaga_toko"].includes(profile.role)
        ) {
          setUserInfo(null);
          setLoadingUser(false);

          alert(
            "Profil tidak ditemukan atau role pengguna tidak valid."
          );

          await supabase.auth.signOut();

          if (mounted) {
            router.replace("/login");
          }

          return;
        }

        setUserInfo({
          email: user.email ?? "Email tidak tersedia",
          nama: profile.nama ?? "Nama tidak tersedia",
          role: profile.role as "admin" | "penjaga_toko",
        });

        setLoadingUser(false);
      } catch (error) {
        console.error("Gagal memuat pengguna:", error);

        if (!mounted) return;

        setUserInfo(null);
        setLoadingUser(false);
        router.replace("/login");
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUserInfo(null);
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Pastikan halaman aktif selalu sesuai dengan role pengguna.
  useEffect(() => {
    if (userInfo?.role === "penjaga_toko") {
      setActivePage((current) => Math.min(current, 3));
    }
  }, [userInfo?.role]);

  // Fungsi logout dengan penanganan error.
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUserInfo(null);
      window.location.replace("/login");
    } catch (error) {
      console.error("Gagal logout:", error);

      alert("Gagal keluar. Silakan coba lagi.");

      setLoggingOut(false);
    }
  }

  function getRoleLabel(role: UserInfo["role"]) {
    return role === "admin" ? "Admin" : "Penjaga Toko";
  }

  function getRoleStyle(role: UserInfo["role"]) {
    return role === "admin"
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800";
  }

  // Panel informasi akun untuk desktop.
  const UserPanel = () => (
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
            className="mt-3 w-full rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100 text-gray-900 md:flex-row">
      {/* Sidebar Desktop */}
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

        <UserPanel />

        <div className="border-t border-gray-700 p-4 text-sm text-gray-400">
          SPA {pages.length} Halaman
        </div>
      </aside>

      {/* Header dan Navigasi Mobile */}
      <div className="bg-gray-900 text-white md:hidden">
        <header className="flex items-start justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-lg font-bold">
              Aplikasi Toko
            </h1>

            <p className="text-xs text-gray-400">
              Dashboard
            </p>

            {!loadingUser && userInfo && (
              <div className="mt-3">
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
              </div>
            )}
          </div>

          <span className="shrink-0 rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
            {activePage}/{pages.length}
          </span>
        </header>

        <nav
          aria-label="Navigasi halaman"
          className="flex gap-2 overflow-x-auto border-t border-gray-700 px-4 py-3 sm:px-6"
        >
          {pages.map((page, index) => {
            const pageNumber = index + 1;
            const isActive = activePage === pageNumber;

            return (
              <button
                key={page.title}
                type="button"
                onClick={() => setActivePage(pageNumber)}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {page.title}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>

      {/* Konten Utama */}
      <main className="flex min-h-screen min-w-0 flex-1 flex-col md:min-h-screen">
        {/* Header Desktop */}
        <header className="sticky top-0 z-20 hidden h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 md:flex lg:px-8">
          <h2 className="text-lg font-semibold">
            {pages[activePage - 1].title}
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

        <section className="flex w-full flex-1 flex-col p-3 sm:p-5 lg:p-6">
          <div className="w-full flex-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <ActivePage />

            {/* Indikator Halaman */}
            <div className="mt-8 flex justify-center gap-2">
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
                  className={`h-2.5 rounded-full transition-all ${
                    activePage === index + 1
                      ? "w-8 bg-blue-600"
                      : "w-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            {/* Tombol Navigasi */}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  setActivePage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                disabled={activePage === 1}
                className="w-full rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                ← Sebelumnya
              </button>

              <button
                type="button"
                onClick={() =>
                  setActivePage((current) =>
                    Math.min(pages.length, current + 1)
                  )
                }
                disabled={activePage === pages.length}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Selanjutnya →
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              {activePage} dari {pages.length} halaman
            </p>
          </div>
        </section>

        <footer className="px-4 py-4 text-center text-xs text-gray-400 sm:px-6">
          © 2026 Aplikasi Toko
        </footer>
      </main>
    </div>
  );
}
