import { prisma } from "@/lib/prisma";
import {
  crearCategoriaGasto,
  actualizarCategoriaGasto,
  crearGasto,
  actualizarGasto,
  anularGasto,
} from "@/lib/actions-gastos";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "OTRO", label: "Otro" },
];

export default async function GastosPage() {
  const [gastos, categorias, cuentas] = await Promise.all([
    prisma.gasto.findMany({
      orderBy: { fecha: "desc" },
      include: { categoria: true, registradoPor: true, cuenta: true },
    }),
    prisma.categoriaGasto.findMany({ orderBy: { nombre: "asc" } }),
    prisma.cuentaBancaria.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }),
  ]);

  const totalGastadoEsteMes = gastos
    .filter((g) => {
      const ahora = new Date();
      return (
        g.estado !== "ANULADO" &&
        g.fecha.getFullYear() === ahora.getFullYear() &&
        g.fecha.getMonth() === ahora.getMonth()
      );
    })
    .reduce((s, g) => s + Number(g.monto), 0);

  const totalGastadoHistorico = gastos
    .filter((g) => g.estado !== "ANULADO")
    .reduce((s, g) => s + Number(g.monto), 0);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Gastos
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Cada gasto se debita automáticamente de la cuenta bancaria que elijas.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Gastado este mes
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--color-ink)]">
            RD$ {totalGastadoEsteMes.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Gastado histórico
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--color-ink)]">
            RD$ {totalGastadoHistorico.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Categorías de gasto
        </h2>
        <div className="mt-3 space-y-2">
          {categorias.map((c) => (
            <details key={c.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
                <p className="font-semibold text-[var(--color-ink)]">{c.nombre}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    c.activa
                      ? "bg-[var(--color-paper-dark)] text-[var(--color-green)]"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {c.activa ? "Activa" : "Inactiva"}
                </span>
              </summary>
              <form
                action={actualizarCategoriaGasto}
                className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2"
              >
                <input type="hidden" name="categoriaId" value={c.id} />
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Nombre
                  <input name="nombre" defaultValue={c.nombre} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Descripción
                  <input name="descripcion" defaultValue={c.descripcion ?? ""} className={inputClass} />
                </label>
                <label className="flex items-center gap-2 self-end text-xs text-[var(--color-ink-soft)]">
                  <input type="checkbox" name="activa" defaultChecked={c.activa} />
                  Categoría activa
                </label>
                <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-xs font-bold text-white disabled:opacity-60 md:col-span-2">
                  Guardar cambios
                </BotonGuardar>
              </form>
            </details>
          ))}
          {categorias.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white p-6 text-center text-sm text-[var(--color-ink-soft)]">
              Aún no hay categorías de gasto. Creá la primera abajo.
            </p>
          )}
        </div>

        <form
          action={crearCategoriaGasto}
          className="mt-3 grid gap-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-4 md:grid-cols-2"
        >
          <input name="nombre" placeholder="Nombre (ej. Nómina)" required className={inputClass} />
          <input name="descripcion" placeholder="Descripción (opcional)" className={inputClass} />
          <BotonGuardar
            textoGuardado="✓ Agregada"
            className="rounded-lg bg-[var(--color-green)] py-2 text-xs font-bold text-white disabled:opacity-60 md:col-span-2"
          >
            + Agregar categoría
          </BotonGuardar>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Registrar nuevo gasto
        </h2>
        {cuentas.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-ink-soft)]">
            Necesitás crear al menos una cuenta bancaria activa antes de poder registrar un gasto.
            Andá a <strong>Cuentas bancarias</strong> para crear una.
          </p>
        ) : (
          <form
            action={crearGasto}
            className="mt-3 grid gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-5 md:grid-cols-2"
          >
            <label className="text-xs text-[var(--color-ink-soft)]">
              Categoría
              <select name="categoriaId" required className={inputClass}>
                <option value="">Seleccionar…</option>
                {categorias
                  .filter((c) => c.activa)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-xs text-[var(--color-ink-soft)]">
              Cuenta bancaria (de aquí sale el dinero)
              <select name="cuentaId" required className={inputClass}>
                <option value="">Seleccionar…</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} — {c.banco}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[var(--color-ink-soft)]">
              Monto (RD$)
              <input name="monto" type="number" step="0.01" required className={inputClass} />
            </label>
            <label className="text-xs text-[var(--color-ink-soft)]">
              Fecha
              <input type="date" name="fecha" defaultValue={new Date().toISOString().slice(0, 10)} required className={inputClass} />
            </label>
            <label className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
              Descripción
              <input name="descripcion" required className={inputClass} />
            </label>
            <label className="text-xs text-[var(--color-ink-soft)]">
              Método de pago
              <select name="metodoPago" required className={inputClass}>
                {METODOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[var(--color-ink-soft)]">
              Proveedor / a quién se le pagó
              <input name="proveedor" className={inputClass} />
            </label>
            <label className="text-xs text-[var(--color-ink-soft)]">
              # de comprobante/factura
              <input name="numeroComprobante" className={inputClass} />
            </label>
            <label className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
              Notas
              <textarea name="notas" rows={2} className={inputClass} />
            </label>
            <BotonGuardar
              textoGuardado="✓ Registrado"
              className="rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60 md:col-span-2"
            >
              Registrar gasto (debita la cuenta automáticamente)
            </BotonGuardar>
          </form>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Historial de gastos
        </h2>
        <div className="mt-3 space-y-2">
          {gastos.map((g) => (
            <details key={g.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{g.descripcion}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {g.categoria.nombre} · {g.cuenta.nombre} · {g.fecha.toLocaleDateString("es-DO")}
                    {g.proveedor && ` · ${g.proveedor}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      g.estado === "ANULADO"
                        ? "bg-red-50 text-red-600"
                        : "bg-[var(--color-paper-dark)] text-[var(--color-green)]"
                    }`}
                  >
                    {g.estado}
                  </span>
                  <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                    RD$ {Number(g.monto).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </summary>

              <form
                action={actualizarGasto}
                className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2"
              >
                <input type="hidden" name="gastoId" value={g.id} />
                <p className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
                  Monto (RD$ {Number(g.monto).toLocaleString("es-DO", { minimumFractionDigits: 2 })}), cuenta (
                  {g.cuenta.nombre}) y fecha no se pueden editar porque ya generaron un movimiento bancario real.
                  Para corregirlos, anulá este gasto y creá uno nuevo.
                </p>
                <fieldset disabled={g.estado === "ANULADO"} className="contents disabled:opacity-60">
                  <label className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
                    Descripción
                    <input name="descripcion" defaultValue={g.descripcion} className={inputClass} />
                  </label>
                  <label className="text-xs text-[var(--color-ink-soft)]">
                    Proveedor
                    <input name="proveedor" defaultValue={g.proveedor ?? ""} className={inputClass} />
                  </label>
                  <label className="text-xs text-[var(--color-ink-soft)]">
                    # de comprobante/factura
                    <input name="numeroComprobante" defaultValue={g.numeroComprobante ?? ""} className={inputClass} />
                  </label>
                  <label className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
                    Notas
                    <textarea name="notas" defaultValue={g.notas ?? ""} rows={2} className={inputClass} />
                  </label>
                  <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-xs font-bold text-white disabled:opacity-60 md:col-span-2">
                    Guardar cambios
                  </BotonGuardar>
                </fieldset>
              </form>

              {g.estado !== "ANULADO" && (
                <form action={anularGasto} className="border-t border-[var(--color-line)] p-4">
                  <input type="hidden" name="gastoId" value={g.id} />
                  <BotonGuardar
                    textoGuardado="✓ Anulado"
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Anular gasto (repone el dinero a la cuenta)
                  </BotonGuardar>
                </form>
              )}
            </details>
          ))}
          {gastos.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
              Aún no hay gastos registrados.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
