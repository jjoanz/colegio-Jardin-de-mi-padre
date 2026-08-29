import { prisma } from "@/lib/prisma";
import { registrarPago } from "@/lib/actions";
import { PagoCargoSelect } from "@/components/PagoCargoSelect";
import { CobroPorCedula } from "@/components/CobroPorCedula";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const [pagos, cargosPendientesRaw, cuentas] = await Promise.all([
    prisma.pago.findMany({
      orderBy: { fechaPago: "desc" },
      include: { cargo: { include: { estudiante: true } }, registradoPor: true, cuenta: true },
      take: 50,
    }),
    prisma.cargo.findMany({
      where: { estado: { in: ["PENDIENTE", "PARCIAL"] } },
      include: { estudiante: true, pagos: true },
      orderBy: { fechaEmision: "asc" },
    }),
    prisma.cuentaBancaria.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }),
  ]);

  const cargosPendientes = cargosPendientesRaw.map((c) => {
    const totalPagado = c.pagos.reduce((s, p) => s + Number(p.monto), 0);
    return {
      id: c.id,
      descripcion: c.descripcion,
      pendiente: Number(c.monto) - totalPagado,
      estudianteNombre: `${c.estudiante.nombre} ${c.estudiante.apellido}`,
    };
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Caja de Cobro
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Registra manualmente los pagos recibidos por enlace de pago Azul, transferencia o efectivo.
      </p>

      <div className="mt-6">
        <CobroPorCedula
          cuentas={cuentas.map((c) => ({ id: c.id, nombre: c.nombre, banco: c.banco }))}
        />
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-paper-dark)] text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Cuenta</th>
                <th className="px-4 py-3">Referencia</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-mono text-xs">
                    {p.fechaPago.toLocaleDateString("es-DO")}
                  </td>
                  <td className="px-4 py-3">
                    {p.cargo.estudiante.nombre} {p.cargo.estudiante.apellido}
                  </td>
                  <td className="px-4 py-3">{p.cargo.descripcion}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.tipoPago === "PAGO_TOTAL" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                      {p.tipoPago === "PAGO_TOTAL" ? "Pago total" : "Abono"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    RD$ {Number(p.monto).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-xs">{p.metodo.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-xs">{p.cuenta?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{p.referencia || "—"}</td>
                </tr>
              ))}
              {pagos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                    Aún no hay pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form action={registrarPago} className="space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
            Registrar un abono o pago individual
          </p>
          <p className="text-xs text-[var(--color-ink-soft)]">
            Para pagos parciales o un solo cargo específico. Si son varios cargos juntos, usa la búsqueda por cédula de arriba.
          </p>

          <PagoCargoSelect cargos={cargosPendientes} />

          <select name="metodo" required className={inputClass}>
            <option value="ENLACE_PAGO_AZUL">Enlace de pago Azul</option>
            <option value="TRANSFERENCIA">Transferencia bancaria</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="CHEQUE">Cheque</option>
            <option value="OTRO">Otro</option>
          </select>
          <select name="cuentaId" className={inputClass}>
            <option value="">Sin cuenta bancaria (no afecta balances)</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.banco}
              </option>
            ))}
          </select>
          <input name="referencia" placeholder="Referencia / # de confirmación" className={inputClass} />
          <textarea name="notas" placeholder="Notas (opcional)" rows={2} className={inputClass} />
          <BotonGuardar
            textoGuardado="✓ Registrado"
            className="w-full rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            Registrar pago
          </BotonGuardar>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
