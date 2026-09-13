import { prisma } from "@/lib/prisma";
import type { PlanPago } from "@prisma/client";
import { notificarCargoGenerado } from "@/lib/notificaciones";

// Genera automáticamente los cargos de MENSUALIDAD (cuotas de colegiatura)
// que ya vencieron según el plan de pago de cada matrícula activa, sin crear
// nunca las cuotas futuras por adelantado — así el balance del colegio refleja
// lo realmente facturado a la fecha, no el año completo de una vez.
// Idempotente: se puede llamar tantas veces como se quiera sin duplicar cargos.

function totalCuotasDePlan(planPago: PlanPago): number {
  switch (planPago) {
    case "PAGO_UNICO":
      return 1;
    case "DOS_PAGOS":
      return 2;
    case "DIEZ_CUOTAS":
      return 10;
    default:
      return 1;
  }
}

function ajustarDia(fecha: Date, dia: number): Date {
  const f = new Date(fecha);
  f.setDate(Math.min(dia, 28));
  f.setHours(0, 0, 0, 0);
  return f;
}

function fechaVencimientoCuota(
  fechaInicioAnio: Date,
  fechaFinAnio: Date,
  diaPago: number,
  numeroCuota: number,
  totalCuotas: number
): Date {
  if (totalCuotas === 1) {
    return ajustarDia(fechaInicioAnio, diaPago);
  }
  if (totalCuotas === 2) {
    if (numeroCuota === 1) return ajustarDia(fechaInicioAnio, diaPago);
    const medio = new Date((fechaInicioAnio.getTime() + fechaFinAnio.getTime()) / 2);
    return ajustarDia(medio, diaPago);
  }
  // Plan mensual: una cuota por mes desde el inicio del año escolar.
  const fecha = new Date(fechaInicioAnio);
  fecha.setMonth(fecha.getMonth() + (numeroCuota - 1));
  return ajustarDia(fecha, diaPago);
}

async function generarCargosPendientesInterno(): Promise<number> {
  const hoy = new Date();
  let generados = 0;

  const matriculas = await prisma.matricula.findMany({
    where: { estado: "ACTIVA", planPago: { not: null } },
    include: {
      anioEscolar: true,
      aula: { include: { nivel: true, grado: true } },
    },
  });
  if (matriculas.length === 0) return 0;

  const becasActivas = await prisma.beca.findMany({ where: { activa: true } });
  const becaPorEstudiante = new Map(becasActivas.map((b) => [b.estudianteId, b]));

  const cargosExistentes = await prisma.cargo.findMany({
    where: { concepto: "MENSUALIDAD", anioEscolarId: { not: null }, numeroCuota: { not: null } },
    select: { estudianteId: true, anioEscolarId: true, numeroCuota: true },
  });
  const clavesExistentes = new Set(
    cargosExistentes.map((c) => `${c.estudianteId}:${c.anioEscolarId}:${c.numeroCuota}`)
  );

  for (const m of matriculas) {
    // Un período cerrado no debe seguir generando cargos nuevos en silencio —
    // eso es exactamente lo que el cierre contable está protegiendo.
    if (m.anioEscolar.estadoCierre === "CERRADO") continue;

    // Si el aula tiene un grado asignado, su precio manda sobre el del nivel.
    const precios = m.aula.grado ?? m.aula.nivel;
    const colegiaturaAnual = Number(precios.colegiaturaAnual);
    if (colegiaturaAnual <= 0 || !m.planPago) continue;

    const totalCuotas = totalCuotasDePlan(m.planPago);
    const beca = becaPorEstudiante.get(m.estudianteId);
    const porcentajeBeca = beca ? Number(beca.porcentaje) : 0;
    const montoConDescuento = Math.round(colegiaturaAnual * (1 - porcentajeBeca / 100) * 100) / 100;
    const montoBase = Math.floor((montoConDescuento / totalCuotas) * 100) / 100;

    for (let numeroCuota = 1; numeroCuota <= totalCuotas; numeroCuota++) {
      const clave = `${m.estudianteId}:${m.anioEscolarId}:${numeroCuota}`;
      if (clavesExistentes.has(clave)) continue;

      const vencimiento = fechaVencimientoCuota(
        m.anioEscolar.fechaInicio,
        m.anioEscolar.fechaFin,
        precios.diaPago,
        numeroCuota,
        totalCuotas
      );
      if (vencimiento > hoy) continue;

      const esUltimaCuota = numeroCuota === totalCuotas;
      const monto = esUltimaCuota
        ? Number((montoConDescuento - montoBase * (totalCuotas - 1)).toFixed(2))
        : montoBase;

      const descripcion = `Colegiatura ${m.anioEscolar.nombre} - Cuota ${numeroCuota}/${totalCuotas}`;
      await prisma.cargo.create({
        data: {
          estudianteId: m.estudianteId,
          concepto: "MENSUALIDAD",
          descripcion,
          monto,
          anioEscolarId: m.anioEscolarId,
          becaId: beca?.id ?? null,
          numeroCuota,
          totalCuotas,
          fechaVencimiento: vencimiento,
        },
      });
      generados++;

      // No se espera aquí: la generación de cargos corre en cada carga del
      // panel (limitada a una vez cada 5 min) y no debe demorarse por el envío
      // de correos. Un correo que falle solo se registra en el log del server.
      void notificarCargoGenerado({
        estudianteId: m.estudianteId,
        descripcion,
        monto,
        fechaVencimiento: vencimiento,
      });
    }
  }

  return generados;
}

// Estado en memoria del proceso (se reinicia si el servidor se reinicia —
// es solo para mostrar información en el panel, no una bitácora permanente).
let ultimaEjecucion: number | null = null;
let ultimoConteo = 0;
const INTERVALO_MS = 5 * 60 * 1000;

// Llamada automática (desde el layout del panel): se limita a correr como
// máximo una vez cada pocos minutos, para no recalcular en cada request.
export async function generarCargosPendientes() {
  const ahora = Date.now();
  if (ultimaEjecucion !== null && ahora - ultimaEjecucion < INTERVALO_MS) return;
  ultimaEjecucion = ahora;
  ultimoConteo = await generarCargosPendientesInterno();
}

// Llamada manual (botón "Generar ahora"): ignora el límite de tiempo y
// devuelve cuántos cargos nuevos se crearon, para mostrarlo al usuario.
export async function generarCargosPendientesAhora(): Promise<number> {
  const conteo = await generarCargosPendientesInterno();
  ultimaEjecucion = Date.now();
  ultimoConteo = conteo;
  return conteo;
}

export function obtenerEstadoGeneracion() {
  return { ultimaEjecucion, ultimoConteo };
}
