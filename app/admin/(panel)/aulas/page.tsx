import { prisma } from "@/lib/prisma";
import { crearAula, actualizarAula } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";
import { SelectGradoPorNivel } from "@/components/SelectGradoPorNivel";

export const dynamic = "force-dynamic";

export default async function AulasPage() {
  const [aulas, niveles, grados, aniosEscolares] = await Promise.all([
    prisma.aula.findMany({
      orderBy: [{ anioEscolar: { fechaInicio: "desc" } }, { nombre: "asc" }],
      include: {
        nivel: true,
        grado: true,
        anioEscolar: true,
        matriculas: { where: { estado: "ACTIVA" } },
      },
    }),
    prisma.nivel.findMany({ where: { activo: true }, orderBy: { ordenVisual: "asc" } }),
    prisma.grado.findMany({ where: { activo: true }, orderBy: { ordenVisual: "asc" } }),
    prisma.anioEscolar.findMany({ orderBy: { fechaInicio: "desc" } }),
  ]);

  return (
    <div>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
          Aulas
        </h1>
        <p className="mt-1 text-[var(--color-ink-soft)]">
          Todas las aulas, de todos los años escolares. Editá cualquier celda y dale a
          &quot;Guardar&quot; en su fila. Los profesores se asignan por materia en{" "}
          <strong>Horarios</strong>, no aquí.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[var(--color-paper-dark)] text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Nivel</th>
              <th className="px-3 py-2">Grado</th>
              <th className="px-3 py-2">Tanda</th>
              <th className="px-3 py-2">Año escolar</th>
              <th className="px-3 py-2">Cupo</th>
              <th className="px-3 py-2">Matriculados</th>
              <th className="px-3 py-2 text-center">Activa</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {aulas.map((a) => {
              const formId = `form-aula-${a.id}`;
              return (
                <tr key={a.id} className="border-t border-[var(--color-line)]">
                  <td className="px-2 py-1.5">
                    <input form={formId} name="nombre" defaultValue={a.nombre} className={cellInput} />
                  </td>
                  <td className="px-2 py-1.5 text-xs text-[var(--color-ink-soft)]">{a.nivel.nombre}</td>
                  <td className="px-2 py-1.5">
                    <select form={formId} name="gradoId" defaultValue={a.gradoId ?? ""} className={cellInput}>
                      <option value="">Sin grado específico</option>
                      {grados
                        .filter((g) => g.nivelId === a.nivelId)
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nombre}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-xs text-[var(--color-ink-soft)]">{a.tanda}</td>
                  <td className="px-2 py-1.5 text-xs text-[var(--color-ink-soft)]">{a.anioEscolar.nombre}</td>
                  <td className="px-2 py-1.5">
                    <input
                      form={formId}
                      name="capacidad"
                      type="number"
                      defaultValue={a.capacidad}
                      className={`${cellInput} w-16`}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center text-xs text-[var(--color-ink-soft)]">
                    {a.matriculas.length}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <input form={formId} type="checkbox" name="activa" defaultChecked={a.activa} />
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <button
                      form={formId}
                      className="rounded-lg bg-[var(--color-green)] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Guardar
                    </button>
                    <form id={formId} action={actualizarAula} className="hidden">
                      <input type="hidden" name="aulaId" value={a.id} />
                    </form>
                  </td>
                </tr>
              );
            })}
            {aulas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aún no hay aulas creadas. Agregá la primera abajo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
          + Agregar aula nueva
        </p>
        <form action={crearAula} className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <input name="nombre" placeholder="Nombre" required className={cellInput} />
          <SelectGradoPorNivel grados={grados} niveles={niveles} className={cellInput} />
          <select name="tanda" required className={cellInput}>
            <option value="MATUTINA">Matutina</option>
            <option value="VESPERTINA">Vespertina</option>
            <option value="EXTENDIDA">Extendida</option>
          </select>
          <select name="anioEscolarId" required className={cellInput}>
            <option value="">Año escolar…</option>
            {aniosEscolares.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
          <input name="capacidad" type="number" placeholder="Cupo" required className={cellInput} />
          <BotonGuardar
            textoGuardado="✓ Creada"
            className="col-span-2 rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60 md:col-span-6"
          >
            Crear aula
          </BotonGuardar>
        </form>
      </div>
    </div>
  );
}

const cellInput =
  "w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm outline-none focus:border-[var(--color-green)]";
