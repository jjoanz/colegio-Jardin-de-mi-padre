import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { matricularEstudiante, actualizarEstudiante, asignarBeca, revocarBeca } from "@/lib/actions";
import { DetalleSolicitud } from "@/components/DetalleSolicitud";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function EstudianteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const estudiante = await prisma.estudiante.findUnique({
    where: { id },
    include: {
      nivel: true,
      tutores: { include: { tutor: true } },
      cargos: { include: { pagos: true }, orderBy: { fechaEmision: "desc" } },
      facturas: { orderBy: { fechaEmision: "desc" } },
      matriculas: {
        include: { aula: { include: { nivel: true } }, anioEscolar: true },
        orderBy: { fechaMatricula: "desc" },
      },
      inscripcionesCuido: { include: { programaCuido: true } },
      becas: { orderBy: { creadaEn: "desc" } },
    },
  });

  if (!estudiante) notFound();

  const solicitudOriginal = await prisma.solicitudInscripcion.findFirst({
    where: { estudianteCreadoId: estudiante.id },
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
  });

  const aulasDisponibles = await prisma.aula.findMany({
    where: { activa: true },
    include: { nivel: true, anioEscolar: true },
    orderBy: { nombre: "asc" },
  });

  const niveles = await prisma.nivel.findMany({ where: { activo: true }, orderBy: { ordenVisual: "asc" } });

  const totalCargos = estudiante.cargos.reduce((s, c) => s + Number(c.monto), 0);
  const totalPagado = estudiante.cargos.reduce(
    (s, c) => s + c.pagos.reduce((s2, p) => s2 + Number(p.monto), 0),
    0
  );
  const balance = totalCargos - totalPagado;

  return (
    <div>
      <Link href="/admin/estudiantes" className="text-sm font-bold text-[var(--color-green)]">
        ← Todos los estudiantes
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            {estudiante.nombre} {estudiante.apellido}
          </h1>
          <p className="mt-1 font-mono text-sm text-[var(--color-ink-soft)]">
            Expediente: {estudiante.numeroExpediente}
            {estudiante.numeroMatriculaMinerd && ` · Matrícula MINERD: ${estudiante.numeroMatriculaMinerd}`}
            {` · ${estudiante.estado}`}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white px-5 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Balance</p>
          <p className={`font-mono text-xl font-bold ${balance > 0 ? "text-red-600" : "text-[var(--color-green)]"}`}>
            RD$ {balance.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: datos + tutores + matrícula */}
        <div className="space-y-6 lg:col-span-1">
          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">Datos</h2>
            <form action={actualizarEstudiante} className="mt-3 space-y-2 text-sm">
              <input type="hidden" name="estudianteId" value={estudiante.id} />
              <label className="block text-xs text-[var(--color-ink-soft)]">
                Nombre
                <input name="nombre" defaultValue={estudiante.nombre} required className={editInputClass} />
              </label>
              <label className="block text-xs text-[var(--color-ink-soft)]">
                Apellido
                <input name="apellido" defaultValue={estudiante.apellido} required className={editInputClass} />
              </label>
              <label className="block text-xs text-[var(--color-ink-soft)]">
                Fecha de nacimiento
                <input
                  name="fechaNacimiento"
                  type="date"
                  defaultValue={estudiante.fechaNacimiento.toISOString().slice(0, 10)}
                  required
                  className={editInputClass}
                />
              </label>
              <label className="block text-xs text-[var(--color-ink-soft)]">
                Cédula / acta de nacimiento
                <input
                  name="cedulaONum"
                  defaultValue={estudiante.cedulaONum ?? ""}
                  placeholder="Cédula o número de acta de nacimiento"
                  className={editInputClass}
                />
              </label>
              <label className="block text-xs text-[var(--color-ink-soft)]">
                Nivel
                <select name="nivelId" defaultValue={estudiante.nivelId ?? ""} className={editInputClass}>
                  <option value="">Sin nivel</option>
                  {niveles.map((n) => (
                    <option key={n.id} value={n.id}>{n.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-[var(--color-ink-soft)]">
                Aula (elige una si cambias de nivel)
                <select name="aulaId" defaultValue={estudiante.matriculas[0]?.aulaId ?? ""} className={editInputClass}>
                  <option value="">No cambiar de aula</option>
                  {aulasDisponibles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} — {a.nivel.nombre} · {a.tanda} · {a.anioEscolar.nombre}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[10px] text-[var(--color-ink-soft)]">
                  El nivel de arriba es solo un dato del expediente — el nivel real del estudiante
                  (el que se ve en Historial académico) lo da el aula en la que está matriculado.
                  Elige aquí la nueva aula para que ambos queden sincronizados.
                </span>
              </label>
              <label className="block text-xs text-[var(--color-ink-soft)]">
                Matrícula MINERD
                <input
                  name="numeroMatriculaMinerd"
                  defaultValue={estudiante.numeroMatriculaMinerd ?? ""}
                  placeholder="Se coloca cuando el MINERD la asigna"
                  className={editInputClass}
                />
              </label>
              <label className="block text-xs text-[var(--color-ink-soft)]">
                Estado
                <select name="estado" defaultValue={estudiante.estado} className={editInputClass}>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="RETIRADO">Retirado</option>
                </select>
              </label>
              <label className="block text-xs text-[var(--color-ink-soft)]">
                Observaciones
                <textarea name="observaciones" defaultValue={estudiante.observaciones ?? ""} rows={2} className={editInputClass} />
              </label>
              <BotonGuardar className="w-full rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60">
                Guardar cambios
              </BotonGuardar>
            </form>
          </section>

          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">Padres, madres o tutores</h2>
            <ul className="mt-3 space-y-4 text-sm">
              {estudiante.tutores.map((et) => (
                <li key={et.id} className="border-b border-[var(--color-line)] pb-3 last:border-0 last:pb-0">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {et.tutor.nombre} {et.tutor.apellido}
                    {et.esContactoPrincipal && (
                      <span className="ml-1.5 rounded-full bg-[var(--color-green)]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-green)]">
                        Contacto principal
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    Exp. {et.tutor.numeroExpediente} · {et.parentesco}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    Cédula: {et.tutor.cedula || "—"}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    Tel: {et.tutor.telefono}
                    {et.tutor.telefonoAlt && ` · Alt: ${et.tutor.telefonoAlt}`}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{et.tutor.email}</p>
                  {et.tutor.direccion && (
                    <p className="text-xs text-[var(--color-ink-soft)]">Dirección: {et.tutor.direccion}</p>
                  )}
                  {et.tutor.ocupacion && (
                    <p className="text-xs text-[var(--color-ink-soft)]">Ocupación: {et.tutor.ocupacion}</p>
                  )}
                  <Link
                    href={`/admin/padres#${et.tutor.id}`}
                    className="mt-1 inline-block text-xs font-bold text-[var(--color-green)]"
                  >
                    Editar en Padres, madres y tutores →
                  </Link>
                </li>
              ))}
              {estudiante.tutores.length === 0 && (
                <p className="text-sm text-[var(--color-ink-soft)]">Sin padres, madres o tutores vinculados.</p>
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">Beca</h2>
            {(() => {
              const becaActiva = estudiante.becas.find((b) => b.activa);
              return becaActiva ? (
                <div className="mt-3 rounded-lg bg-[var(--color-paper-dark)] p-3 text-sm">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {Number(becaActiva.porcentaje)}% de descuento
                  </p>
                  {becaActiva.motivo && <p className="text-xs text-[var(--color-ink-soft)]">{becaActiva.motivo}</p>}
                  {becaActiva.esExterna && (
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                      Externa{becaActiva.institucionExterna ? ` — ${becaActiva.institucionExterna}` : ""}
                      {becaActiva.cartaCompromisoUrl && (
                        <>
                          {" · "}
                          <a
                            href={becaActiva.cartaCompromisoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[var(--color-green)]"
                          >
                            Ver carta compromiso
                          </a>
                        </>
                      )}
                    </p>
                  )}
                  <form action={revocarBeca} className="mt-2">
                    <input type="hidden" name="becaId" value={becaActiva.id} />
                    <BotonGuardar
                      textoGuardado="✓ Revocada"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Revocar beca
                    </BotonGuardar>
                  </form>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Sin beca activa.</p>
              );
            })()}
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-bold text-[var(--color-green)]">
                Asignar nueva beca
              </summary>
              <form action={asignarBeca} encType="multipart/form-data" className="mt-2 space-y-2">
                <input type="hidden" name="estudianteId" value={estudiante.id} />
                <label className="block text-xs text-[var(--color-ink-soft)]">
                  Porcentaje (1-100)
                  <input name="porcentaje" type="number" min="1" max="100" step="0.01" required className={editInputClass} />
                </label>
                <label className="block text-xs text-[var(--color-ink-soft)]">
                  Motivo (opcional)
                  <input name="motivo" placeholder="Beca deportiva, hijo de empleado, etc." className={editInputClass} />
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
                  <input name="esExterna" type="checkbox" className="h-4 w-4" />
                  Es una beca de una institución externa
                </label>
                <label className="block text-xs text-[var(--color-ink-soft)]">
                  Institución externa (si aplica)
                  <input name="institucionExterna" placeholder="Fundación, gobierno, empresa, etc." className={editInputClass} />
                </label>
                <label className="block text-xs text-[var(--color-ink-soft)]">
                  Carta compromiso (si aplica)
                  <input name="cartaCompromiso" type="file" accept="image/*,.pdf" className={editInputClass} />
                </label>
                <BotonGuardar textoGuardado="✓ Asignada" className="w-full rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60">
                  Asignar beca
                </BotonGuardar>
              </form>
            </details>
            {estudiante.becas.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-bold text-[var(--color-ink-soft)]">
                  Historial de becas ({estudiante.becas.length})
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-[var(--color-ink-soft)]">
                  {estudiante.becas.map((b) => (
                    <li key={b.id}>
                      {Number(b.porcentaje)}% {b.motivo && `— ${b.motivo}`} · {b.activa ? "Activa" : "Inactiva"} ·{" "}
                      {b.creadaEn.toLocaleDateString("es-DO")}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">Matricular / cambiar aula</h2>
            <form action={matricularEstudiante} className="mt-3 space-y-2">
              <input type="hidden" name="estudianteId" value={estudiante.id} />
              <select name="aulaId" required className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm">
                <option value="">Seleccionar aula…</option>
                {aulasDisponibles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} — {a.nivel.nombre} · {a.tanda} · {a.anioEscolar.nombre}
                  </option>
                ))}
              </select>
              <select
                name="planPago"
                defaultValue={estudiante.matriculas[0]?.planPago ?? "DIEZ_CUOTAS"}
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              >
                <option value="PAGO_UNICO">Pago único</option>
                <option value="DOS_PAGOS">Dos pagos</option>
                <option value="DIEZ_CUOTAS">Diez cuotas (mensual)</option>
              </select>
              <BotonGuardar textoGuardado="✓ Matriculado" className="w-full rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60">
                Guardar matrícula
              </BotonGuardar>
            </form>
          </section>
        </div>

        {/* Columna derecha: historial académico, cargos, facturas */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Historial académico
            </h2>
            <div className="mt-3 space-y-2">
              {estudiante.matriculas.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-[var(--color-paper-dark)] px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-semibold text-[var(--color-ink)]">
                      {m.aula.nombre} — {m.aula.nivel.nombre}
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      {m.anioEscolar.nombre} · {m.aula.tanda}
                      {m.planPago && ` · Plan: ${ETIQUETA_PLAN_PAGO[m.planPago]}`}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--color-ink-soft)]">
                    {m.estado}
                  </span>
                </div>
              ))}
              {estudiante.matriculas.length === 0 && (
                <p className="text-sm text-[var(--color-ink-soft)]">Aún no matriculado en ningún aula.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                Cargos y pagos
              </h2>
              <Link href={`/admin/estudiantes/${estudiante.id}/estado-cuenta`} className="text-xs font-bold text-[var(--color-green)]">
                Ver estado de cuenta anual →
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {estudiante.cargos.map((c) => (
                <div key={c.id} className="rounded-lg bg-[var(--color-paper-dark)] px-4 py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[var(--color-ink)]">{c.descripcion}</p>
                    <span className="font-mono text-xs">{c.estado}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
                    RD$ {Number(c.monto).toLocaleString("es-DO", { minimumFractionDigits: 2 })} ·{" "}
                    {c.pagos.length} pago(s) registrado(s)
                  </p>
                </div>
              ))}
              {estudiante.cargos.length === 0 && (
                <p className="text-sm text-[var(--color-ink-soft)]">Sin cargos registrados.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">Facturas</h2>
            <div className="mt-3 space-y-2">
              {estudiante.facturas.map((f) => (
                <Link
                  key={f.id}
                  href={`/admin/facturas/${f.id}`}
                  className="flex items-center justify-between rounded-lg bg-[var(--color-paper-dark)] px-4 py-2.5 text-sm hover:bg-[var(--color-line)]"
                >
                  <span className="font-mono font-semibold">{f.numeroFactura}</span>
                  <span>{f.concepto}</span>
                  <span className="font-mono">
                    RD$ {Number(f.montoTotal).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </span>
                </Link>
              ))}
              {estudiante.facturas.length === 0 && (
                <p className="text-sm text-[var(--color-ink-soft)]">Aún no se han generado facturas.</p>
              )}
            </div>
          </section>

          {solicitudOriginal && (
            <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
              <details>
                <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  Formulario de inscripción completo (como se envió originalmente)
                </summary>
                <div className="mt-3">
                  <DetalleSolicitud solicitud={solicitudOriginal} />
                </div>
              </details>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

const editInputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";

const ETIQUETA_PLAN_PAGO: Record<string, string> = {
  PAGO_UNICO: "Pago único",
  DOS_PAGOS: "Dos pagos",
  DIEZ_CUOTAS: "Diez cuotas (mensual)",
};
