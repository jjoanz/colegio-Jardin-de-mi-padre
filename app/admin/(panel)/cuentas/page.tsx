import { prisma } from "@/lib/prisma";
import { crearCuenta, actualizarCuenta, registrarMovimiento } from "@/lib/actions-cuentas";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

const TIPOS_MOVIMIENTO = [
  { value: "DEPOSITO", label: "Depósito (+)" },
  { value: "TRANSFERENCIA_ENTRADA", label: "Transferencia recibida (+)" },
  { value: "RETIRO", label: "Retiro (-)" },
  { value: "TRANSFERENCIA_SALIDA", label: "Transferencia enviada (-)" },
  { value: "AJUSTE", label: "Ajuste (usa negativo para restar)" },
];

function calcularBalance(
  balanceInicial: number,
  movimientos: { tipo: string; monto: number }[]
) {
  let balance = balanceInicial;
  for (const m of movimientos) {
    if (m.tipo === "DEPOSITO" || m.tipo === "TRANSFERENCIA_ENTRADA") balance += m.monto;
    else if (m.tipo === "RETIRO" || m.tipo === "TRANSFERENCIA_SALIDA") balance -= m.monto;
    else if (m.tipo === "AJUSTE") balance += m.monto;
  }
  return balance;
}

export default async function CuentasBancariasPage() {
  const cuentas = await prisma.cuentaBancaria.findMany({
    orderBy: { nombre: "asc" },
    include: {
      movimientos: {
        orderBy: { fecha: "desc" },
        include: { registradoPor: true },
      },
    },
  });

  const balanceTotal = cuentas
    .filter((c) => c.activa)
    .reduce(
      (s, c) =>
        s +
        calcularBalance(
          Number(c.balanceInicial),
          c.movimientos.map((m) => ({ tipo: m.tipo, monto: Number(m.monto) }))
        ),
      0
    );

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Cuentas bancarias
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Balance de cada cuenta y su historial de movimientos.
      </p>

      <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Balance total (cuentas activas)
        </p>
        <p className="mt-1 font-mono text-2xl font-bold text-[var(--color-ink)]">
          RD$ {balanceTotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {cuentas.map((c) => {
          const balance = calcularBalance(
            Number(c.balanceInicial),
            c.movimientos.map((m) => ({ tipo: m.tipo, monto: Number(m.monto) }))
          );
          return (
            <details key={c.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">
                    {c.nombre} <span className="font-normal text-[var(--color-ink-soft)]">— {c.banco}</span>
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {c.tipoCuenta ?? "Cuenta"} · {c.moneda}
                    {c.numeroCuenta && ` · ****${c.numeroCuenta.slice(-4)}`}
                    {!c.activa && " · Inactiva"}
                  </p>
                </div>
                <span
                  className={`font-mono text-lg font-bold ${
                    balance < 0 ? "text-red-600" : "text-[var(--color-green)]"
                  }`}
                >
                  RD$ {balance.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </span>
              </summary>

              <form
                action={actualizarCuenta}
                className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2"
              >
                <input type="hidden" name="cuentaId" value={c.id} />
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Nombre
                  <input name="nombre" defaultValue={c.nombre} className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Banco
                  <input name="banco" defaultValue={c.banco} className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Número de cuenta
                  <input name="numeroCuenta" defaultValue={c.numeroCuenta ?? ""} className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Tipo de cuenta
                  <input name="tipoCuenta" defaultValue={c.tipoCuenta ?? ""} placeholder="Corriente, Ahorro…" className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Moneda
                  <input name="moneda" defaultValue={c.moneda} className={inputClass} />
                </label>
                <label className="flex items-center gap-2 self-end text-xs text-[var(--color-ink-soft)]">
                  <input type="checkbox" name="activa" defaultChecked={c.activa} />
                  Cuenta activa
                </label>
                <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-xs font-bold text-white disabled:opacity-60 md:col-span-2">
                  Guardar cambios
                </BotonGuardar>
              </form>

              <div className="border-t border-[var(--color-line)] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  Registrar movimiento
                </p>
                <form action={registrarMovimiento} className="mt-2 grid gap-2 md:grid-cols-2">
                  <input type="hidden" name="cuentaId" value={c.id} />
                  <select name="tipo" required className={inputClass}>
                    {TIPOS_MOVIMIENTO.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <input name="monto" type="number" step="0.01" placeholder="Monto" required className={inputClass} />
                  <input name="descripcion" placeholder="Descripción" required className={`${inputClass} md:col-span-2`} />
                  <input type="date" name="fecha" defaultValue={new Date().toISOString().slice(0, 10)} required className={inputClass} />
                  <input name="referencia" placeholder="Referencia (opcional)" className={inputClass} />
                  <BotonGuardar textoGuardado="✓ Agregado" className="rounded-lg bg-[var(--color-green)] py-2 text-xs font-bold text-white disabled:opacity-60 md:col-span-2">
                    Agregar movimiento
                  </BotonGuardar>
                </form>
              </div>

              <div className="border-t border-[var(--color-line)] p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  Últimos movimientos
                </p>
                <div className="space-y-1.5">
                  {c.movimientos.slice(0, 10).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg bg-[var(--color-paper-dark)] px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[var(--color-ink)]">{m.descripcion}</p>
                        <p className="text-[var(--color-ink-soft)]">
                          {m.fecha.toLocaleDateString("es-DO")} · {m.tipo}
                          {m.registradoPor && ` · ${m.registradoPor.nombre}`}
                        </p>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          m.tipo === "RETIRO" || m.tipo === "TRANSFERENCIA_SALIDA"
                            ? "text-red-600"
                            : "text-[var(--color-green)]"
                        }`}
                      >
                        {m.tipo === "RETIRO" || m.tipo === "TRANSFERENCIA_SALIDA" ? "-" : "+"}RD${" "}
                        {Math.abs(Number(m.monto)).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  {c.movimientos.length === 0 && (
                    <p className="text-xs text-[var(--color-ink-soft)]">Sin movimientos todavía.</p>
                  )}
                </div>
              </div>
            </details>
          );
        })}
        {cuentas.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay cuentas bancarias registradas.
          </p>
        )}
      </div>

      <form
        action={crearCuenta}
        className="mt-8 grid gap-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-5 md:grid-cols-2"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-green)] md:col-span-2">
          + Nueva cuenta bancaria
        </p>
        <input name="nombre" placeholder="Nombre (ej. Cuenta Operativa)" required className={inputClass} />
        <input name="banco" placeholder="Banco" required className={inputClass} />
        <input name="numeroCuenta" placeholder="Número de cuenta" className={inputClass} />
        <input name="tipoCuenta" placeholder="Tipo (Corriente, Ahorro…)" className={inputClass} />
        <input name="moneda" placeholder="Moneda (DOP, USD…)" defaultValue="DOP" className={inputClass} />
        <input name="balanceInicial" type="number" step="0.01" placeholder="Balance inicial" className={inputClass} />
        <BotonGuardar
          textoGuardado="✓ Creada"
          className="rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60 md:col-span-2"
        >
          Crear cuenta
        </BotonGuardar>
      </form>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
