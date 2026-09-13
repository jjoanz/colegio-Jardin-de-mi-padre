import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CeldaMinerd } from "@/components/estudiantes/CeldaMinerd";
import { montoEfectivoCargo } from "@/lib/ajustes";

export const dynamic = "force-dynamic";

export default async function EstudiantesPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const puedeEditar = ((session?.user as { permisos?: string[] } | undefined)?.permisos ?? []).includes(
    "estudiantes:editar"
  );

  // Si es Profesor, solo ve a los estudiantes matriculados (activos) en las
  // aulas donde él es el docente asignado. Cualquier otro rol (ADMIN,
  // SECRETARIA, CONTABILIDAD) sigue viendo a todos, como antes.
  let aulaIdsPermitidas: string[] | null = null;
  if (role === "PROFESOR" && userId) {
    const bloquesDelProfesor = await prisma.bloqueHorario.findMany({
      where: { docenteId: userId },
      select: { aulaId: true },
      distinct: ["aulaId"],
    });
    aulaIdsPermitidas = bloquesDelProfesor.map((b) => b.aulaId);
  }

  const estudiantes = await prisma.estudiante.findMany({
    where: aulaIdsPermitidas
      ? {
          matriculas: {
            some: { aulaId: { in: aulaIdsPermitidas }, estado: "ACTIVA" },
          },
        }
      : undefined,
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    include: {
      nivel: true,
      tutores: { include: { tutor: true } },
      cargos: { include: { pagos: true, ajustes: true } },
    },
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Estudiantes
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        {aulaIdsPermitidas
          ? "Estudiantes de tus aulas asignadas."
          : "Expediente, nivel, padres/madres/tutores y balance de cuenta de cada alumno."}
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-paper-dark)] text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">Expediente</th>
              <th className="px-4 py-3">Estudiante</th>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3">Padre/Madre/Tutor principal</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Matrícula MINERD</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map((e) => {
              const totalCargos = e.cargos.reduce((s, c) => s + montoEfectivoCargo(c), 0);
              const totalPagado = e.cargos.reduce(
                (s, c) => s + c.pagos.reduce((s2, p) => s2 + Number(p.monto), 0),
                0
              );
              const balance = totalCargos - totalPagado;
              const tutorPrincipal =
                e.tutores.find((t) => t.esContactoPrincipal)?.tutor ?? e.tutores[0]?.tutor;

              return (
                <tr key={e.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-soft)]">
                    {e.numeroExpediente}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/estudiantes/${e.id}`}
                      className="font-semibold text-[var(--color-green)] hover:underline"
                    >
                      {e.nombre} {e.apellido}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{e.nivel?.nombre ?? "—"}</td>
                  <td className="px-4 py-3">
                    {tutorPrincipal ? `${tutorPrincipal.nombre} ${tutorPrincipal.apellido}` : "—"}
                  </td>
                  <td className="px-4 py-3">{e.estado}</td>
                  <td className="px-4 py-3 font-mono">
                    <span className={balance > 0 ? "text-red-600" : "text-[var(--color-green)]"}>
                      RD$ {balance.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {puedeEditar ? (
                      <CeldaMinerd estudianteId={e.id} valorActual={e.numeroMatriculaMinerd} />
                    ) : (
                      <span className="font-mono text-xs text-[var(--color-ink-soft)]">
                        {e.numeroMatriculaMinerd || "—"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {estudiantes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  {aulaIdsPermitidas
                    ? "Aún no tienes estudiantes matriculados en tus aulas asignadas."
                    : "Aún no hay estudiantes registrados. Aprueba una solicitud de inscripción para crear el primero."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
