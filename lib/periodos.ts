import { prisma } from "@/lib/prisma";
import { montoEfectivoCargo } from "@/lib/ajustes";

// ---------------------------------------------------------------------------
// Cálculo del resumen financiero de un período (AnioEscolar) — usado por el
// dashboard del período, la confirmación de cierre, el snapshot que se
// congela en CierrePeriodo, y el listado de Contabilidad → Cierres.
// Ingreso GENERADO (totalCargos) vs. Ingreso COBRADO (totalPagado) se
// distinguen siempre — nunca se mezclan en un solo número.
// ---------------------------------------------------------------------------

export type ResumenPeriodo = {
  totalCargos: number;
  totalPagado: number;
  totalPendiente: number;
  totalEstudiantes: number;
  estudiantesPagados: number;
  estudiantesParcial: number;
  estudiantesConDeuda: number; // parcial + pendiente
};

export type EstadoCuentaEstudiante = "PAGADO" | "PENDIENTE" | "PARCIAL";

export type FilaEstudiantePeriodo = {
  estudianteId: string;
  nombre: string;
  apellido: string;
  numeroExpediente: string;
  totalCargado: number;
  totalPagado: number;
  saldo: number;
  estado: EstadoCuentaEstudiante;
};

export async function obtenerDatosPeriodo(
  anioEscolarId: string
): Promise<{ resumen: ResumenPeriodo; filas: FilaEstudiantePeriodo[] }> {
  const cargos = await prisma.cargo.findMany({
    where: { anioEscolarId, estado: { not: "ANULADO" } },
    include: { pagos: true, ajustes: true, estudiante: true },
  });

  const porEstudiante = new Map<
    string,
    {
      estudiante: { nombre: string; apellido: string; numeroExpediente: string };
      totalCargado: number;
      totalPagado: number;
    }
  >();

  for (const c of cargos) {
    const efectivo = montoEfectivoCargo(c);
    const pagado = c.pagos.reduce((s, p) => s + Number(p.monto), 0);
    const entrada = porEstudiante.get(c.estudianteId) ?? {
      estudiante: c.estudiante,
      totalCargado: 0,
      totalPagado: 0,
    };
    entrada.totalCargado += efectivo;
    entrada.totalPagado += pagado;
    porEstudiante.set(c.estudianteId, entrada);
  }

  const filas: FilaEstudiantePeriodo[] = Array.from(porEstudiante.entries()).map(([estudianteId, v]) => {
    const saldo = Math.round((v.totalCargado - v.totalPagado) * 100) / 100;
    const estado: EstadoCuentaEstudiante = saldo <= 0 ? "PAGADO" : v.totalPagado > 0 ? "PARCIAL" : "PENDIENTE";
    return {
      estudianteId,
      nombre: v.estudiante.nombre,
      apellido: v.estudiante.apellido,
      numeroExpediente: v.estudiante.numeroExpediente,
      totalCargado: v.totalCargado,
      totalPagado: v.totalPagado,
      saldo,
      estado,
    };
  });

  const resumen: ResumenPeriodo = {
    totalCargos: round2(filas.reduce((s, f) => s + f.totalCargado, 0)),
    totalPagado: round2(filas.reduce((s, f) => s + f.totalPagado, 0)),
    totalPendiente: round2(filas.reduce((s, f) => s + Math.max(f.saldo, 0), 0)),
    totalEstudiantes: filas.length,
    estudiantesPagados: filas.filter((f) => f.estado === "PAGADO").length,
    estudiantesParcial: filas.filter((f) => f.estado === "PARCIAL").length,
    estudiantesConDeuda: filas.filter((f) => f.estado !== "PAGADO").length,
  };

  return { resumen, filas };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
