"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DiaSemana } from "@prisma/client";

const RUTA = "/admin/horarios";

export async function crearMateria(formData: FormData) {
  const nivelIds = formData.getAll("nivelIds").map(String);
  const gradoIds = formData.getAll("gradoIds").map(String);
  await prisma.materia.create({
    data: {
      nombre: String(formData.get("nombre")),
      descripcion: String(formData.get("descripcion") || "") || null,
      niveles: { connect: nivelIds.map((id) => ({ id })) },
      grados: { connect: gradoIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/admin/aulas");
  revalidatePath(RUTA);
}

export async function actualizarMateria(formData: FormData) {
  const materiaId = String(formData.get("materiaId"));
  const nivelIds = formData.getAll("nivelIds").map(String);
  const gradoIds = formData.getAll("gradoIds").map(String);
  await prisma.materia.update({
    where: { id: materiaId },
    data: {
      nombre: String(formData.get("nombre")),
      descripcion: String(formData.get("descripcion") || "") || null,
      activa: formData.get("activa") === "on",
      niveles: { set: nivelIds.map((id) => ({ id })) },
      grados: { set: gradoIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/admin/aulas");
  revalidatePath(RUTA);
}

function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

const NOMBRES_DIA: Record<string, string> = {
  LUNES: "lunes",
  MARTES: "martes",
  MIERCOLES: "miércoles",
  JUEVES: "jueves",
  VIERNES: "viernes",
  SABADO: "sábado",
};

export async function crearBloqueHorario(formData: FormData) {
  const aulaId = String(formData.get("aulaId"));
  const materiaId = String(formData.get("materiaId"));
  const docenteId = String(formData.get("docenteId") || "") || null;
  const anioEscolarId = String(formData.get("anioEscolarId"));
  const diaSemana = String(formData.get("diaSemana")) as DiaSemana;
  const horaInicioMin = horaAMinutos(String(formData.get("horaInicio")));
  const horaFinMin = horaAMinutos(String(formData.get("horaFin")));

  if (horaFinMin <= horaInicioMin) {
    throw new Error("La hora de fin debe ser posterior a la hora de inicio.");
  }

  const choqueAula = await prisma.bloqueHorario.findFirst({
    where: {
      aulaId,
      diaSemana,
      anioEscolarId,
      horaInicioMin: { lt: horaFinMin },
      horaFinMin: { gt: horaInicioMin },
    },
    include: { materia: true },
  });
  if (choqueAula) {
    throw new Error(
      `Choque de aula: ya hay clase de "${choqueAula.materia.nombre}" el ${NOMBRES_DIA[diaSemana]} de ${minutosAHora(
        choqueAula.horaInicioMin
      )} a ${minutosAHora(choqueAula.horaFinMin)} en esa aula.`
    );
  }

  if (docenteId) {
    const choqueDocente = await prisma.bloqueHorario.findFirst({
      where: {
        docenteId,
        diaSemana,
        anioEscolarId,
        horaInicioMin: { lt: horaFinMin },
        horaFinMin: { gt: horaInicioMin },
      },
      include: { materia: true, aula: true },
    });
    if (choqueDocente) {
      throw new Error(
        `Choque de profesor: ya tiene clase de "${choqueDocente.materia.nombre}" en el aula "${
          choqueDocente.aula.nombre
        }" el ${NOMBRES_DIA[diaSemana]} de ${minutosAHora(choqueDocente.horaInicioMin)} a ${minutosAHora(
          choqueDocente.horaFinMin
        )}.`
      );
    }
  }

  await prisma.bloqueHorario.create({
    data: {
      aulaId,
      materiaId,
      docenteId,
      anioEscolarId,
      diaSemana,
      horaInicioMin,
      horaFinMin,
    },
  });

  revalidatePath(RUTA);
}

export async function actualizarBloqueHorario(formData: FormData) {
  const bloqueId = String(formData.get("bloqueId"));
  const materiaId = String(formData.get("materiaId"));
  const docenteId = String(formData.get("docenteId") || "") || null;
  const diaSemana = String(formData.get("diaSemana")) as DiaSemana;
  const horaInicioMin = horaAMinutos(String(formData.get("horaInicio")));
  const horaFinMin = horaAMinutos(String(formData.get("horaFin")));

  if (horaFinMin <= horaInicioMin) {
    throw new Error("La hora de fin debe ser posterior a la hora de inicio.");
  }

  const bloqueActual = await prisma.bloqueHorario.findUniqueOrThrow({ where: { id: bloqueId } });

  const choqueAula = await prisma.bloqueHorario.findFirst({
    where: {
      id: { not: bloqueId },
      aulaId: bloqueActual.aulaId,
      diaSemana,
      anioEscolarId: bloqueActual.anioEscolarId,
      horaInicioMin: { lt: horaFinMin },
      horaFinMin: { gt: horaInicioMin },
    },
    include: { materia: true },
  });
  if (choqueAula) {
    throw new Error(
      `Choque de aula: ya hay clase de "${choqueAula.materia.nombre}" el ${NOMBRES_DIA[diaSemana]} de ${minutosAHora(
        choqueAula.horaInicioMin
      )} a ${minutosAHora(choqueAula.horaFinMin)} en esa aula.`
    );
  }

  if (docenteId) {
    const choqueDocente = await prisma.bloqueHorario.findFirst({
      where: {
        id: { not: bloqueId },
        docenteId,
        diaSemana,
        anioEscolarId: bloqueActual.anioEscolarId,
        horaInicioMin: { lt: horaFinMin },
        horaFinMin: { gt: horaInicioMin },
      },
      include: { materia: true, aula: true },
    });
    if (choqueDocente) {
      throw new Error(
        `Choque de profesor: ya tiene clase de "${choqueDocente.materia.nombre}" en el aula "${
          choqueDocente.aula.nombre
        }" el ${NOMBRES_DIA[diaSemana]} de ${minutosAHora(choqueDocente.horaInicioMin)} a ${minutosAHora(
          choqueDocente.horaFinMin
        )}.`
      );
    }
  }

  await prisma.bloqueHorario.update({
    where: { id: bloqueId },
    data: { materiaId, docenteId, diaSemana, horaInicioMin, horaFinMin },
  });

  revalidatePath(RUTA);
}

export async function eliminarBloqueHorario(formData: FormData) {
  const bloqueId = String(formData.get("bloqueId"));
  await prisma.bloqueHorario.delete({ where: { id: bloqueId } });
  revalidatePath(RUTA);
}
