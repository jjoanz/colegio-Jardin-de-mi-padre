"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TipoPlanificacion } from "@prisma/client";

async function usuarioActual() {
  const session = await auth();
  const usuario = session?.user as { id?: string; role?: string } | undefined;
  if (!usuario?.id) throw new Error("Debes iniciar sesión para gestionar planificaciones.");
  return usuario;
}

function esRevisor(rol?: string) {
  return rol === "ADMIN" || rol === "COORDINADOR_DOCENTE";
}

// Campos de texto libre que se guardan tal cual vienen del formulario.
const CAMPOS_TEXTO = [
  "centroEducativo",
  "grado",
  "areaCurricular",
  "dominios",
  "duracion",
  "titulo",
  "situacionContexto",
  "propositoAprendizaje",
  "competenciasFundamentales",
  "competenciasEspecificas",
  "indicadoresLogro",
  "contenidoConceptual",
  "contenidoProcedimental",
  "contenidoActitudinal",
  "ejeTransversal",
  "secuenciaInicio",
  "tiempoInicio",
  "secuenciaDesarrollo",
  "tiempoDesarrollo",
  "secuenciaCierre",
  "tiempoCierre",
  "estrategiasEnsenanza",
  "recursosMateriales",
  "criteriosEvaluacion",
  "evidenciasAprendizaje",
  "instrumentosEvaluacion",
  "productoEvidenciaFinal",
  "metacognicion",
  "teorias",
  "autores",
] as const;

function extraerCamposTexto(formData: FormData) {
  const data: Record<string, string | null> = {};
  for (const campo of CAMPOS_TEXTO) {
    const valor = String(formData.get(campo) || "").trim();
    data[campo] = valor || null;
  }
  return data;
}

export async function crearPlanificacion(formData: FormData) {
  const usuario = await usuarioActual();
  const tipo = String(formData.get("tipo")) as TipoPlanificacion;
  const aulaId = formData.get("aulaId") ? String(formData.get("aulaId")) : null;
  const fecha = formData.get("fecha") ? new Date(String(formData.get("fecha"))) : null;

  const camposTexto = extraerCamposTexto(formData);
  if (!camposTexto.titulo) {
    throw new Error("El título de la unidad/proyecto es obligatorio.");
  }

  await prisma.planificacionDocente.create({
    data: {
      docenteId: usuario.id!,
      aulaId,
      tipo,
      estado: "BORRADOR",
      fecha,
      ...camposTexto,
      titulo: camposTexto.titulo,
    },
  });

  revalidatePath("/admin/planificaciones");
}

export async function actualizarPlanificacion(formData: FormData) {
  const usuario = await usuarioActual();
  const planificacionId = String(formData.get("planificacionId"));

  const existente = await prisma.planificacionDocente.findUniqueOrThrow({
    where: { id: planificacionId },
  });

  const esDueno = existente.docenteId === usuario.id;
  if (!esDueno && !esRevisor(usuario.role)) {
    throw new Error("Solo el docente que creó esta planificación (o un revisor) puede editarla.");
  }

  // Una vez enviada a revisión o aprobada, el docente ya no puede editar el
  // contenido — solo el coordinador/admin, o el docente si fue rechazada
  // (para corregirla y reenviarla).
  if (esDueno && !esRevisor(usuario.role) && (existente.estado === "ENVIADA" || existente.estado === "APROBADA")) {
    throw new Error("Esta planificación ya está en revisión o aprobada y no se puede editar. Si necesitas cambiarla, contacta al coordinador.");
  }

  const aulaId = formData.get("aulaId") ? String(formData.get("aulaId")) : null;
  const fecha = formData.get("fecha") ? new Date(String(formData.get("fecha"))) : null;
  const camposTexto = extraerCamposTexto(formData);

  if (!camposTexto.titulo) {
    throw new Error("El título de la unidad/proyecto es obligatorio.");
  }

  await prisma.planificacionDocente.update({
    where: { id: planificacionId },
    data: {
      aulaId,
      fecha,
      ...camposTexto,
      titulo: camposTexto.titulo,
    },
  });

  revalidatePath("/admin/planificaciones");
}

