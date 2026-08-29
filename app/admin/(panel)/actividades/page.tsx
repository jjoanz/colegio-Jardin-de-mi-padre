import { prisma } from "@/lib/prisma";
import { crearActividad, actualizarActividad } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ActividadesPage() {
  const actividades = await prisma.actividad.findMany({ orderBy: { fechaInicio: "desc" } });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Actividades y campamentos
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Eventos con fecha, tarifa y cupo. Haz clic en uno para editarlo.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {actividades.map((a) => (
            <details key={a.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">
                    {a.nombre} {!a.activa && <span className="ml-1 text-xs font-normal text-[var(--color-ink-soft)]">(inactiva)</span>}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {a.fechaInicio.toLocaleDateString("es-DO")} - {a.fechaFin.toLocaleDateString("es-DO")} · Cupo: {a.cupoMaximo ?? "sin límite"}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-green)]/10 px-3 py-1 font-mono text-xs font-bold text-[var(--color-green)]">
                  RD$ {Number(a.tarifa).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </span>
              </summary>
              <form action={actualizarActividad} className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2">
                <input type="hidden" name="actividadId" value={a.id} />
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Nombre
                  <input name="nombre" defaultValue={a.nombre} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Tarifa (RD$)
                  <input name="tarifa" type="number" step="0.01" defaultValue={Number(a.tarifa)} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Fecha inicio
                  <input name="fechaInicio" type="date" defaultValue={toDateInputValue(a.fechaInicio)} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Fecha fin
                  <input name="fechaFin" type="date" defaultValue={toDateInputValue(a.fechaFin)} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
                  Descripción
                  <textarea name="descripcion" defaultValue={a.descripcion ?? ""} rows={2} className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Cupo máximo
                  <input name="cupoMaximo" type="number" defaultValue={a.cupoMaximo ?? ""} className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
                  Foto
                  {a.imagenUrl && <img src={a.imagenUrl} alt="" className="mt-1 mb-2 h-20 w-full rounded-lg object-cover" />}
                  <input type="file" name="foto" accept="image/*" className={inputClass} />
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
                  <input type="checkbox" name="activa" defaultChecked={a.activa} />
                  Actividad activa
                </label>
                <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60 md:col-span-2">
                  Guardar cambios
                </BotonGuardar>
              </form>
            </details>
          ))}
          {actividades.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
              Aún no hay actividades creadas.
            </p>
          )}
        </div>

        <form action={crearActividad} className="h-fit space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
            Nueva actividad
          </p>
          <input name="nombre" placeholder="Nombre" required className={inputClass} />
          <textarea name="descripcion" placeholder="Descripción" rows={2} className={inputClass} />
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Fecha inicio
            <input name="fechaInicio" type="date" required className={inputClass} />
          </label>
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Fecha fin
            <input name="fechaFin" type="date" required className={inputClass} />
          </label>
          <input name="tarifa" type="number" step="0.01" placeholder="Tarifa (RD$)" required className={inputClass} />
          <input name="cupoMaximo" type="number" placeholder="Cupo máximo (opcional)" className={inputClass} />
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Foto
            <input type="file" name="foto" accept="image/*" className={inputClass} />
          </label>
          <BotonGuardar
            textoGuardado="✓ Creada"
            className="w-full rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            Crear actividad
          </BotonGuardar>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
