import { prisma } from "@/lib/prisma";
import { crearProgramaCuido, actualizarProgramaCuido } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function CuidoPage() {
  const programas = await prisma.programaCuido.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Programas de cuido
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Cuido matutino, vespertino, de vacaciones, etc. Haz clic en uno para editarlo.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {programas.map((p) => (
            <details key={p.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">
                    {p.nombre} {!p.activo && <span className="ml-1 text-xs font-normal text-[var(--color-ink-soft)]">(inactivo)</span>}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{p.horario} · Cupo: {p.cupoMaximo ?? "sin límite"}</p>
                </div>
                <span className="rounded-full bg-[var(--color-green)]/10 px-3 py-1 font-mono text-xs font-bold text-[var(--color-green)]">
                  RD$ {Number(p.tarifaMensual).toLocaleString("es-DO", { minimumFractionDigits: 2 })}/mes
                </span>
              </summary>
              <form action={actualizarProgramaCuido} className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2">
                <input type="hidden" name="programaId" value={p.id} />
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Nombre
                  <input name="nombre" defaultValue={p.nombre} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Horario
                  <input name="horario" defaultValue={p.horario} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Tarifa mensual (RD$)
                  <input name="tarifaMensual" type="number" step="0.01" defaultValue={Number(p.tarifaMensual)} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Cupo máximo
                  <input name="cupoMaximo" type="number" defaultValue={p.cupoMaximo ?? ""} className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Foto
                  {p.imagenUrl && <img src={p.imagenUrl} alt="" className="mt-1 mb-2 h-20 w-full rounded-lg object-cover" />}
                  <input type="file" name="foto" accept="image/*" className={inputClass} />
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
                  <input type="checkbox" name="activo" defaultChecked={p.activo} />
                  Programa activo
                </label>
                <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60">
                  Guardar cambios
                </BotonGuardar>
              </form>
            </details>
          ))}
          {programas.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
              Aún no hay programas de cuido creados.
            </p>
          )}
        </div>

        <form action={crearProgramaCuido} className="h-fit space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
            Nuevo programa
          </p>
          <input name="nombre" placeholder="Nombre" required className={inputClass} />
          <input name="horario" placeholder="Horario (ej. 7:00am - 8:00am)" required className={inputClass} />
          <input name="tarifaMensual" type="number" step="0.01" placeholder="Tarifa mensual (RD$)" required className={inputClass} />
          <input name="cupoMaximo" type="number" placeholder="Cupo máximo (opcional)" className={inputClass} />
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Foto
            <input type="file" name="foto" accept="image/*" className={inputClass} />
          </label>
          <BotonGuardar
            textoGuardado="✓ Creado"
            className="w-full rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            Crear programa
          </BotonGuardar>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
