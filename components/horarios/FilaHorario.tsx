"use client";

import { useActionState } from "react";
import { actualizarBloqueHorario, eliminarBloqueHorario, type EstadoBloqueHorario } from "@/lib/actions-horarios";
import { BotonGuardar } from "@/components/BotonGuardar";

const ESTADO_INICIAL: EstadoBloqueHorario = { error: null };

const cellInput =
  "w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm outline-none focus:border-[var(--color-green)]";

export function FilaHorario({
  bloque,
  aulaLabel,
  materias,
  docentes,
  dias,
}: {
  bloque: {
    id: string;
    materiaId: string;
    docenteId: string | null;
    diaSemana: string;
    horaInicioMin: number;
    horaFinMin: number;
  };
  aulaLabel: string;
  materias: { id: string; nombre: string }[];
  docentes: { id: string; nombre: string }[];
  dias: { value: string; label: string }[];
}) {
  const [estado, formAction, pending] = useActionState(actualizarBloqueHorario, ESTADO_INICIAL);
  const formId = `form-bloque-${bloque.id}`;

  return (
    <tr className="border-t border-[var(--color-line)] align-top">
      <td className="px-2 py-1.5 text-xs text-[var(--color-ink-soft)]">{aulaLabel}</td>
      <td className="px-2 py-1.5">
        <select form={formId} name="materiaId" defaultValue={bloque.materiaId} className={cellInput}>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1.5">
        <select form={formId} name="docenteId" defaultValue={bloque.docenteId ?? ""} className={cellInput}>
          <option value="">Sin asignar</option>
          {docentes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1.5">
        <select form={formId} name="diaSemana" defaultValue={bloque.diaSemana} className={cellInput}>
          {dias.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1.5">
        <input
          form={formId}
          type="time"
          name="horaInicio"
          defaultValue={minutosAHora24(bloque.horaInicioMin)}
          className={cellInput}
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          form={formId}
          type="time"
          name="horaFin"
          defaultValue={minutosAHora24(bloque.horaFinMin)}
          className={cellInput}
        />
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap">
        <div className="flex items-start gap-1">
          <button
            form={formId}
            disabled={pending}
            className="rounded-lg bg-[var(--color-green)] px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
          <form id={formId} action={formAction} className="hidden">
            <input type="hidden" name="bloqueId" value={bloque.id} />
          </form>
          <form action={eliminarBloqueHorario}>
            <input type="hidden" name="bloqueId" value={bloque.id} />
            <BotonGuardar textoGuardado="✓ Quitado" className="text-xs font-bold text-red-600 disabled:opacity-60">
              Quitar
            </BotonGuardar>
          </form>
        </div>
        {estado.error && (
          <p className="mt-1 max-w-[240px] rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium leading-snug text-red-700">
            {estado.error}
          </p>
        )}
      </td>
    </tr>
  );
}

function minutosAHora24(minutos: number): string {
  const h = Math.floor(minutos / 60).toString().padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
