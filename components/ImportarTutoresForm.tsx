"use client";

import { useActionState } from "react";
import { importarTutoresMasivo, estadoInicialImportacion } from "@/lib/actions-importacion";
import { BotonGuardar } from "@/components/BotonGuardar";

export function ImportarTutoresForm() {
  const [resultado, accion] = useActionState(importarTutoresMasivo, estadoInicialImportacion);

  return (
    <div className="space-y-4">
      <form action={accion} className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-[var(--color-ink-soft)]">
          Archivo (.xlsx o .csv)
          <input
            type="file"
            name="archivo"
            accept=".xlsx,.xls,.csv"
            required
            className="mt-1 block text-sm"
          />
        </label>
        <BotonGuardar
          textoGuardando="Importando…"
          textoGuardado="✓ Procesado"
          className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          Importar
        </BotonGuardar>
      </form>

      {resultado.procesado && (
        <div className="space-y-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Resultado ({resultado.filas.filter((f) => f.ok).length} de {resultado.filas.length} filas ok)
          </p>
          {resultado.filas.map((f, i) => (
            <p
              key={i}
              className={`text-sm ${f.ok ? "text-[var(--color-green)]" : "text-red-600"}`}
            >
              Fila {f.fila}: {f.mensaje}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
