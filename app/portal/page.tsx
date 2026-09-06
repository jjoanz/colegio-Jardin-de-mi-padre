import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await auth();
  const tutorId = (session!.user as { id: string }).id;

  const vinculos = await prisma.estudianteTutor.findMany({
    where: { tutorId },
    include: {
      estudiante: {
        include: { cargos: { include: { pagos: true } }, nivel: true },
      },
    },
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Mis hijos
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Aquí puedes ver el estado de cuenta y las facturas de cada uno de tus hijos.
      </p>

      <div className="mt-6 space-y-3">
        {vinculos.map(({ estudiante }) => {
          const totalCargos = estudiante.cargos.reduce((s, c) => s + Number(c.monto), 0);
          const totalPagado = estudiante.cargos.reduce(
            (s, c) => s + c.pagos.reduce((s2, p) => s2 + Number(p.monto), 0),
            0
          );
          const saldo = totalCargos - totalPagado;

          return (
            <Link
              key={estudiante.id}
              href={`/portal/estudiantes/${estudiante.id}`}
              className="block rounded-2xl border border-[var(--color-line)] bg-white p-5 hover:border-[var(--color-green)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">
                    {estudiante.nombre} {estudiante.apellido}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    Exp. {estudiante.numeroExpediente} · {estudiante.nivel?.nombre ?? "Sin nivel asignado"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--color-ink-soft)]">Saldo pendiente</p>
                  <p className={`font-mono font-bold ${saldo > 0 ? "text-red-600" : "text-[var(--color-green)]"}`}>
                    RD$ {saldo.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
        {vinculos.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Todavía no tienes hijos vinculados a tu cuenta.
          </p>
        )}
      </div>
    </div>
  );
}
