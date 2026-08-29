import { prisma } from "@/lib/prisma";
import { crearNivel, actualizarNivel } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function NivelesPage() {
  const niveles = await prisma.nivel.findMany({ orderBy: { ordenVisual: "asc" } });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Niveles académicos
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        La matrícula es el pago único de inscripción y se cobra automáticamente al aprobar
        una solicitud. La colegiatura anual es el costo total del año escolar — el sistema
        la divide sola en cuotas mensuales según el plan de pago de cada estudiante y las
        va generando automáticamente en el día de pago que definas aquí.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {niveles.map((n) => (
            <details key={n.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">
                    {n.nombre} {!n.activo && <span className="ml-1 text-xs font-normal text-[var(--color-ink-soft)]">(inactivo)</span>}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {n.cupoMaximo ? `Cupo: ${n.cupoMaximo}` : "Sin límite de cupo"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block rounded-full bg-[var(--color-green)]/10 px-3 py-1 font-mono text-xs font-bold text-[var(--color-green)]">
                    Matrícula RD$ {Number(n.tarifaInscripcion).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </span>
                  {Number(n.colegiaturaAnual) > 0 && (
                    <span className="mt-1 block font-mono text-xs text-[var(--color-ink-soft)]">
                      Colegiatura RD$ {Number(n.colegiaturaAnual).toLocaleString("es-DO", { minimumFractionDigits: 2 })}/año
                    </span>
                  )}
                </div>
              </summary>

              <form action={actualizarNivel} className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2">
                <input type="hidden" name="nivelId" value={n.id} />
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Nombre
                  <input name="nombre" defaultValue={n.nombre} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Precio de matrícula (RD$)
                  <input name="tarifaInscripcion" type="number" step="0.01" defaultValue={Number(n.tarifaInscripcion)} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Colegiatura anual (RD$)
                  <input name="colegiaturaAnual" type="number" step="0.01" defaultValue={Number(n.colegiaturaAnual)} className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Día de pago (1-28)
                  <input name="diaPago" type="number" min="1" max="28" defaultValue={n.diaPago} className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Cupo máximo (opcional)
                  <input name="cupoMaximo" type="number" defaultValue={n.cupoMaximo ?? ""} className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Orden de aparición en la landing
                  <input name="ordenVisual" type="number" defaultValue={n.ordenVisual} className={inputClass} />
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
                  <input type="checkbox" name="activo" defaultChecked={n.activo} />
                  Nivel activo (visible en la landing)
                </label>
                <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60">
                  Guardar cambios
                </BotonGuardar>
              </form>
            </details>
          ))}
          {niveles.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
              Aún no hay niveles creados.
            </p>
          )}
        </div>

        <form action={crearNivel} className="h-fit space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
            Nuevo nivel
          </p>
          <input name="nombre" placeholder="Nombre (ej. Kínder)" required className={inputClass} />
          <input name="tarifaInscripcion" type="number" step="0.01" placeholder="Precio de matrícula (RD$)" required className={inputClass} />
          <input name="colegiaturaAnual" type="number" step="0.01" placeholder="Colegiatura anual (RD$)" className={inputClass} />
          <input name="diaPago" type="number" min="1" max="28" placeholder="Día de pago (1-28)" defaultValue={5} className={inputClass} />
          <input name="cupoMaximo" type="number" placeholder="Cupo máximo (opcional)" className={inputClass} />
          <input name="ordenVisual" type="number" placeholder="Orden de aparición" className={inputClass} />
          <BotonGuardar
            textoGuardado="✓ Creado"
            className="w-full rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            Crear nivel
          </BotonGuardar>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
