import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { guardarAsistencia } from "@/lib/actions-asistencia";
import { BannerGuardado } from "@/components/BannerGuardado";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

const OPCIONES_ESTADO = [
  { value: "PRESENTE", label: "Presente" },
  { value: "AUSENTE", label: "Ausente" },
  { value: "TARDANZA", label: "Tardanza" },
  { value: "JUSTIFICADO", label: "Justificado" },
];

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ aulaId?: string; fecha?: string; guardado?: string }>;
}) {
  const { aulaId, fecha, guardado } = await searchParams;
  const session = await auth();
  const usuario = session?.user as { id?: string; role?: string } | undefined;
  const esAdmin = usuario?.role === "ADMIN";
  const esCoordinador = usuario?.role === "COORDINADOR_DOCENTE";
  const esRevisor = esAdmin || esCoordinador;

  const aulaIdsDelProfesor = esRevisor
    ? null
    : (
        await prisma.bloqueHorario.findMany({
          where: { docenteId: usuario?.id },
          select: { aulaId: true },
          distinct: ["aulaId"],
        })
      ).map((b) => b.aulaId);

  const aulas = await prisma.aula.findMany({
    where: esRevisor ? { activa: true } : { activa: true, id: { in: aulaIdsDelProfesor ?? [] } },
    include: { nivel: true },
    orderBy: { nombre: "asc" },
  });

  const fechaSeleccionada = fecha || new Date().toISOString().slice(0, 10);
  const aulaSeleccionada = aulaId || aulas[0]?.id || "";

  let estudiantes: { id: string; nombre: string; apellido: string; numeroExpediente: string }[] = [];
  const estadoExistente: Record<string, string> = {};
  const notasExistentes: Record<string, string> = {};

  if (aulaSeleccionada) {
    const matriculas = await prisma.matricula.findMany({
      where: { aulaId: aulaSeleccionada, estado: "ACTIVA" },
      include: { estudiante: true },
      orderBy: { estudiante: { apellido: "asc" } },
    });
    estudiantes = matriculas.map((m) => m.estudiante);

    const asistencias = await prisma.asistencia.findMany({
      where: {
        aulaId: aulaSeleccionada,
        fecha: new Date(`${fechaSeleccionada}T00:00:00`),
      },
    });
    for (const a of asistencias) {
      estadoExistente[a.estudianteId] = a.estado;
      if (a.notas) notasExistentes[a.estudianteId] = a.notas;
    }
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Asistencia
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">Pase de lista diario de tus aulas.</p>

      {guardado === "1" && <BannerGuardado />}

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <label className="text-xs text-[var(--color-ink-soft)]">
          Aula
          <select name="aulaId" defaultValue={aulaSeleccionada} className={inputClass}>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} — {a.nivel.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Fecha
          <input type="date" name="fecha" defaultValue={fechaSeleccionada} className={inputClass} />
        </label>
        <button className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-dark)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]">
          Ver
        </button>
      </form>

      {aulas.length === 0 && (
        <p className="mt-6 rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
          Aún no tenés ningún bloque de horario asignado como profesor. Pídele a un administrador
          que te asigne al menos una materia en <strong>Horarios</strong>.
        </p>
      )}

      {aulaSeleccionada && estudiantes.length > 0 && (
        <form action={guardarAsistencia} className="mt-6">
          <input type="hidden" name="aulaId" value={aulaSeleccionada} />
          <input type="hidden" name="fecha" value={fechaSeleccionada} />

          <fieldset disabled={esCoordinador}>
            <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--color-paper-dark)] text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <tr>
                    <th className="px-4 py-3">Expediente</th>
                    <th className="px-4 py-3">Estudiante</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Nota (opcional)</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((e) => (
                    <tr key={e.id} className="border-t border-[var(--color-line)]">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-soft)]">
                        {e.numeroExpediente}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">
                        {e.nombre} {e.apellido}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          name={`estado-${e.id}`}
                          defaultValue={estadoExistente[e.id] ?? "PRESENTE"}
                          className="rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm disabled:bg-[var(--color-paper-dark)]"
                        >
                          {OPCIONES_ESTADO.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          name={`notas-${e.id}`}
                          defaultValue={notasExistentes[e.id] ?? ""}
                          placeholder="Ej. llegó 15 min tarde"
                          className="w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm disabled:bg-[var(--color-paper-dark)]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!esCoordinador && (
              <BotonGuardar className="mt-4 rounded-lg bg-[var(--color-green)] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                Guardar asistencia
              </BotonGuardar>
            )}
          </fieldset>
          {esCoordinador && (
            <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
              Estás viendo la asistencia en modo solo lectura, como Coordinador Docente.
            </p>
          )}
        </form>
      )}

      {aulaSeleccionada && estudiantes.length === 0 && aulas.length > 0 && (
        <p className="mt-6 rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
          Esta aula no tiene estudiantes matriculados todavía.
        </p>
      )}
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
