import { prisma } from "@/lib/prisma";
import { aprobarSolicitud, rechazarSolicitud } from "@/lib/actions";
import { DetalleSolicitud } from "@/components/DetalleSolicitud";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function SolicitudesPage() {
  const [solicitudes, aulas, niveles, grados] = await Promise.all([
    prisma.solicitudInscripcion.findMany({
      orderBy: { creadaEn: "desc" },
      include: {
        formularioVersion: {
          include: {
            secciones: {
              orderBy: { orden: "asc" },
              include: { preguntas: { orderBy: { orden: "asc" }, include: { opciones: { orderBy: { orden: "asc" } } } } },
            },
          },
        },
      },
    }),
    prisma.aula.findMany({
      where: { activa: true },
      include: { nivel: true, anioEscolar: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.nivel.findMany({ select: { id: true, nombre: true } }),
    prisma.grado.findMany({ select: { id: true, nombre: true } }),
  ]);

  const correos = solicitudes.map((s) => s.emailTutor).filter((e): e is string => !!e);
  const tutoresExistentes = await prisma.tutor.findMany({ where: { email: { in: correos } } });
  const tutorPorCorreo = new Map(tutoresExistentes.map((t) => [t.email, t]));

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Solicitudes de inscripción
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Revisa las solicitudes enviadas desde la página pública. Al aprobar, se crea
        el expediente del estudiante, el del padre, madre o tutor, el cargo de matrícula y —si eliges
        un aula— la matrícula queda en su historial académico.
      </p>

      <div className="mt-8 space-y-4">
        {solicitudes.map((s) => {
          const tutorExistente = s.emailTutor ? tutorPorCorreo.get(s.emailTutor) : undefined;
          const conflictoCedula =
            !!tutorExistente?.cedula && !!s.cedulaTutor && tutorExistente.cedula !== s.cedulaTutor;
          const conflictoTelefono =
            !!tutorExistente?.telefono && !!s.telefonoTutor && tutorExistente.telefono !== s.telefonoTutor;
          const hayConflicto = conflictoCedula || conflictoTelefono;

          return (
            <div key={s.id} className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">
                    {s.nombreEstudiante} {s.apellidoEstudiante}
                  </p>
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    Padre/Madre/Tutor: {s.nombreTutor} · {s.emailTutor} · {s.telefonoTutor}
                    {s.cedulaTutor ? ` · Cédula: ${s.cedulaTutor}` : ""}
                  </p>
                </div>
                <EstadoBadge estado={s.estado} />
              </div>

              <details className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-dark)] p-3">
                <summary className="cursor-pointer text-xs font-bold text-[var(--color-green)]">
                  Ver información completa
                </summary>
                <div className="mt-3">
                  <DetalleSolicitud solicitud={s} niveles={niveles} grados={grados} />
                </div>
              </details>

              {hayConflicto && (s.estado === "NUEVA" || s.estado === "EN_REVISION") && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold">
                    Ya existe un padre, madre o tutor registrado con el correo {s.emailTutor}: {tutorExistente?.nombre}{" "}
                    {tutorExistente?.apellido}
                  </p>
                  {conflictoCedula && (
                    <p className="mt-1">
                      Cédula registrada: <strong>{tutorExistente?.cedula}</strong> — esta solicitud trae:{" "}
                      <strong>{s.cedulaTutor}</strong>
                    </p>
                  )}
                  {conflictoTelefono && (
                    <p className="mt-1">
                      Teléfono registrado: <strong>{tutorExistente?.telefono}</strong> — esta solicitud trae:{" "}
                      <strong>{s.telefonoTutor}</strong>
                    </p>
                  )}
                  <p className="mt-2 font-semibold">
                    ¿Es la misma persona? Pregúntale antes de aprobar — si confirmas, se actualizarán sus datos.
                  </p>
                </div>
              )}

              {(s.estado === "NUEVA" || s.estado === "EN_REVISION") && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <form action={aprobarSolicitud} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="solicitudId" value={s.id} />
                    {hayConflicto && (
                      <label className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                        <input type="checkbox" name="confirmarActualizarTutor" />
                        Confirmo que es la misma persona — actualizar sus datos
                      </label>
                    )}
                    <select name="aulaId" className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm">
                      <option value="">Sin aula asignada por ahora</option>
                      {aulas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre} — {a.nivel.nombre} · {a.tanda} · {a.anioEscolar.nombre}
                        </option>
                      ))}
                    </select>
                    <select
                      name="planPago"
                      defaultValue={s.planPago ?? "DIEZ_CUOTAS"}
                      className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
                    >
                      <option value="PAGO_UNICO">Pago único</option>
                      <option value="DOS_PAGOS">Dos pagos</option>
                      <option value="DIEZ_CUOTAS">Diez cuotas (mensual)</option>
                    </select>
                    <BotonGuardar textoGuardado="✓ Aprobado" className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                      Aprobar
                    </BotonGuardar>
                  </form>
                  <RechazarButton solicitudId={s.id} />
                </div>
              )}
            </div>
          );
        })}
        {solicitudes.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay solicitudes recibidas.
          </p>
        )}
      </div>
    </div>
  );
}

function RechazarButton({ solicitudId }: { solicitudId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await rechazarSolicitud(solicitudId);
      }}
    >
      <BotonGuardar
        textoGuardado="✓ Rechazado"
        className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] disabled:opacity-60"
      >
        Rechazar
      </BotonGuardar>
    </form>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    NUEVA: "bg-blue-100 text-blue-800",
    EN_REVISION: "bg-amber-100 text-amber-800",
    APROBADA: "bg-green-100 text-green-800",
    RECHAZADA: "bg-red-100 text-red-800",
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${colors[estado]}`}>
      {estado.replace("_", " ").toLowerCase()}
    </span>
  );
}
