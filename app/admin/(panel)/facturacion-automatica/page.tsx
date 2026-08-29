import { prisma } from "@/lib/prisma";
import { actualizarColegiaturaNivel, generarCargosAhora } from "@/lib/actions";
import { obtenerEstadoGeneracion } from "@/lib/generacion-cargos";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

function hace(fecha: number | null): string {
  if (!fecha) return "Aún no ha corrido desde que arrancó el servidor.";
  const minutos = Math.round((Date.now() - fecha) / 60000);
  if (minutos < 1) return "Hace instantes.";
  if (minutos === 1) return "Hace 1 minuto.";
  if (minutos < 60) return `Hace ${minutos} minutos.`;
  const horas = Math.round(minutos / 60);
  return horas === 1 ? "Hace 1 hora." : `Hace ${horas} horas.`;
}

export default async function FacturacionAutomaticaPage() {
  const [niveles, matriculasConPlan] = await Promise.all([
    prisma.nivel.findMany({ where: { activo: true }, orderBy: { ordenVisual: "asc" } }),
    prisma.matricula.findMany({
      where: { estado: "ACTIVA", planPago: { not: null } },
      include: { aula: { select: { nivelId: true } } },
    }),
  ]);

  const conteoPorNivel = new Map<string, number>();
  for (const m of matriculasConPlan) {
    conteoPorNivel.set(m.aula.nivelId, (conteoPorNivel.get(m.aula.nivelId) ?? 0) + 1);
  }

  const estado = obtenerEstadoGeneracion();

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Facturación automática
      </h1>
      <p className="mt-1 max-w-2xl text-[var(--color-ink-soft)]">
        El sistema genera solo las cuotas de colegiatura que ya vencieron según el plan de pago
        de cada estudiante (no las del año completo de una vez) — corre automáticamente cada vez
        que alguien del personal entra al panel, sin que nadie tenga que hacer nada. Aquí defines
        en qué día del mes vence cada cuota por nivel, y puedes forzar la generación manualmente.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Última vez que corrió (en este proceso del servidor)
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink)]">{hace(estado.ultimaEjecucion)}</p>
          {estado.ultimaEjecucion && (
            <p className="text-xs text-[var(--color-ink-soft)]">
              Generó {estado.ultimoConteo} cargo(s) nuevo(s) esa vez.
            </p>
          )}
        </div>
        <form action={generarCargosAhora}>
          <BotonGuardar textoGuardado="✓ Generado" className="rounded-lg bg-[var(--color-green)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            Generar ahora
          </BotonGuardar>
        </form>
      </div>

      <h2 className="mt-8 text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
        Configuración por nivel — cuándo vence cada cuota
      </h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-line)] bg-[var(--color-paper-dark)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3">Colegiatura anual (RD$)</th>
              <th className="px-4 py-3">Día de pago (1-28)</th>
              <th className="px-4 py-3">Estudiantes con plan activo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {niveles.map((n) => (
              <tr key={n.id} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">{n.nombre}</td>
                <td className="px-4 py-3">
                  <input
                    form={`form-${n.id}`}
                    name="colegiaturaAnual"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={Number(n.colegiaturaAnual)}
                    className="w-32 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-green)]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    form={`form-${n.id}`}
                    name="diaPago"
                    type="number"
                    min="1"
                    max="28"
                    defaultValue={n.diaPago}
                    className="w-20 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-green)]"
                  />
                </td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                  {conteoPorNivel.get(n.id) ?? 0}
                </td>
                <td className="px-4 py-3">
                  <button
                    form={`form-${n.id}`}
                    className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
                  >
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
            {niveles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  No hay niveles activos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Un formulario por nivel, referenciado desde sus inputs/botón dentro de la
          tabla vía el atributo form="..." — no puede ir dentro de <tr> (HTML inválido). */}
      {niveles.map((n) => (
        <form key={n.id} action={actualizarColegiaturaNivel} id={`form-${n.id}`} className="hidden">
          <input type="hidden" name="nivelId" value={n.id} />
        </form>
      ))}
      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
        Si un nivel tiene colegiatura en RD$0, no se le generan cuotas de mensualidad (solo la
        matrícula, si aplica). El plan de pago de cada estudiante (pago único, dos pagos o diez
        cuotas) se elige al aprobarlo o en su expediente.
      </p>
    </div>
  );
}
