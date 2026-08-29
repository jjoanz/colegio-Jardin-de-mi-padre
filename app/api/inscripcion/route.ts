import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { notificarConfirmacionInscripcion, notificarNuevaSolicitudAAdmin } from "@/lib/notificaciones";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { formularioVersionId, respuestas } = body as {
    formularioVersionId?: string;
    respuestas?: Record<string, unknown>;
  };

  if (!formularioVersionId || !respuestas) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const formulario = await prisma.formularioVersion.findUnique({
    where: { id: formularioVersionId },
    include: { secciones: { include: { preguntas: true } } },
  });

  if (!formulario || formulario.estado !== "PUBLICADO") {
    return NextResponse.json(
      { error: "Este formulario ya no está disponible. Recarga la página e intenta de nuevo." },
      { status: 400 }
    );
  }

  // Validación de obligatorios en el servidor (además de la del cliente),
  // por seguridad ante envíos manipulados.
  const faltantes: string[] = [];
  for (const seccion of formulario.secciones) {
    for (const pregunta of seccion.preguntas) {
      if (!pregunta.requerida) continue;
      const valor = respuestas[pregunta.clave];
      const vacio =
        valor === undefined ||
        valor === null ||
        valor === "" ||
        (pregunta.tipo === "CASILLA" && valor !== true) ||
        (Array.isArray(valor) && valor.length === 0);
      if (vacio) faltantes.push(pregunta.etiqueta);
    }
  }

  if (faltantes.length > 0) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios", detalles: faltantes },
      { status: 400 }
    );
  }

  // Si alguna pregunta tiene un "rol en el sistema" asignado, copiamos su
  // respuesta también a las columnas núcleo (para listados/búsqueda rápida
  // y para que la aprobación automática siga funcionando cuando aplique).
  const porRol: Record<string, unknown> = {};
  for (const seccion of formulario.secciones) {
    for (const pregunta of seccion.preguntas) {
      if (pregunta.rolSistema) {
        porRol[pregunta.rolSistema] = respuestas[pregunta.clave] ?? null;
      }
    }
  }

  const fechaNacimientoValor = porRol.FECHA_NACIMIENTO_ESTUDIANTE;

  const solicitud = await prisma.solicitudInscripcion.create({
    data: {
      formularioVersionId,
      respuestas: respuestas as Prisma.InputJsonValue,
      nombreEstudiante: (porRol.NOMBRE_ESTUDIANTE as string) || null,
      apellidoEstudiante: (porRol.APELLIDO_ESTUDIANTE as string) || null,
      fechaNacimiento:
        typeof fechaNacimientoValor === "string" && fechaNacimientoValor
          ? new Date(fechaNacimientoValor)
          : null,
      nivelInteresId: (porRol.NIVEL_INTERES as string) || null,
      nombreTutor: (porRol.NOMBRE_CONTACTO as string) || null,
      telefonoTutor: (porRol.TELEFONO_CONTACTO as string) || null,
      emailTutor: (porRol.EMAIL_CONTACTO as string) || null,
      cedulaTutor: (porRol.CEDULA_CONTACTO as string) || null,
    },
  });

  const nombreEstudianteCompleto =
    [porRol.NOMBRE_ESTUDIANTE, porRol.APELLIDO_ESTUDIANTE].filter(Boolean).join(" ") || "el estudiante";
  if (typeof porRol.EMAIL_CONTACTO === "string" && porRol.EMAIL_CONTACTO) {
    await notificarConfirmacionInscripcion(porRol.EMAIL_CONTACTO, nombreEstudianteCompleto);
  }
  await notificarNuevaSolicitudAAdmin(
    nombreEstudianteCompleto,
    typeof porRol.NOMBRE_CONTACTO === "string" ? porRol.NOMBRE_CONTACTO : "",
    typeof porRol.TELEFONO_CONTACTO === "string" ? porRol.TELEFONO_CONTACTO : ""
  );

  return NextResponse.json({ ok: true, id: solicitud.id }, { status: 201 });
}
