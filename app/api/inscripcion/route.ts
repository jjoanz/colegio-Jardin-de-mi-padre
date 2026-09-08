import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { notificarConfirmacionInscripcion, notificarNuevaSolicitudAAdmin } from "@/lib/notificaciones";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const CARPETA_UPLOADS = path.join(process.cwd(), "public", "uploads", "inscripcion");

// Los campos tipo ARCHIVO llegan en el FormData con el prefijo "archivo_"
// (ej. "archivo_comprobantePago"), separados de las demás respuestas para
// no forzar todo el body a multipart innecesariamente en el resto de los casos.
async function guardarArchivoAdjunto(archivo: File): Promise<string> {
  await mkdir(CARPETA_UPLOADS, { recursive: true });
  const extension = path.extname(archivo.name) || "";
  const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
  const bytes = Buffer.from(await archivo.arrayBuffer());
  await writeFile(path.join(CARPETA_UPLOADS, nombreArchivo), bytes);
  return `/uploads/inscripcion/${nombreArchivo}`;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const formularioVersionId = formData.get("formularioVersionId");
  const respuestasRaw = formData.get("respuestas");

  if (typeof formularioVersionId !== "string" || typeof respuestasRaw !== "string") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  let respuestas: Record<string, unknown>;
  try {
    respuestas = JSON.parse(respuestasRaw);
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Archivos adjuntos: se guardan y su URL reemplaza/completa la respuesta
  // de esa pregunta, como si el valor hubiera llegado en el JSON.
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("archivo_") && value instanceof File && value.size > 0) {
      const clave = key.slice("archivo_".length);
      respuestas[clave] = await guardarArchivoAdjunto(value);
    }
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
      gradoInteresId: (porRol.GRADO_INTERES as string) || null,
      nombreTutor: (porRol.NOMBRE_CONTACTO as string) || null,
      telefonoTutor: (porRol.TELEFONO_CONTACTO as string) || null,
      emailTutor: (porRol.EMAIL_CONTACTO as string) || null,
      cedulaTutor: (porRol.CEDULA_CONTACTO as string) || null,
      responsablePagoNombre: (porRol.RESPONSABLE_PAGO_NOMBRE as string) || null,
      responsablePagoApellido: (porRol.RESPONSABLE_PAGO_APELLIDO as string) || null,
      responsablePagoCedula: (porRol.RESPONSABLE_PAGO_CEDULA as string) || null,
      responsablePagoTelefono: (porRol.RESPONSABLE_PAGO_TELEFONO as string) || null,
      responsablePagoParentesco: (porRol.RESPONSABLE_PAGO_PARENTESCO as string) || null,
      metodoPagoPreferido: (porRol.METODO_PAGO as string) || null,
      comprobantePagoUrl: (porRol.COMPROBANTE_PAGO as string) || null,
      tieneBecaExterna: porRol.TIENE_BECA_EXTERNA === true,
      institucionBecaExterna: (porRol.INSTITUCION_BECA_EXTERNA as string) || null,
      cartaCompromisoBecaUrl: (porRol.CARTA_COMPROMISO_BECA as string) || null,
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
