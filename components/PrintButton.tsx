"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-sm font-bold text-white"
    >
      Imprimir / Guardar PDF
    </button>
  );
}
