"use client";

export function BotonImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-[var(--color-green)] px-5 py-2.5 text-sm font-bold text-white print:hidden"
    >
      Imprimir / Guardar como PDF
    </button>
  );
}
