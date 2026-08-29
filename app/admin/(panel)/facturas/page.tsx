import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { anularFactura } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function FacturasPage() {
  const facturas = await prisma.factura.findMany({
    orderBy: { fechaEmision: "desc" },
    include: { estudiante: true },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Facturas
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Estos son los recibos fiscales que se generan automáticamente cada vez que se registra
        un pago. Por integridad contable no se editan — si una factura está mal, se anula y se
        corrige el pago que la originó. Para ver cuánto debe un estudiante en el año completo
        (colegiatura en cuotas, saldo pendiente), entra a su expediente y abre &quot;Estado de
        cuenta anual&quot;.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-paper-dark)] text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">No. Factura</th>
              <th className="px-4 py-3">Estudiante</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f) => (
              <tr key={f.id} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{f.numeroFactura}</td>
                <td className="px-4 py-3">
                  {f.estudiante.nombre} {f.estudiante.apellido}
                </td>
                <td className="px-4 py-3">{f.concepto}</td>
                <td className="px-4 py-3 font-mono">
                  RD$ {Number(f.montoTotal).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {f.fechaEmision.toLocaleDateString("es-DO")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/facturas/${f.id}`} className="font-bold text-[var(--color-green)]">
                      Ver / imprimir
                    </Link>
                    {f.anulada ? (
                      <span className="text-xs font-semibold text-red-600">Anulada</span>
                    ) : (
                      <form action={anularFactura}>
                        <input type="hidden" name="facturaId" value={f.id} />
                        <BotonGuardar textoGuardado="✓ Anulado" className="text-xs font-semibold text-red-600 disabled:opacity-60">
                          Anular
                        </BotonGuardar>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {facturas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Aún no se ha generado ninguna factura — se crean automáticamente al registrar un pago.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
