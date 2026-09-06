import Link from "next/link";
import { solicitarRecuperacionPassword } from "@/lib/actions-recuperacion";
import { BotonGuardar } from "@/components/BotonGuardar";

export default async function RecuperarPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { enviado } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-paper-dark)] px-6">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--color-line)] bg-white p-8 shadow-[0_20px_50px_rgba(22,50,74,0.12)]">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
          Recuperar contraseña
        </h1>

        {enviado ? (
          <>
            <p className="mt-4 rounded-lg bg-[var(--color-paper-dark)] px-3.5 py-3 text-sm text-[var(--color-ink)]">
              Si ese correo o cédula existe en nuestro sistema, te enviamos una contraseña
              temporal por correo. Revisa tu bandeja de entrada (y spam) e inicia sesión con ella.
            </p>
            <Link
              href="/admin/login"
              className="mt-6 block text-center text-sm font-bold text-[var(--color-green)]"
            >
              ← Volver a Acceder
            </Link>
          </>
        ) : (
          <>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
              Escribe tu correo o cédula y te enviaremos una contraseña temporal.
            </p>
            <form action={solicitarRecuperacionPassword}>
              <label className="mt-7 block text-sm font-semibold text-[var(--color-ink)]">
                Correo o cédula
                <input
                  name="identificador"
                  type="text"
                  required
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-dark)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-green)] focus:bg-white focus:ring-4 focus:ring-[var(--color-green)]/10"
                />
              </label>

              <BotonGuardar
                textoGuardando="Enviando…"
                className="mt-7 w-full rounded-xl bg-[var(--color-green)] py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(28,110,158,0.35)] transition hover:bg-[var(--color-green-deep)] disabled:opacity-60"
              >
                Enviar
              </BotonGuardar>
            </form>
            <Link
              href="/admin/login"
              className="mt-4 block text-center text-sm font-bold text-[var(--color-green)]"
            >
              ← Volver a Acceder
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
