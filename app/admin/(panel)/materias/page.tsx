import { prisma } from "@/lib/prisma";
import { crearMateria, actualizarMateria } from "@/lib/actions-horarios";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function MateriasPage() {
  const [materias, niveles] = await Promise.all([
    prisma.materia.findMany({ include: { nivel: true }, orderBy: { nombre: "asc" } }),
    prisma.nivel.findMany({ where: { activo: true }, orderBy: { ordenVisual: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Materias
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Las materias se usan para armar los horarios de cada aula en la pantalla de Horarios.
      </p>

      <div className="mt-8 space-y-2">
        {materias.map((m) => (
          <details key={m.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{m.nombre}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">{m.nivel?.nombre ?? "Todos los niveles"}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  m.activa
                    ? "bg-[var(--color-paper-dark)] text-[var(--color-green)]"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {m.activa ? "Activa" : "Inactiva"}
              </span>
            </summary>
            <form
              action={actualizarMateria}
              className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2"
            >
              <input type="hidden" name="materiaId" value={m.id} />
              <label className="text-xs text-[var(--color-ink-soft)]">
                Nombre
                <input name="nombre" defaultValue={m.nombre} required className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Nivel (opcional)
                <select name="nivelId" defaultValue={m.nivelId ?? ""} className={inputClass}>
                  <option value="">Todos los niveles</option>
                  {niveles.map((n) => (
                    <option key={n.id} value={n.id}>{n.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
                Descripción
                <input name="descripcion" defaultValue={m.descripcion ?? ""} className={inputClass} />
              </label>
              <label className="flex items-center gap-2 self-end text-xs text-[var(--color-ink-soft)]">
                <input type="checkbox" name="activa" defaultChecked={m.activa} />
                Materia activa
              </label>
              <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-xs font-bold text-white disabled:opacity-60 md:col-span-2">
                Guardar cambios
              </BotonGuardar>
            </form>
          </details>
        ))}
        {materias.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-6 text-center text-sm text-[var(--color-ink-soft)]">
            Aún no hay materias creadas. Crea la primera abajo.
          </p>
        )}
      </div>

      <form
        action={crearMateria}
        className="mt-6 grid gap-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-5 md:grid-cols-2"
      >
        <input name="nombre" placeholder="Nombre (ej. Matemáticas)" required className={inputClass} />
        <select name="nivelId" className={inputClass}>
          <option value="">Todos los niveles</option>
          {niveles.map((n) => (
            <option key={n.id} value={n.id}>{n.nombre}</option>
          ))}
        </select>
        <input name="descripcion" placeholder="Descripción (opcional)" className={`md:col-span-2 ${inputClass}`} />
        <BotonGuardar
          textoGuardado="✓ Agregada"
          className="rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60 md:col-span-2"
        >
          + Agregar materia
        </BotonGuardar>
      </form>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
