import { prisma } from "@/lib/prisma";
import { crearEspecial, actualizarEspecial } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function EspecialesPage() {
  const especiales = await prisma.especial.findMany({ orderBy: { fechaInicio: "desc" } });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Especiales y promociones
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Descuentos aplicables a niveles, cuido o actividades. Haz clic en uno para editarlo.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {especiales.map((e) => (
            <details key={e.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">
                    {e.nombre} {!e.activo && <span className="ml-1 text-xs font-normal text-[var(--color-ink-soft)]">(inactivo)</span>}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {e.aplicaA} · {e.fechaInicio.toLocaleDateString("es-DO")} - {e.fechaFin.toLocaleDateString("es-DO")}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-green)]/10 px-3 py-1 font-mono text-xs font-bold text-[var(--color-green)]">
                  {e.tipoDescuento === "PORCENTAJE" ? `${Number(e.valor)}%` : `RD$ ${Number(e.valor)}`}
                </span>
              </summary>
              <form action={actualizarEspecial} className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2">
                <input type="hidden" name="especialId" value={e.id} />
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Nombre
                  <input name="nombre" defaultValue={e.nombre} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Valor
                  <input name="valor" type="number" step="0.01" defaultValue={Number(e.valor)} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Tipo de descuento
                  <select name="tipoDescuento" defaultValue={e.tipoDescuento} required className={inputClass}>
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="MONTO_FIJO">Monto fijo (RD$)</option>
                  </select>
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Aplica a
                  <select name="aplicaA" defaultValue={e.aplicaA} required className={inputClass}>
                    <option value="CUALQUIERA">Cualquiera</option>
                    <option value="NIVEL">Nivel académico</option>
                    <option value="CUIDO">Programa de cuido</option>
                    <option value="ACTIVIDAD">Actividad/campamento</option>
                  </select>
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Vigente desde
                  <input name="fechaInicio" type="date" defaultValue={toDateInputValue(e.fechaInicio)} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Vigente hasta
                  <input name="fechaFin" type="date" defaultValue={toDateInputValue(e.fechaFin)} required className={inputClass} />
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
                  <input type="checkbox" name="activo" defaultChecked={e.activo} />
                  Especial activo
                </label>
                <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60">
                  Guardar cambios
                </BotonGuardar>
              </form>
            </details>
          ))}
          {especiales.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
              Aún no hay especiales creados.
            </p>
          )}
        </div>

        <form action={crearEspecial} className="h-fit space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
            Nuevo especial
          </p>
          <input name="nombre" placeholder="Nombre (ej. Beca hermanos)" required className={inputClass} />
          <select name="tipoDescuento" required className={inputClass}>
            <option value="PORCENTAJE">Porcentaje (%)</option>
            <option value="MONTO_FIJO">Monto fijo (RD$)</option>
          </select>
          <input name="valor" type="number" step="0.01" placeholder="Valor" required className={inputClass} />
          <select name="aplicaA" required className={inputClass}>
            <option value="CUALQUIERA">Cualquiera</option>
            <option value="NIVEL">Nivel académico</option>
            <option value="CUIDO">Programa de cuido</option>
            <option value="ACTIVIDAD">Actividad/campamento</option>
          </select>
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Vigente desde
            <input name="fechaInicio" type="date" required className={inputClass} />
          </label>
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Vigente hasta
            <input name="fechaFin" type="date" required className={inputClass} />
          </label>
          <BotonGuardar
            textoGuardado="✓ Creado"
            className="w-full rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            Crear especial
          </BotonGuardar>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
