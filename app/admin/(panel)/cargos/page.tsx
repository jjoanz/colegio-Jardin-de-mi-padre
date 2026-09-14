import { prisma } from "@/lib/prisma";
import { crearCargo, actualizarCargo, anularCargo } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";
import { AplicarCostoAdicional } from "@/components/AplicarCostoAdicional";

export const dynamic = "force-dynamic";

export default async function CargosPage() {
  const [cargos, estudiantes, especiales, costosAdicionales, aniosEscolares] = await Promise.all([
    prisma.cargo.findMany({
      orderBy: { fechaEmision: "desc" },
      include: { estudiante: true, pagos: true, anioEscolar: true },
    }),
    prisma.estudiante.findMany({ orderBy: { nombre: "asc" } }),
    prisma.especial.findMany({ where: { activo: true } }),
    prisma.cargoAdicional.findMany({
      where: { activo: true },
      include: { grado: { include: { nivel: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.anioEscolar.findMany({ orderBy: { fechaInicio: "desc" } }),
  ]);
  const anioActivoId = aniosEscolares.find((a) => a.activo)?.id ?? aniosEscolares[0]?.id ?? "";

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Registro de Cuentas por Cobrar
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Inscripciones, mensualidades, cuido y actividades pendientes de cobro — cada uno es una
        cuenta por cobrar. Un registro solo se puede editar o anular mientras no tenga pagos registrados.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {cargos.map((c) => {
            const periodoCerrado = c.anioEscolar?.estadoCierre === "CERRADO";
            const editable = c.pagos.length === 0 && c.estado !== "ANULADO" && !periodoCerrado;
            return (
              <details key={c.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="font-semibold text-[var(--color-ink)]">
                      {c.estudiante.nombre} {c.estudiante.apellido}
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      {c.descripcion}
                      {c.anioEscolar && ` · ${c.anioEscolar.nombre}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {periodoCerrado && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        período cerrado
                      </span>
                    )}
                    <span className="font-mono text-sm">
                      RD$ {Number(c.monto).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </span>
                    <EstadoBadge estado={c.estado} />
                  </div>
                </summary>

                {editable ? (
                  <div className="border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4">
                    <form action={actualizarCargo} className="grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="cargoId" value={c.id} />
                      <select name="concepto" defaultValue={c.concepto} required className={inputClass}>
                        <option value="MATRICULA">Inscripción</option>
                        <option value="MENSUALIDAD">Mensualidad</option>
                        <option value="CUIDO">Cuido</option>
                        <option value="ACTIVIDAD">Actividad</option>
                        <option value="CAMPAMENTO">Campamento</option>
                        <option value="OTRO">Otro</option>
                      </select>
                      <input name="monto" type="number" step="0.01" defaultValue={Number(c.monto)} required className={inputClass} />
                      <input name="descripcion" defaultValue={c.descripcion} required className={`md:col-span-2 ${inputClass}`} />
                      <select name="especialId" defaultValue={c.especialId ?? ""} className={inputClass}>
                        <option value="">Sin especial/descuento</option>
                        {especiales.map((es) => (
                          <option key={es.id} value={es.id}>{es.nombre}</option>
                        ))}
                      </select>
                      <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60">
                        Guardar cambios
                      </BotonGuardar>
                    </form>
                    <form action={anularCargo} className="mt-2">
                      <input type="hidden" name="cargoId" value={c.id} />
                      <BotonGuardar textoGuardado="✓ Anulado" className="text-xs font-bold text-red-600 disabled:opacity-60">
                        Anular este registro
                      </BotonGuardar>
                    </form>
                  </div>
                ) : (
                  <p className="border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 text-xs text-[var(--color-ink-soft)]">
                    {c.estado === "ANULADO"
                      ? "Este registro está anulado."
                      : periodoCerrado
                      ? "El período de esta cuenta por cobrar está cerrado — usa un ajuste contable para corregirlo."
                      : "Ya tiene pagos registrados — no se puede editar ni anular."}
                  </p>
                )}
              </details>
            );
          })}
          {cargos.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
              Aún no hay cuentas por cobrar registradas.
            </p>
          )}
        </div>

        <form action={crearCargo} className="h-fit space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
            Nueva cuenta por cobrar
          </p>
          <select name="estudianteId" required className={inputClass}>
            <option value="">Seleccionar estudiante…</option>
            {estudiantes.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>
            ))}
          </select>
          <select name="concepto" required className={inputClass}>
            <option value="MATRICULA">Inscripción</option>
            <option value="MENSUALIDAD">Mensualidad</option>
            <option value="CUIDO">Cuido</option>
            <option value="ACTIVIDAD">Actividad</option>
            <option value="CAMPAMENTO">Campamento</option>
            <option value="OTRO">Otro</option>
          </select>
          <select name="anioEscolarId" defaultValue={anioActivoId} className={inputClass}>
            <option value="">Sin período asignado</option>
            {aniosEscolares.map((a) => (
              <option key={a.id} value={a.id} disabled={a.estadoCierre === "CERRADO"}>
                {a.nombre} {a.estadoCierre === "CERRADO" ? "(cerrado)" : ""}
              </option>
            ))}
          </select>
          <AplicarCostoAdicional
            costos={costosAdicionales.map((c) => ({
              id: c.id,
              nombre: c.nombre,
              monto: Number(c.monto),
              gradoEtiqueta: `${c.grado.nivel.nombre} - ${c.grado.nombre}`,
            }))}
            className={inputClass}
          />
          <select name="especialId" className={inputClass}>
            <option value="">Sin especial/descuento</option>
            {especiales.map((es) => (
              <option key={es.id} value={es.id}>{es.nombre}</option>
            ))}
          </select>
          <BotonGuardar
            textoGuardado="✓ Creado"
            className="w-full rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            Registrar cuenta por cobrar
          </BotonGuardar>
        </form>
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    PENDIENTE: "bg-amber-100 text-amber-800",
    PAGADO: "bg-green-100 text-green-800",
    PARCIAL: "bg-blue-100 text-blue-800",
    VENCIDO: "bg-red-100 text-red-800",
    ANULADO: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[estado]}`}>
      {estado.toLowerCase()}
    </span>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
