import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BecasPage() {
  const becas = await prisma.beca.findMany({
    orderBy: [{ activa: "desc" }, { creadaEn: "desc" }],
    include: { estudiante: true, creadaPor: true },
  });

  const activas = becas.filter((b) => b.activa);
  const inactivas = becas.filter((b) => !b.activa);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Becas
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Estudiantes con un % de descuento persistente en su colegiatura. Para asignar o revocar
        una beca, entra al expediente del estudiante.
      </p>

      <div className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Activas ({activas.length})
        </h2>
        <div className="mt-3 space-y-2">
          {activas.map((b) => (
            <Link
              key={b.id}
              href={`/admin/estudiantes/${b.estudianteId}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3.5 hover:bg-[var(--color-paper-dark)]"
            >
              <div>
                <p className="font-semibold text-[var(--color-ink)]">
                  {b.estudiante.nombre} {b.estudiante.apellido}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  {b.motivo || "Sin motivo especificado"}
                  {b.creadaPor && ` · Asignada por ${b.creadaPor.nombre}`} ·{" "}
                  {b.creadaEn.toLocaleDateString("es-DO")}
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-green)]/10 px-3 py-1 font-mono text-sm font-bold text-[var(--color-green)]">
                {Number(b.porcentaje)}%
              </span>
            </Link>
          ))}
          {activas.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
              Ningún estudiante tiene una beca activa por ahora.
            </p>
          )}
        </div>
      </div>

      {inactivas.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Historial (revocadas o reemplazadas) ({inactivas.length})
          </h2>
          <div className="mt-3 space-y-2">
            {inactivas.map((b) => (
              <Link
                key={b.id}
                href={`/admin/estudiantes/${b.estudianteId}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-dark)]"
              >
                <span>
                  {b.estudiante.nombre} {b.estudiante.apellido} — {b.motivo || "Sin motivo"} ·{" "}
                  {b.creadaEn.toLocaleDateString("es-DO")}
                </span>
                <span className="font-mono">{Number(b.porcentaje)}%</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
