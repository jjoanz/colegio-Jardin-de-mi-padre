import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { obtenerDatosPeriodo } from "@/lib/periodos";

export const dynamic = "force-dynamic";

type SearchParams = { estado?: string };

export default async function CierresPeriodoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filtroEstado = sp.estado === "ABIERTO" || sp.estado === "CERRADO" ? sp.estado : "";

  const aniosEscolares = await prisma.anioEscolar.findMany({
    where: filtroEstado ? { estadoCierre: filtroEstado } : undefined,
    orderBy: { fechaInicio: "desc" },
  });
  const filas = await Promise.all(
    aniosEscolares.map(async (a) => ({ anio: a, ...(await obtenerDatosPeriodo(a.id)) }))
  );

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Cierres de períodos
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Vista consolidada de todos los períodos académicos, abiertos y cerrados, con su corte financiero.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-xs text-[var(--color-ink-soft)]">
          Estado
          <select
            name="estado"
            defaultValue={filtroEstado}
            className="mt-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]"
          >
            <option value="">Todos</option>
            <option value="ABIERTO">Abiertos</option>
            <option value="CERRADO">Cerrados</option>
          </select>
        </label>
        <button className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-dark)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]">
          Filtrar
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-[var(--color-paper-dark)] text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3 text-right">Facturado</th>
              <th className="px-4 py-3 text-right">Cobrado</th>
              <th className="px-4 py-3 text-right">Pendiente</th>
              <th className="px-4 py-3 text-right">Estudiantes</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ anio, resumen }) => (
              <tr key={anio.id} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">{anio.nombre}</td>
                <td className="px-4 py-3 text-xs text-[var(--color-ink-soft)]">
                  {anio.fechaInicio.toLocaleDateString("es-DO")}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-ink-soft)]">
                  {anio.fechaFin.toLocaleDateString("es-DO")}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  RD$ {resumen.totalCargos.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[var(--color-green)]">
                  RD$ {resumen.totalPagado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono font-bold ${
                    resumen.totalPendiente > 0 ? "text-red-600" : "text-[var(--color-green)]"
                  }`}
                >
                  RD$ {resumen.totalPendiente.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-mono">{resumen.totalEstudiantes}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      anio.estadoCierre === "CERRADO"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-[var(--color-paper-dark)] text-[var(--color-green)]"
                    }`}
                  >
                    {anio.estadoCierre}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/admin/anios-escolares/${anio.id}`} className="text-xs font-bold text-[var(--color-green)] hover:underline">
                    Ver
                  </Link>
                  {" · "}
                  <a href={`/api/periodos/${anio.id}/exportar`} className="text-xs font-bold text-[var(--color-green)] hover:underline">
                    Reporte
                  </a>
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Ningún período coincide con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
