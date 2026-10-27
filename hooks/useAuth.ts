"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export type UserInfo = {
  email: string;
  nama: string;
  role: "admin" | "penjaga_toko";
};

export function useAuth() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();

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
          role: profile.role as UserInfo["role"],
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

  const handleLogout = useCallback(async () => {
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
  }, [loggingOut]);

  return {
    userInfo,
    loadingUser,
    loggingOut,
    handleLogout,
  };
}

