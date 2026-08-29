"use client";

import { useEffect } from "react";

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">
          
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
          No se pudo completar la acción
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          {error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-[var(--color-green)] px-6 py-2.5 text-sm font-bold text-white"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
