"use client";

import { useActionState } from "react";
import { actualizarMatriculaMinerd, type EstadoMinerd } from "@/lib/actions";

const ESTADO_INICIAL: EstadoMinerd = { error: null };

export function CeldaMinerd({ estudianteId, valorActual }: { estudianteId: string; valorActual: string | null }) {
  const [estado, formAction, pending] = useActionState(actualizarMatriculaMinerd, ESTADO_INICIAL);

  return (
    <div>
      <form action={formAction} className="flex items-center gap-1.5">
        <input type="hidden" name="estudianteId" value={estudianteId} />
        <input
          name="numeroMatriculaMinerd"
          defaultValue={valorActual ?? ""}
          placeholder="Sin registrar"
          className="w-32 rounded border border-[var(--color-line)] px-2 py-1 font-mono text-xs outline-none focus:border-[var(--color-green)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-[var(--color-line)] px-2 py-1 text-xs font-bold text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-dark)] disabled:opacity-60"
        >
          {pending ? "…" : "Guardar"}
        </button>
      </form>
      {estado.error && <p className="mt-1 max-w-[200px] text-[11px] font-medium text-red-600">{estado.error}</p>}
    </div>
  );
}
