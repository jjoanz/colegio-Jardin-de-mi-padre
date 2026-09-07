import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportarPagoForm } from "@/components/ReportarPagoForm";

export const dynamic = "force-dynamic";

const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  PARCIAL: "Parcial",
  VENCIDO: "Vencido",
  ANULADO: "Anulado",
};

const ETIQUETA_ESTADO_MATRICULA: Record<string, string> = {
  ACTIVA: "Activa",
  RETIRADA: "Retirada",
  PROMOVIDA: "Promovida",
  REPROBADA: "Reprobada",
};

const ETIQUETA_ASISTENCIA: Record<string, string> = {
  PRESENTE: "Presente",
  AUSENTE: "Ausente",
  TARDANZA: "Tardanza",
  JUSTIFICADO: "Justificado",
};

export default async function PortalEstudiantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const tutorId = (session!.user as { id: string }).id;

  // Solo puede ver el estudiante si está vinculado a este tutor.
  const vinculo = await prisma.estudianteTutor.findUnique({
    where: { estudianteId_tutorId: { estudianteId: id, tutorId } },
  });
  if (!vinculo) notFound();

  const estudiante = await prisma.estudiante.findUnique({
    where: { id },
    include: {
      cargos: {
        include: {
          pagos: true,
          anioEscolar: true,
          beca: true,
          pagosReportados: { where: { estado: "PENDIENTE" } },
        },
        orderBy: [{ anioEscolarId: "desc" }, { numeroCuota: "asc" }, { fechaEmision: "asc" }],
      },
      facturas: { orderBy: { fechaEmision: "desc" } },
      matriculas: {
        include: { aula: { include: { nivel: true } }, anioEscolar: true },
        orderBy: { anioEscolar: { fechaInicio: "desc" } },
      },
      asistencias: {
        include: { aula: { include: { anioEscolar: true } } },
      },
    },
  });
  if (!estudiante) notFound();

  const grupos = new Map<string, { nombre: string; cargos: typeof estudiante.cargos }>();
  for (const cargo of estudiante.cargos) {
    const clave = cargo.anioEscolarId ?? "sin-anio";
    const nombre = cargo.anioEscolar?.nombre ?? "Sin año escolar asignado";
    if (!grupos.has(clave)) grupos.set(clave, { nombre, cargos: [] });
    grupos.get(clave)!.cargos.push(cargo);
  }

  // Resumen de asistencia por año escolar (a través del aula donde se tomó).
  const asistenciaPorAnio = new Map<string, Record<string, number>>();
  for (const a of estudiante.asistencias) {
    const nombreAnio = a.aula.anioEscolar.nombre;
    if (!asistenciaPorAnio.has(nombreAnio)) asistenciaPorAnio.set(nombreAnio, {});
    const conteo = asistenciaPorAnio.get(nombreAnio)!;
    conteo[a.estado] = (conteo[a.estado] ?? 0) + 1;
  }

  return (
    <div>
      <Link href="/portal" className="text-sm font-bold text-[var(--color-green)]">
        ← Mis hijos
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        {estudiante.nombre} {estudiante.apellido}
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">Exp. {estudiante.numeroExpediente}</p>

      <h2 className="mt-8 text-lg font-semibold text-[var(--color-ink)]">Historial académico</h2>
      <div className="mt-3 space-y-2">
        {estudiante.matriculas.map((m) => {
          const asistencia = asistenciaPorAnio.get(m.anioEscolar.nombre);
          const totalAsistencia = asistencia
            ? Object.values(asistencia).reduce((s, n) => s + n, 0)
            : 0;
          return (
            <div key={m.id} className="rounded-lg border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{m.anioEscolar.nombre}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {m.aula.nivel.nombre} · Aula {m.aula.nombre}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-paper-dark)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink)]">
                  {ETIQUETA_ESTADO_MATRICULA[m.estado] ?? m.estado}
                </span>
              </div>
              {totalAsistencia > 0 && (
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                  Asistencia:{" "}
                  {Object.entries(asistencia!)
                    .map(([estado, cantidad]) => `${ETIQUETA_ASISTENCIA[estado] ?? estado}: ${cantidad}`)
                    .join(" · ")}
                </p>
              )}
            </div>
          );
        })}
        {estudiante.matriculas.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay matrículas registradas.
          </p>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-[var(--color-ink)]">Estado de cuenta anual</h2>
      <div className="mt-3 space-y-6">
        {Array.from(grupos.values()).map((grupo) => {
          const totalCargos = grupo.cargos.reduce((s, c) => s + Number(c.monto), 0);
          const totalPagado = grupo.cargos.reduce(
            (s, c) => s + c.pagos.reduce((s2, p) => s2 + Number(p.monto), 0),
            0
          );
          const saldo = totalCargos - totalPagado;

          return (
            <section key={grupo.nombre} className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--color-ink)]">{grupo.nombre}</h3>
                <div className="flex gap-4 text-right text-sm">
                  <div>
                    <p className="text-xs text-[var(--color-ink-soft)]">Total</p>
                    <p className="font-mono font-semibold">
                      RD$ {totalCargos.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-soft)]">Pagado</p>
                    <p className="font-mono font-semibold text-[var(--color-green)]">
                      RD$ {totalPagado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-soft)]">Saldo pendiente</p>
                    <p className={`font-mono font-bold ${saldo > 0 ? "text-red-600" : "text-[var(--color-green)]"}`}>
                      RD$ {saldo.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {grupo.cargos.map((c) => {
                  const pagadoCargo = c.pagos.reduce((s, p) => s + Number(p.monto), 0);
                  const saldoCargo = Number(c.monto) - pagadoCargo;
                  const reportadoPendiente = c.pagosReportados[0];
                  return (
                    <div key={c.id} className="rounded-lg bg-[var(--color-paper-dark)] px-4 py-2.5 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[var(--color-ink)]">
                            {c.descripcion}
                            {c.numeroCuota && c.totalCuotas && ` (Cuota ${c.numeroCuota} de ${c.totalCuotas})`}
                          </p>
                          <p className="text-xs text-[var(--color-ink-soft)]">
                            {c.beca && `Beca ${Number(c.beca.porcentaje)}% aplicada · `}
                            Vence: {c.fechaVencimiento ? c.fechaVencimiento.toLocaleDateString("es-DO") : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono">
                            RD$ {Number(c.monto).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-[var(--color-ink-soft)]">
                            {ETIQUETA_ESTADO[c.estado]} · Saldo RD${" "}
                            {saldoCargo.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      {saldoCargo > 0 &&
                        (reportadoPendiente ? (
                          <p className="mt-2 text-right text-xs font-semibold text-[var(--color-green)]">
                            Pago reportado, esperando confirmación
                          </p>
                        ) : (
                          <div className="mt-2 flex flex-col items-end">
                            <ReportarPagoForm cargoId={c.id} saldoSugerido={saldoCargo} />
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {grupos.size === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay cargos registrados.
          </p>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-[var(--color-ink)]">Facturas</h2>
      <div className="mt-3 space-y-2">
        {estudiante.facturas.map((f) => (
          <div
            key={f.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm"
          >
            <div>
              <p className="font-semibold text-[var(--color-ink)]">
                {f.numeroFactura} {f.anulada && <span className="text-red-600">(anulada)</span>}
              </p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {f.concepto} · {f.fechaEmision.toLocaleDateString("es-DO")}
              </p>
            </div>
            <p className="font-mono font-semibold">
              RD$ {Number(f.montoTotal).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
        {estudiante.facturas.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay facturas emitidas.
          </p>
        )}
      </div>
    </div>
  );
}
