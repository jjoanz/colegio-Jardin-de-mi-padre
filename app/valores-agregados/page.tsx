import Link from "next/link";

export default function ValoresAgregadosPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-paper)] px-6 text-center">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-widest text-[var(--color-ink-soft)]"
      >
        ← Volver al inicio
      </Link>
      <h1 className="mt-8 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)] md:text-4xl">
        Valores agregados
      </h1>
      <p className="mt-3 max-w-md text-[var(--color-ink-soft)]">
        Estamos preparando este espacio. Muy pronto encontrarás aquí los servicios adicionales del colegio.
      </p>
    </main>
  );
}
