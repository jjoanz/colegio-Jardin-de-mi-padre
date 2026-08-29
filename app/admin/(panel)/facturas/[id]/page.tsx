import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Colegio Ejemplo";

export default async function FacturaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const factura = await prisma.factura.findUnique({
    where: { id },
    include: {
      estudiante: {
        include: {
          tutores: { include: { tutor: true } },
          cargos: { include: { pagos: true } },
        },
      },
      pago: { include: { cargo: { include: { pagos: true } } } },
    },
  });

  if (!factura) notFound();

  const tutorPrincipal =
    factura.estudiante.tutores.find((t) => t.esContactoPrincipal)?.tutor ??
    factura.estudiante.tutores[0]?.tutor;

  // Saldo pendiente del cargo específico que originó esta factura
  const cargo = factura.pago.cargo;
  const totalPagadoCargo = cargo.pagos.reduce((s, p) => s + Number(p.monto), 0);
  const saldoPendienteCargo = Math.max(0, Number(cargo.monto) - totalPagadoCargo);

  // Balance total del estudiante considerando todos sus cargos
  const totalCargosEstudiante = factura.estudiante.cargos
    .filter((c) => c.estado !== "ANULADO")
    .reduce((s, c) => s + Number(c.monto), 0);
  const totalPagadoEstudiante = factura.estudiante.cargos.reduce(
    (s, c) => s + c.pagos.reduce((s2, p) => s2 + Number(p.monto), 0),
    0
  );
  const balanceEstudiante = totalCargosEstudiante - totalPagadoEstudiante;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <a href="/admin/facturas" className="text-sm font-bold text-[var(--color-green)]">
          ← Volver a facturas
        </a>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--color-line)] bg-white p-10 print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b-2 border-[var(--color-ink)] pb-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
              {SCHOOL_NAME}
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              {process.env.NEXT_PUBLIC_SCHOOL_PHONE} · {process.env.NEXT_PUBLIC_SCHOOL_EMAIL}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-soft)]">Factura</p>
            <p className="font-mono text-lg font-bold text-[var(--color-ink)]">{factura.numeroFactura}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
              {factura.fechaEmision.toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">Facturado a</p>
            <p className="mt-1 font-semibold text-[var(--color-ink)]">
              {tutorPrincipal ? `${tutorPrincipal.nombre} ${tutorPrincipal.apellido}` : "—"}
            </p>
            {tutorPrincipal && (
              <p className="text-[var(--color-ink-soft)]">
                {tutorPrincipal.email}
                <br />
                {tutorPrincipal.telefono}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">Estudiante</p>
            <p className="mt-1 font-semibold text-[var(--color-ink)]">
              {factura.estudiante.nombre} {factura.estudiante.apellido}
            </p>
            <p className="text-[var(--color-ink-soft)]">Expediente: {factura.estudiante.numeroExpediente}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="pb-2">Concepto</th>
              <th className="pb-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--color-line)]">
              <td className="py-3">{factura.concepto}</td>
              <td className="py-3 text-right font-mono">
                RD$ {Number(factura.montoSubtotal).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-[var(--color-ink-soft)]">
              <span>Subtotal</span>
              <span className="font-mono">
                RD$ {Number(factura.montoSubtotal).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[var(--color-ink-soft)]">
              <span>ITBIS (exento)</span>
              <span className="font-mono">
                RD$ {Number(factura.itbis).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between border-t-2 border-[var(--color-ink)] pt-1.5 text-base font-bold text-[var(--color-ink)]">
              <span>Total pagado</span>
              <span className="font-mono">
                RD$ {Number(factura.montoTotal).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`flex justify-between rounded-lg px-2.5 py-2 text-sm font-bold ${saldoPendienteCargo > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              <span>Saldo pendiente (este cargo)</span>
              <span className="font-mono">
                RD$ {saldoPendienteCargo.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-64 rounded-lg border border-[var(--color-line)] px-3 py-2.5 text-right text-xs text-[var(--color-ink-soft)]">
            Balance general del estudiante:{" "}
            <span className={`font-mono font-bold ${balanceEstudiante > 0 ? "text-red-600" : "text-[var(--color-green)]"}`}>
              RD$ {balanceEstudiante.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--color-line)] pt-4 text-xs text-[var(--color-ink-soft)]">
          <p>
            Tipo: <span className="font-bold text-[var(--color-ink)]">{factura.pago.tipoPago === "PAGO_TOTAL" ? "Pago total" : "Abono"}</span>
            {" "}· Método de pago: {factura.pago.metodo.replace(/_/g, " ")} · Referencia: {factura.pago.referencia || "—"}
          </p>
          <p className="mt-2">
            Documento de uso interno del colegio. No constituye un comprobante fiscal
            electrónico (e-CF) válido ante la DGII.
          </p>
        </div>
      </div>
    </div>
  );
}

