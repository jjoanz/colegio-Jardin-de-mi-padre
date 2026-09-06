import { cambiarPasswordTutor } from "@/lib/actions-portal";
import { BotonGuardar } from "@/components/BotonGuardar";
import { PasswordInput } from "@/components/PasswordInput";

export default function CambiarPasswordPortalPage() {
  return (
    <div className="mx-auto max-w-sm rounded-3xl border border-[var(--color-line)] bg-white p-8">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
        Cambia tu contraseña
      </h1>
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
        Por seguridad debes cambiar la contraseña temporal antes de continuar.
      </p>

      <form action={cambiarPasswordTutor} className="mt-6">
        <label className="block text-sm font-semibold text-[var(--color-ink)]">
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

        <BotonGuardar
          textoGuardando="Cambiando…"
          className="mt-7 w-full rounded-xl bg-[var(--color-green)] py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(28,110,158,0.35)] transition hover:bg-[var(--color-green-deep)] disabled:opacity-60"
        >
          Cambiar contraseña
        </BotonGuardar>
      </form>
    </div>
  );
}