export async function eliminarPlanificacion(formData: FormData) {
  const usuario = await usuarioActual();
  const planificacionId = String(formData.get("planificacionId"));

  const existente = await prisma.planificacionDocente.findUniqueOrThrow({
    where: { id: planificacionId },
  });

  const esDueno = existente.docenteId === usuario.id;
  if (!esDueno && !esRevisor(usuario.role)) {
    throw new Error("Solo el docente que creó esta planificación (o un revisor) puede eliminarla.");
  }

  await prisma.planificacionDocente.delete({ where: { id: planificacionId } });
  revalidatePath("/admin/planificaciones");
}

// El docente envía su borrador (o una rechazada ya corregida) a revisión.
export async function enviarParaRevision(formData: FormData) {
  const usuario = await usuarioActual();
  const planificacionId = String(formData.get("planificacionId"));

  const existente = await prisma.planificacionDocente.findUniqueOrThrow({ where: { id: planificacionId } });
  if (existente.docenteId !== usuario.id) {
    throw new Error("Solo el docente dueño de esta planificación puede enviarla a revisión.");
  }

  await prisma.planificacionDocente.update({
    where: { id: planificacionId },
    data: { estado: "ENVIADA", comentarioCoordinador: null, revisadoPorId: null, revisadoEn: null },
  });
  revalidatePath("/admin/planificaciones");
}

// El coordinador/admin aprueba o rechaza (con comentario) una planificación enviada.
export async function revisarPlanificacion(formData: FormData) {
  const usuario = await usuarioActual();
  if (!esRevisor(usuario.role)) {
    throw new Error("Solo un Coordinador Docente o Administrador puede revisar planificaciones.");
  }

  const planificacionId = String(formData.get("planificacionId"));
  const decision = String(formData.get("decision")); // "APROBADA" | "RECHAZADA"
  const comentario = String(formData.get("comentario") || "").trim();

  if (decision === "RECHAZADA" && !comentario) {
    throw new Error("Escribe un comentario explicando qué debe corregir el docente.");
  }

  await prisma.planificacionDocente.update({
    where: { id: planificacionId },
    data: {
      estado: decision as "APROBADA" | "RECHAZADA",
      comentarioCoordinador: comentario || null,
      revisadoPorId: usuario.id,
      revisadoEn: new Date(),
    },
  });
  revalidatePath("/admin/planificaciones");
}

// Duplica una planificación existente como un nuevo borrador, para reutilizarla
// como plantilla (ej. la misma unidad para otro grupo o el año siguiente).
export async function duplicarPlanificacion(formData: FormData) {
  const usuario = await usuarioActual();
  const planificacionId = String(formData.get("planificacionId"));

  const original = await prisma.planificacionDocente.findUniqueOrThrow({ where: { id: planificacionId } });

  await prisma.planificacionDocente.create({
    data: {
      docenteId: usuario.id!,
      aulaId: original.aulaId,
      tipo: original.tipo,
      estado: "BORRADOR",
      centroEducativo: original.centroEducativo,
      grado: original.grado,
      areaCurricular: original.areaCurricular,
      dominios: original.dominios,
      duracion: original.duracion,
      fecha: original.fecha,
      titulo: `${original.titulo} (copia)`,
      situacionContexto: original.situacionContexto,
      propositoAprendizaje: original.propositoAprendizaje,
      competenciasFundamentales: original.competenciasFundamentales,
      competenciasEspecificas: original.competenciasEspecificas,
      indicadoresLogro: original.indicadoresLogro,
      contenidoConceptual: original.contenidoConceptual,
      contenidoProcedimental: original.contenidoProcedimental,
      contenidoActitudinal: original.contenidoActitudinal,
      ejeTransversal: original.ejeTransversal,
      secuenciaInicio: original.secuenciaInicio,
      tiempoInicio: original.tiempoInicio,
      secuenciaDesarrollo: original.secuenciaDesarrollo,
      tiempoDesarrollo: original.tiempoDesarrollo,
      secuenciaCierre: original.secuenciaCierre,
      tiempoCierre: original.tiempoCierre,
      estrategiasEnsenanza: original.estrategiasEnsenanza,
      recursosMateriales: original.recursosMateriales,
      criteriosEvaluacion: original.criteriosEvaluacion,
      evidenciasAprendizaje: original.evidenciasAprendizaje,
      instrumentosEvaluacion: original.instrumentosEvaluacion,
      productoEvidenciaFinal: original.productoEvidenciaFinal,
      metacognicion: original.metacognicion,
      teorias: original.teorias,
      autores: original.autores,
    },
  });

  revalidatePath("/admin/planificaciones");
}
