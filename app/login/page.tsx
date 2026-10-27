"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

async function handleLogin(e: FormEvent<HTMLFormElement>) {
e.preventDefault();


setError("");
setLoading(true);

try {
  const supabase = createClient();

  const { error: loginError } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

  if (loginError) {
    setError("Email atau password salah.");
    return;
  }

  router.replace("/");
  router.refresh();
} catch {
  setError("Terjadi kesalahan. Silakan coba kembali.");
} finally {
  setLoading(false);
}


}

return ( <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8"> <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
{/* Header */} <div className="mb-8 text-center"> <h1 className="text-3xl font-bold text-gray-900">
Login </h1>


      <p className="mt-2 text-sm text-gray-500">
        Silakan masuk ke akun Anda
      </p>
    </div>

    {/* Form Login */}
    <form onSubmit={handleLogin} className="space-y-5">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Masukkan email"
          autoComplete="username"
          required
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Masukkan password"
          autoComplete="current-password"
          required
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        />
      </div>

      {/* Pesan Error */}
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {/* Tombol Login */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>

    {/* Footer */}
    <p className="mt-6 text-center text-xs text-gray-400">
      Sistem Manajemen Toko
    </p>
  </div>
</main>


);
}
