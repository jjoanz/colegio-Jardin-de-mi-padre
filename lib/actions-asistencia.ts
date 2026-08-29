"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { EstadoAsistencia } from "@prisma/client";

async function usuarioActual() {
  const session = await auth();
  const usuario = session?.user as { id?: string; role?: string } | undefined;
  if (!usuario?.id) throw new Error("Debes iniciar sesión para tomar asistencia.");
  return usuario;
}

export async function guardarAsistencia(formData: FormData) {
  const usuario = await usuarioActual();
  const aulaId = String(formData.get("aulaId"));
  const fechaTexto = String(formData.get("fecha"));

  const esRevisor = usuario.role === "ADMIN" || usuario.role === "COORDINADOR_DOCENTE";
  if (!esRevisor) {
    const bloqueDelDocente = await prisma.bloqueHorario.findFirst({
      where: { aulaId, docenteId: usuario.id },
    });
    if (!bloqueDelDocente) {
      throw new Error("No tienes permiso para tomar asistencia de esta aula.");
    }
  }

  const matriculas = await prisma.matricula.findMany({
    where: { aulaId, estado: "ACTIVA" },
  });

  const fecha = new Date(`${fechaTexto}T00:00:00`);

  for (const m of matriculas) {
    const estadoRaw = formData.get(`estado-${m.estudianteId}`);
    if (!estadoRaw) continue;
    const notas = String(formData.get(`notas-${m.estudianteId}`) || "").trim();

    await prisma.asistencia.upsert({
      where: { estudianteId_fecha: { estudianteId: m.estudianteId, fecha } },
      update: {
        estado: estadoRaw as EstadoAsistencia,
        aulaId,
        tomadaPorId: usuario.id,
        notas: notas || null,
      },
      create: {
        estudianteId: m.estudianteId,
        aulaId,
        fecha,
        estado: estadoRaw as EstadoAsistencia,
        tomadaPorId: usuario.id,
        notas: notas || null,
      },
    });
  }

  revalidatePath("/admin/asistencia");
  redirect(`/admin/asistencia?aulaId=${aulaId}&fecha=${fechaTexto}&guardado=1`);
}
