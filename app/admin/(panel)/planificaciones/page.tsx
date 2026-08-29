import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  crearPlanificacion,
  actualizarPlanificacion,
  eliminarPlanificacion,
  enviarParaRevision,
  revisarPlanificacion,
  duplicarPlanificacion,
} from "@/lib/actions-planificaciones";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  BORRADOR: { texto: "Borrador", clase: "bg-yellow-50 text-yellow-700" },
  ENVIADA: { texto: "Enviada — esperando revisión", clase: "bg-blue-50 text-blue-700" },
  APROBADA: { texto: "Aprobada", clase: "bg-[var(--color-paper-dark)] text-[var(--color-green)]" },
  RECHAZADA: { texto: "Rechazada — requiere corrección", clase: "bg-red-50 text-red-600" },
};

export default async function PlanificacionesPage() {
  const session = await auth();
  const usuario = session?.user as { id?: string; role?: string; name?: string } | undefined;
  const esAdmin = usuario?.role === "ADMIN";
  const esRevisor = usuario?.role === "ADMIN" || usuario?.role === "COORDINADOR_DOCENTE";

  const aulaIdsDelDocente = esAdmin
    ? null
    : (
        await prisma.bloqueHorario.findMany({
          where: { docenteId: usuario?.id },
          select: { aulaId: true },
          distinct: ["aulaId"],
        })
      ).map((b) => b.aulaId);

  const [planificaciones, aulasDelDocente] = await Promise.all([
    prisma.planificacionDocente.findMany({
      where: esRevisor ? {} : { docenteId: usuario?.id },
      orderBy: { actualizadoEn: "desc" },
      include: { docente: true, aula: { include: { nivel: true } }, revisadoPor: true },
    }),
    prisma.aula.findMany({
      where: esAdmin ? { activa: true } : { activa: true, id: { in: aulaIdsDelDocente ?? [] } },
      include: { nivel: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Planificación docente
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        {esRevisor
          ? "Viendo las planificaciones de todos los docentes para revisión y seguimiento."
          : "Tus unidades de aprendizaje y proyectos. Solo tú puedes ver y editar los tuyos."}
      </p>

      <div className="mt-8 space-y-3">
        {planificaciones.map((p) => {
          const estadoInfo = ETIQUETA_ESTADO[p.estado];
          const esDueno = p.docenteId === usuario?.id;
          const puedeEditarContenido = esDueno && !esRevisor && (p.estado === "BORRADOR" || p.estado === "RECHAZADA");

          return (
            <details key={p.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{p.titulo}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {p.tipo === "PRIMARIA" ? "Primaria" : "Nivel Inicial"} · {p.aula?.nombre ?? "Sin aula asignada"}
                    {esRevisor && ` · ${p.docente.nombre}`}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoInfo.clase}`}>
                  {estadoInfo.texto}
                </span>
              </summary>

              {p.estado === "RECHAZADA" && p.comentarioCoordinador && (
                <div className="border-t border-[var(--color-line)] bg-red-50 p-4 text-sm text-red-700">
                  <strong>Comentario del coordinador:</strong> {p.comentarioCoordinador}
                </div>
              )}

              <form
                action={actualizarPlanificacion}
                className="space-y-4 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4"
              >
                <input type="hidden" name="planificacionId" value={p.id} />
                <fieldset disabled={!puedeEditarContenido && !esRevisor} className="space-y-4 disabled:opacity-60">
                  <CamposComunes valores={p} aulas={aulasDelDocente} tipo={p.tipo} />
                  {(puedeEditarContenido || esRevisor) && (
                    <BotonGuardar className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                      Guardar cambios
                    </BotonGuardar>
                  )}
                </fieldset>
              </form>

              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] p-4">
                <Link
                  href={`/admin/planificaciones/${p.id}/imprimir`}
                  target="_blank"
                  className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
                >
                  Imprimir / PDF
                </Link>

                <form action={duplicarPlanificacion}>
                  <input type="hidden" name="planificacionId" value={p.id} />
                  <BotonGuardar
                    textoGuardado="✓ Duplicado"
                    className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)] disabled:opacity-60"
                  >
                    Duplicar
                  </BotonGuardar>
                </form>

                {esDueno && !esRevisor && (p.estado === "BORRADOR" || p.estado === "RECHAZADA") && (
                  <form action={enviarParaRevision}>
                    <input type="hidden" name="planificacionId" value={p.id} />
                    <BotonGuardar textoGuardado="✓ Enviado" className="rounded-lg bg-[var(--color-green)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                      Enviar a revisión
                    </BotonGuardar>
                  </form>
                )}

                {(esDueno || esRevisor) && (
                  <form action={eliminarPlanificacion}>
                    <input type="hidden" name="planificacionId" value={p.id} />
                    <BotonGuardar
                      textoGuardado="✓ Eliminado"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Eliminar
                    </BotonGuardar>
                  </form>
                )}
              </div>

              {esRevisor && p.estado === "ENVIADA" && (
                <form
                  action={revisarPlanificacion}
                  className="space-y-2 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4"
                >
                  <input type="hidden" name="planificacionId" value={p.id} />
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                    Revisión del coordinador
                  </p>
                  <textarea
                    name="comentario"
                    placeholder="Comentario (obligatorio si rechazas)"
                    rows={2}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <BotonGuardar
                      name="decision"
                      value="APROBADA"
                      textoGuardado="✓ Aprobado"
                      className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      Aprobar
                    </BotonGuardar>
                    <BotonGuardar
                      name="decision"
                      value="RECHAZADA"
                      textoGuardado="✓ Rechazado"
                      className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Rechazar
                    </BotonGuardar>
                  </div>
                </form>
              )}

              {p.revisadoPor && (p.estado === "APROBADA" || p.estado === "RECHAZADA") && (
                <p className="border-t border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-ink-soft)]">
                  Revisado por {p.revisadoPor.nombre} el {p.revisadoEn?.toLocaleDateString("es-DO")}
                </p>
              )}
            </details>
          );
        })}
        {planificaciones.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay planificaciones creadas.
          </p>
        )}
      </div>

      {!esRevisor && (
        <>
          <details className="mt-8 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-5">
            <summary className="cursor-pointer text-sm font-bold text-[var(--color-green)]">
              + Nueva planificación de Primaria
            </summary>
            <form action={crearPlanificacion} className="mt-4 space-y-4">
              <input type="hidden" name="tipo" value="PRIMARIA" />
              <CamposComunes aulas={aulasDelDocente} tipo="PRIMARIA" />
              <BotonGuardar textoGuardado="✓ Creada" className="rounded-lg bg-[var(--color-green)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                Crear planificación
              </BotonGuardar>
            </form>
          </details>

          <details className="mt-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-5">
            <summary className="cursor-pointer text-sm font-bold text-[var(--color-green)]">
              + Nueva planificación de Nivel Inicial
            </summary>
            <form action={crearPlanificacion} className="mt-4 space-y-4">
              <input type="hidden" name="tipo" value="INICIAL" />
              <CamposComunes aulas={aulasDelDocente} tipo="INICIAL" />
              <BotonGuardar textoGuardado="✓ Creada" className="rounded-lg bg-[var(--color-green)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                Crear planificación
              </BotonGuardar>
            </form>
          </details>
        </>
      )}
    </div>
  );
}

type AulaOpcion = { id: string; nombre: string; nivel: { nombre: string } };

function CamposComunes({
  valores,
  aulas,
  tipo,
}: {
  valores?: Record<string, unknown>;
  aulas: AulaOpcion[];
  tipo: "PRIMARIA" | "INICIAL";
}) {
  const v = (clave: string) => (valores?.[clave] as string) ?? "";
  const fecha = valores?.fecha ? new Date(valores.fecha as string | Date).toISOString().slice(0, 10) : "";

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs text-[var(--color-ink-soft)]">
          Centro educativo
          <input name="centroEducativo" defaultValue={v("centroEducativo")} className={inputClass} />
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Aula
          <select name="aulaId" defaultValue={(valores?.aulaId as string) ?? ""} className={inputClass}>
            <option value="">Sin aula específica</option>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} — {a.nivel.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          {tipo === "PRIMARIA" ? "Grado" : "Grado y sección"}
          <input name="grado" defaultValue={v("grado")} className={inputClass} />
        </label>
        {tipo === "PRIMARIA" ? (
          <label className="text-xs text-[var(--color-ink-soft)]">
            Área curricular
            <input name="areaCurricular" defaultValue={v("areaCurricular")} className={inputClass} />
          </label>
        ) : (
          <label className="text-xs text-[var(--color-ink-soft)]">
            Dominios
            <input name="dominios" defaultValue={v("dominios")} className={inputClass} />
          </label>
        )}
        <label className="text-xs text-[var(--color-ink-soft)]">
          {tipo === "PRIMARIA" ? "Tiempo de duración" : "Duración"}
          <input name="duracion" defaultValue={v("duracion")} className={inputClass} />
        </label>
        {tipo === "INICIAL" && (
          <label className="text-xs text-[var(--color-ink-soft)]">
            Fecha
            <input type="date" name="fecha" defaultValue={fecha} className={inputClass} />
          </label>
        )}
      </div>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        {tipo === "PRIMARIA" ? "Título de la Unidad de Aprendizaje" : "Título del proyecto"}
        <input name="titulo" defaultValue={v("titulo")} required className={inputClass} />
      </label>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        {tipo === "PRIMARIA"
          ? "Situación de aprendizaje (problema, reto o necesidad del contexto)"
          : "Situación o problema del contexto"}
        <textarea name="situacionContexto" defaultValue={v("situacionContexto")} rows={2} className={inputClass} />
      </label>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Ejes transversales
        <input name="ejeTransversal" defaultValue={v("ejeTransversal")} className={inputClass} />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs text-[var(--color-ink-soft)]">
          Competencias fundamentales
          <textarea name="competenciasFundamentales" defaultValue={v("competenciasFundamentales")} rows={2} className={inputClass} />
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Competencias específicas
          <textarea name="competenciasEspecificas" defaultValue={v("competenciasEspecificas")} rows={2} className={inputClass} />
        </label>
      </div>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Indicadores de logro
        <textarea name="indicadoresLogro" defaultValue={v("indicadoresLogro")} rows={2} className={inputClass} />
      </label>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">Contenidos</p>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          <label className="text-xs text-[var(--color-ink-soft)]">
            Conceptuales
            <textarea name="contenidoConceptual" defaultValue={v("contenidoConceptual")} rows={2} className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Procedimentales
            <textarea name="contenidoProcedimental" defaultValue={v("contenidoProcedimental")} rows={2} className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Actitudes y valores
            <textarea name="contenidoActitudinal" defaultValue={v("contenidoActitudinal")} rows={2} className={inputClass} />
          </label>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          {tipo === "PRIMARIA" ? "Secuencia didáctica" : "Secuencia de actividades"}
        </p>
        <label className="mt-2 block text-xs text-[var(--color-ink-soft)]">
          Intención pedagógica
          <textarea name="propositoAprendizaje" defaultValue={v("propositoAprendizaje")} rows={2} className={inputClass} />
        </label>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          <label className="text-xs text-[var(--color-ink-soft)]">
            Inicio
            <textarea name="secuenciaInicio" defaultValue={v("secuenciaInicio")} rows={2} className={inputClass} />
            <input name="tiempoInicio" defaultValue={v("tiempoInicio")} placeholder="Tiempo" className={`${inputClass} mt-1.5`} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Desarrollo
            <textarea name="secuenciaDesarrollo" defaultValue={v("secuenciaDesarrollo")} rows={2} className={inputClass} />
            <input name="tiempoDesarrollo" defaultValue={v("tiempoDesarrollo")} placeholder="Tiempo" className={`${inputClass} mt-1.5`} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Cierre (Cierre y retroalimentación)
            <textarea name="secuenciaCierre" defaultValue={v("secuenciaCierre")} rows={2} className={inputClass} />
            <input name="tiempoCierre" defaultValue={v("tiempoCierre")} placeholder="Tiempo" className={`${inputClass} mt-1.5`} />
          </label>
        </div>
      </div>

      {tipo === "PRIMARIA" && (
        <label className="block text-xs text-[var(--color-ink-soft)]">
          Estrategias de enseñanza y aprendizaje
          <textarea name="estrategiasEnsenanza" defaultValue={v("estrategiasEnsenanza")} rows={2} className={inputClass} />
        </label>
      )}

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Recursos y materiales
        <textarea name="recursosMateriales" defaultValue={v("recursosMateriales")} rows={2} className={inputClass} />
      </label>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">Evaluación</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <label className="text-xs text-[var(--color-ink-soft)]">
            Criterios de evaluación
            <textarea name="criteriosEvaluacion" defaultValue={v("criteriosEvaluacion")} rows={2} className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Evidencias de aprendizaje
            <textarea name="evidenciasAprendizaje" defaultValue={v("evidenciasAprendizaje")} rows={2} className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
            Instrumentos de evaluación (rúbrica, lista de cotejo, escala de valoración, etc.)
            <textarea name="instrumentosEvaluacion" defaultValue={v("instrumentosEvaluacion")} rows={2} className={inputClass} />
          </label>
        </div>
      </div>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Producto o evidencia final
        <textarea name="productoEvidenciaFinal" defaultValue={v("productoEvidenciaFinal")} rows={2} className={inputClass} />
      </label>

      {tipo === "INICIAL" && (
        <label className="block text-xs text-[var(--color-ink-soft)]">
          Teorías
          <textarea name="teorias" defaultValue={v("teorias")} rows={2} className={inputClass} />
        </label>
      )}

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Metacognición
        <textarea name="metacognicion" defaultValue={v("metacognicion")} rows={2} className={inputClass} />
      </label>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Autores
        <input name="autores" defaultValue={v("autores")} className={inputClass} />
      </label>
    </>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
