"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      identificador: form.get("identificador"),
      password: form.get("password"),
      redirect: false,
    });

    setCargando(false);
    if (res?.error) {
      setError("Correo/cédula o contraseña incorrectos.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-paper-dark)] px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl border border-[var(--color-line)] bg-white p-8 shadow-[0_20px_50px_rgba(22,50,74,0.12)]"
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
              Acceder
            </h1>
            <p className="text-xs text-[var(--color-ink-soft)]">Personal, maestros y padres/tutores</p>
          </div>
        </div>

        <label className="mt-7 block text-sm font-semibold text-[var(--color-ink)]">
          Correo o cédula
          <input
            name="identificador"
            type="text"
            required
            className="mt-1.5 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-dark)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-green)] focus:bg-white focus:ring-4 focus:ring-[var(--color-green)]/10"
          />
        </label>

        <label className="mt-4 block text-sm font-semibold text-[var(--color-ink)]">
          Contraseña
          <input
            name="password"
            type="password"
            required
            className="mt-1.5 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-dark)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-green)] focus:bg-white focus:ring-4 focus:ring-[var(--color-green)]/10"
          />
        </label>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="mt-7 w-full rounded-xl bg-[var(--color-green)] py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(28,110,158,0.35)] transition hover:bg-[var(--color-green-deep)] disabled:opacity-60"
        >
          {cargando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}