"use client";

import { useActionState } from "react";
import { crearBloqueHorario, type EstadoBloqueHorario } from "@/lib/actions-horarios";
import { BotonGuardar } from "@/components/BotonGuardar";

const ESTADO_INICIAL: EstadoBloqueHorario = { error: null };

const cellInput =
  "w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm outline-none focus:border-[var(--color-green)]";

export function FormNuevoBloque({
  anioSeleccionado,
  aulas,
  materias,
  docentes,
  dias,
  nivelesDeAulas,
  nivelesDeMaterias,
}: {
  anioSeleccionado: string;
  aulas: { id: string; nombre: string; nivelNombre: string }[];
  materias: { id: string; nombre: string; grupo: string }[];
  docentes: { id: string; nombre: string }[];
  dias: { value: string; label: string }[];
  nivelesDeAulas: string[];
  nivelesDeMaterias: string[];
}) {
  const [estado, formAction] = useActionState(crearBloqueHorario, ESTADO_INICIAL);

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
        + Agregar bloque nuevo
      </p>
      <form action={formAction} className="grid grid-cols-2 gap-2 md:grid-cols-6">
        <input type="hidden" name="anioEscolarId" value={anioSeleccionado} />
        <select name="aulaId" required className={cellInput}>
          <option value="">Aula…</option>
          {nivelesDeAulas.map((nivelNombre) => (
            <optgroup key={nivelNombre} label={nivelNombre}>
              {aulas
                .filter((a) => a.nivelNombre === nivelNombre)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <select name="materiaId" required className={cellInput}>
          <option value="">Materia…</option>
          {nivelesDeMaterias.map((nivelNombre) => (
            <optgroup key={nivelNombre} label={nivelNombre}>
              {materias
                .filter((m) => m.grupo === nivelNombre)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <select name="docenteId" className={cellInput}>
          <option value="">Sin asignar</option>
          {docentes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
        <select name="diaSemana" required className={cellInput}>
          {dias.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <input type="time" name="horaInicio" required className={cellInput} />
        <input type="time" name="horaFin" required className={cellInput} />
        <BotonGuardar
          textoGuardado="✓ Agregado"
          className="col-span-2 rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60 md:col-span-6"
        >
          Agregar bloque
        </BotonGuardar>
      </form>
      {estado.error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{estado.error}</p>
      )}
    </div>
  );
}
