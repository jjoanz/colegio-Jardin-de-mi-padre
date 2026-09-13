import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { montoEfectivoCargo, sumaAjustes } from "@/lib/ajustes";

export const dynamic = "force-dynamic";

const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  PARCIAL: "Parcial",
  VENCIDO: "Vencido",
  ANULADO: "Anulado",
};

export default async function EstadoCuentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const estudiante = await prisma.estudiante.findUnique({
    where: { id },
    include: {
      cargos: {
        include: { pagos: true, anioEscolar: true, beca: true, ajustes: true },
        orderBy: [{ anioEscolarId: "desc" }, { numeroCuota: "asc" }, { fechaEmision: "asc" }],
      },
    },
  });

  if (!estudiante) notFound();

  const grupos = new Map<string, { nombre: string; cargos: typeof estudiante.cargos }>();
  for (const cargo of estudiante.cargos) {
    const clave = cargo.anioEscolarId ?? "sin-anio";
    const nombre = cargo.anioEscolar?.nombre ?? "Sin año escolar asignado";
    if (!grupos.has(clave)) grupos.set(clave, { nombre, cargos: [] });
    grupos.get(clave)!.cargos.push(cargo);
  }

  return (
    <div>
      <Link href={`/admin/estudiantes/${id}`} className="text-sm font-bold text-[var(--color-green)]">
        ← Expediente de {estudiante.nombre} {estudiante.apellido}
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Estado de cuenta anual
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Cuánto debe {estudiante.nombre} por cada año escolar y cómo va bajando el saldo a medida que se paga.
      </p>

      <div className="mt-8 space-y-6">
        {Array.from(grupos.values()).map((grupo) => {
          const totalCargos = grupo.cargos.reduce((s, c) => s + montoEfectivoCargo(c), 0);
          const totalPagado = grupo.cargos.reduce(
            (s, c) => s + c.pagos.reduce((s2, p) => s2 + Number(p.monto), 0),
            0
          );
          const saldo = totalCargos - totalPagado;

          return (
            <section key={grupo.nombre} className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[var(--color-ink)]">{grupo.nombre}</h2>
                <div className="flex gap-4 text-right text-sm">
                  <div>
                    <p className="text-xs text-[var(--color-ink-soft)]">Total</p>
                    <p className="font-mono font-semibold">
                      RD$ {totalCargos.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-soft)]">Pagado</p>
                    <p className="font-mono font-semibold text-[var(--color-green)]">
                      RD$ {totalPagado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-ink-soft)]">Saldo pendiente</p>
                    <p className={`font-mono font-bold ${saldo > 0 ? "text-red-600" : "text-[var(--color-green)]"}`}>
                      RD$ {saldo.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {grupo.cargos.map((c) => {
                  const pagadoCargo = c.pagos.reduce((s, p) => s + Number(p.monto), 0);
                  const ajustesCargo = sumaAjustes(c.ajustes);
                  const saldoCargo = montoEfectivoCargo(c) - pagadoCargo;
                  return (
                    <div
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--color-paper-dark)] px-4 py-2.5 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-[var(--color-ink)]">
                          {c.descripcion}
                          {c.numeroCuota && c.totalCuotas && ` (Cuota ${c.numeroCuota} de ${c.totalCuotas})`}
                        </p>
                        <p className="text-xs text-[var(--color-ink-soft)]">
                          {c.beca && `Beca ${Number(c.beca.porcentaje)}% aplicada · `}
                          Vence: {c.fechaVencimiento ? c.fechaVencimiento.toLocaleDateString("es-DO") : "—"}
                          {ajustesCargo !== 0 &&
                            ` · Ajuste: ${ajustesCargo > 0 ? "+" : "-"}RD$ ${Math.abs(ajustesCargo).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono">
                          RD$ {Number(c.monto).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-[var(--color-ink-soft)]">
                          {ETIQUETA_ESTADO[c.estado]} · Saldo RD${" "}
                          {saldoCargo.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {grupos.size === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay cargos registrados para este estudiante.
          </p>
        )}
      </div>
    </div>
  );
}
