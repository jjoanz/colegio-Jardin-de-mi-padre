import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { IconBook, IconStar, IconClock, IconLeaf } from "@/components/Icons";
import { montoEfectivoCargo } from "@/lib/ajustes";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [solicitudesNuevas, estudiantesActivos, cargosVencidos, cargosActivos, pagosDelMes] =
    await Promise.all([
      prisma.solicitudInscripcion.count({ where: { estado: "NUEVA" } }),
      prisma.estudiante.count({ where: { estado: "ACTIVO" } }),
      prisma.cargo.count({ where: { estado: "VENCIDO" } }),
      prisma.cargo.findMany({
        where: { estado: { not: "ANULADO" } },
        include: { pagos: true, ajustes: true },
      }),
      prisma.pago.findMany({
        where: { fechaPago: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
    ]);

  // --- Balance financiero del colegio (todos los estudiantes juntos) ---
  const totalFacturado = cargosActivos.reduce((s, c) => s + montoEfectivoCargo(c), 0);
  const totalCobrado = cargosActivos.reduce(
    (s, c) => s + c.pagos.reduce((s2, p) => s2 + Number(p.monto), 0),
    0
  );
  const totalPorCobrar = totalFacturado - totalCobrado;
  const cobradoEsteMes = pagosDelMes.reduce((s, p) => s + Number(p.monto), 0);
  const abonosEsteMes = pagosDelMes.filter((p) => p.tipoPago === "ABONO").length;
  const pagosTotalesEsteMes = pagosDelMes.filter((p) => p.tipoPago === "PAGO_TOTAL").length;

  const stats = [
    { label: "Solicitudes nuevas", value: solicitudesNuevas, icon: IconStar, color: "var(--color-gold)" },
    { label: "Estudiantes activos", value: estudiantesActivos, icon: IconLeaf, color: "var(--color-green)" },
    { label: "Cuentas por cobrar vencidas", value: cargosVencidos, icon: IconClock, color: "#dc2626" },
  ];

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Panel general
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">Resumen del colegio en tiempo real.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-[0_2px_10px_rgba(22,50,74,0.05)]"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${s.color} 12%, white)` }}
            >
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <p className="mt-3 text-2xl font-bold text-[var(--color-ink)]">{s.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
            Balance financiero del colegio
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Suma de todos los estudiantes juntos, en tiempo real.
          </p>
        </div>
        <Link
          href="/admin/anios-escolares"
          className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
        >
          Ver por período académico →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Total facturado</p>
          <p className="mt-2 font-mono text-xl font-bold text-[var(--color-ink)]">
            RD$ {totalFacturado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Total cobrado</p>
          <p className="mt-2 font-mono text-xl font-bold text-[var(--color-green)]">
            RD$ {totalCobrado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Pendiente por cobrar</p>
          <p className={`mt-2 font-mono text-xl font-bold ${totalPorCobrar > 0 ? "text-red-600" : "text-[var(--color-green)]"}`}>
            RD$ {totalPorCobrar.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Cobrado este mes</p>
          <p className="mt-2 font-mono text-xl font-bold text-[var(--color-ink)]">
            RD$ {cobradoEsteMes.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            {pagosTotalesEsteMes} pago(s) total · {abonosEsteMes} abono(s)
          </p>
        </div>
      </div>
    </div>
  );
}
