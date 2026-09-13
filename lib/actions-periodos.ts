"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requierePermiso } from "@/lib/permisos";
import { obtenerDatosPeriodo } from "@/lib/periodos";
import { registrarAuditoria } from "@/lib/auditoria";
import { montoEfectivoCargo } from "@/lib/ajustes";
import type { EstadoCargo, TipoAjuste } from "@prisma/client";

function rutasPeriodo(anioEscolarId: string) {
  revalidatePath("/admin/anios-escolares");
  revalidatePath(`/admin/anios-escolares/${anioEscolarId}`);
  revalidatePath("/admin/cierres-periodo");
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// CERRAR PERÍODO
// ---------------------------------------------------------------------------

export async function cerrarPeriodo(formData: FormData) {
  const usuario = await requierePermiso("cierres_periodo", "crear");
  const anioEscolarId = String(formData.get("anioEscolarId"));
  const observaciones = String(formData.get("observaciones") || "").trim() || null;

  const anioEscolar = await prisma.anioEscolar.findUniqueOrThrow({ where: { id: anioEscolarId } });
  if (anioEscolar.estadoCierre === "CERRADO") {
    throw new Error("Este período ya está cerrado.");
  }

  const { resumen } = await obtenerDatosPeriodo(anioEscolarId);

  await prisma.$transaction(async (tx) => {
    await tx.anioEscolar.update({ where: { id: anioEscolarId }, data: { estadoCierre: "CERRADO" } });

    await tx.cierrePeriodo.create({
      data: {
        anioEscolarId,
        tipo: "CIERRE",
        usuarioId: usuario.id!,
        totalCargos: resumen.totalCargos,
        totalPagado: resumen.totalPagado,
        totalPendiente: resumen.totalPendiente,
        totalEstudiantes: resumen.totalEstudiantes,
        estudiantesPagados: resumen.estudiantesPagados,
        estudiantesParcial: resumen.estudiantesParcial,
        estudiantesConDeuda: resumen.estudiantesConDeuda,
        motivo: observaciones,
      },
    });

    await registrarAuditoria(tx, {
      entidad: "AnioEscolar",
      entidadId: anioEscolarId,
      accion: "CIERRE",
      usuarioId: usuario.id,
      valorAnterior: { estadoCierre: "ABIERTO" },
      valorNuevo: { estadoCierre: "CERRADO", ...resumen },
      motivo: observaciones,
    });
  });

  rutasPeriodo(anioEscolarId);
}

// ---------------------------------------------------------------------------
// REABRIR PERÍODO — requiere permiso separado (no cualquiera que puede cerrar
// puede reabrir) y siempre exige un motivo, que queda en la bitácora junto
// con el cierre anterior (nunca se borra).
// ---------------------------------------------------------------------------

export async function reabrirPeriodo(formData: FormData) {
  const usuario = await requierePermiso("cierres_periodo", "eliminar");
  const anioEscolarId = String(formData.get("anioEscolarId"));
  const motivo = String(formData.get("motivo") || "").trim();

  if (!motivo) {
    throw new Error("Debes indicar el motivo de la reapertura.");
  }

  const anioEscolar = await prisma.anioEscolar.findUniqueOrThrow({ where: { id: anioEscolarId } });
  if (anioEscolar.estadoCierre !== "CERRADO") {
    throw new Error("Este período no está cerrado.");
  }

  const { resumen } = await obtenerDatosPeriodo(anioEscolarId);

  await prisma.$transaction(async (tx) => {
    await tx.anioEscolar.update({ where: { id: anioEscolarId }, data: { estadoCierre: "ABIERTO" } });

    await tx.cierrePeriodo.create({
      data: {
        anioEscolarId,
        tipo: "REAPERTURA",
        usuarioId: usuario.id!,
        totalCargos: resumen.totalCargos,
        totalPagado: resumen.totalPagado,
        totalPendiente: resumen.totalPendiente,
        totalEstudiantes: resumen.totalEstudiantes,
        estudiantesPagados: resumen.estudiantesPagados,
        estudiantesParcial: resumen.estudiantesParcial,
        estudiantesConDeuda: resumen.estudiantesConDeuda,
        motivo,
      },
    });

    await registrarAuditoria(tx, {
      entidad: "AnioEscolar",
      entidadId: anioEscolarId,
      accion: "REAPERTURA",
      usuarioId: usuario.id,
      valorAnterior: { estadoCierre: "CERRADO" },
      valorNuevo: { estadoCierre: "ABIERTO" },
      motivo,
    });
  });

  rutasPeriodo(anioEscolarId);
}

// ---------------------------------------------------------------------------
// AJUSTES CONTABLES — único mecanismo permitido para corregir un cargo,
// especialmente uno de un período ya cerrado. Nunca se toca Cargo.monto.
// ---------------------------------------------------------------------------

export async function crearAjusteCargo(formData: FormData) {
  const usuario = await requierePermiso("cierres_periodo", "editar");
  const cargoId = String(formData.get("cargoId"));
  const tipo = String(formData.get("tipo")) as TipoAjuste;
  const signo = String(formData.get("signo") || "");
  const motivo = String(formData.get("motivo") || "").trim();
  const referencia = String(formData.get("referencia") || "").trim() || null;
  const montoAbs = Math.abs(Number(formData.get("monto")));

  if (!motivo) {
    throw new Error("Debes indicar el motivo del ajuste.");
  }
  if (!montoAbs || montoAbs <= 0) {
    throw new Error("El monto del ajuste debe ser mayor a 0.");
  }

  let monto = montoAbs;
  if (tipo === "DESCUENTO") monto = -montoAbs;
  else if (tipo === "CORRECCION") monto = signo === "REDUCE" ? -montoAbs : montoAbs;

  const cargo = await prisma.cargo.findUniqueOrThrow({
    where: { id: cargoId },
    include: { pagos: true, ajustes: true },
  });
  if (cargo.estado === "ANULADO") {
    throw new Error("No se puede ajustar un cargo anulado.");
  }

  const totalPagado = cargo.pagos.reduce((s, p) => s + Number(p.monto), 0);
  const efectivoAntes = montoEfectivoCargo(cargo);
  const efectivoDespues = efectivoAntes + monto;
  const nuevoEstado: EstadoCargo =
    totalPagado >= efectivoDespues && efectivoDespues > 0
      ? "PAGADO"
      : totalPagado > 0
      ? "PARCIAL"
      : "PENDIENTE";

  await prisma.$transaction(async (tx) => {
    await tx.ajusteCargo.create({
      data: { cargoId, tipo, monto, motivo, referencia, usuarioId: usuario.id! },
    });

    await tx.cargo.update({ where: { id: cargoId }, data: { estado: nuevoEstado } });

    await registrarAuditoria(tx, {
      entidad: "Cargo",
      entidadId: cargoId,
      accion: "AJUSTE",
      usuarioId: usuario.id,
      valorAnterior: { montoEfectivo: efectivoAntes, estado: cargo.estado },
      valorNuevo: { montoEfectivo: efectivoDespues, estado: nuevoEstado, tipo, monto },
      motivo,
    });
  });

  revalidatePath("/admin/cargos");
  revalidatePath(`/admin/estudiantes/${cargo.estudianteId}/estado-cuenta`);
  revalidatePath("/admin/estudiantes");
  revalidatePath("/admin");
  if (cargo.anioEscolarId) {
    revalidatePath(`/admin/anios-escolares/${cargo.anioEscolarId}`);
    revalidatePath("/admin/cierres-periodo");
  }
}
