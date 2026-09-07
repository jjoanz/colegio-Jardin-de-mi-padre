"use client";

import { useActionState } from "react";
import { cambiarPasswordAdminUser, type EstadoCambioPassword } from "@/lib/actions-usuarios";
import { BotonGuardar } from "@/components/BotonGuardar";
import { PasswordInput } from "@/components/PasswordInput";

const estadoInicial: EstadoCambioPassword = {};

export default function CambiarPasswordAdminPage() {
  const [estado, accion] = useActionState(cambiarPasswordAdminUser, estadoInicial);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-paper-dark)] px-6">
      <form
        action={accion}
        className="w-full max-w-sm rounded-3xl border border-[var(--color-line)] bg-white p-8 shadow-[0_20px_50px_rgba(22,50,74,0.12)]"
      >
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
          Cambia tu contraseña
        </h1>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
          Por seguridad debes cambiar la contraseña temporal antes de continuar.
        </p>

        <label className="mt-7 block text-sm font-semibold text-[var(--color-ink)]">
          Contraseña actual
          <PasswordInput
            name="passwordActual"
            required
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-dark)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-green)] focus:bg-white focus:ring-4 focus:ring-[var(--color-green)]/10"
          />
        </label>

        <label className="mt-4 block text-sm font-semibold text-[var(--color-ink)]">
          Contraseña nueva (mín. 8 caracteres)
          <PasswordInput
            name="passwordNueva"
            minLength={8}
            required
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-dark)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-green)] focus:bg-white focus:ring-4 focus:ring-[var(--color-green)]/10"
          />
        </label>

        {estado.error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>
        )}

        <BotonGuardar
          textoGuardando="Cambiando…"
          className="mt-7 w-full rounded-xl bg-[var(--color-green)] py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(28,110,158,0.35)] transition hover:bg-[var(--color-green-deep)] disabled:opacity-60"
        >
          Cambiar contraseña
        </BotonGuardar>
      </form>
    </main>
  );
}
