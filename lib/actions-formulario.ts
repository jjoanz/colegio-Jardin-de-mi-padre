"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TipoPregunta, RolSistemaPregunta } from "@prisma/client";

const RUTA = "/admin/formulario-inscripcion";

// ---------------------------------------------------------------------------
// Obtener (o crear) el borrador actual. El público siempre ve la versión
// PUBLICADA; todo lo que se edita aquí vive en la versión BORRADOR hasta
// que se le da a "Publicar cambios".
// ---------------------------------------------------------------------------

async function obtenerOCrearBorrador() {
  let borrador = await prisma.formularioVersion.findFirst({ where: { estado: "BORRADOR" } });
  if (borrador) return borrador;

  const publicado = await prisma.formularioVersion.findFirst({
    where: { estado: "PUBLICADO" },
    include: {
      secciones: {
        include: { preguntas: { include: { opciones: true } } },
        orderBy: { orden: "asc" },
      },
    },
  });

  const ultimoNumero = await prisma.formularioVersion.findFirst({ orderBy: { numero: "desc" } });
  const nuevoNumero = (ultimoNumero?.numero ?? 0) + 1;

  borrador = await prisma.formularioVersion.create({
    data: { numero: nuevoNumero, estado: "BORRADOR" },
  });

  // Clonar secciones/preguntas/opciones de la versión publicada, si existe.
  if (publicado) {
    const mapaPreguntas: Record<string, string> = {}; // id vieja -> id nueva
    const mapaSecciones: Record<string, string> = {};

    for (const seccion of publicado.secciones) {
      const nuevaSeccion = await prisma.formSeccion.create({
        data: {
          formularioId: borrador.id,
          titulo: seccion.titulo,
          descripcion: seccion.descripcion,
          orden: seccion.orden,
        },
      });
      mapaSecciones[seccion.id] = nuevaSeccion.id;

      for (const pregunta of seccion.preguntas) {
        const nuevaPregunta = await prisma.formPregunta.create({
          data: {
            seccionId: nuevaSeccion.id,
            clave: pregunta.clave,
            etiqueta: pregunta.etiqueta,
            tipo: pregunta.tipo,
            requerida: pregunta.requerida,
            orden: pregunta.orden,
            placeholder: pregunta.placeholder,
            rolSistema: pregunta.rolSistema,
          },
        });
        mapaPreguntas[pregunta.id] = nuevaPregunta.id;

        for (const opcion of pregunta.opciones) {
          await prisma.formOpcion.create({
            data: {
              preguntaId: nuevaPregunta.id,
              valor: opcion.valor,
              etiqueta: opcion.etiqueta,
              orden: opcion.orden,
            },
          });
        }
      }
    }

    // Clonar condiciones, remapeando los ids viejos a los nuevos
    const condicionesViejas = await prisma.formCondicion.findMany({
      where: {
        OR: [
          { preguntaOrigen: { seccion: { formularioId: publicado.id } } },
        ],
      },
    });
    for (const c of condicionesViejas) {
      const origenNueva = mapaPreguntas[c.preguntaOrigenId];
      if (!origenNueva) continue;
      await prisma.formCondicion.create({
        data: {
          preguntaOrigenId: origenNueva,
          valorEsperado: c.valorEsperado,
          preguntaObjetivoId: c.preguntaObjetivoId ? mapaPreguntas[c.preguntaObjetivoId] ?? null : null,
          seccionObjetivoId: c.seccionObjetivoId ? mapaSecciones[c.seccionObjetivoId] ?? null : null,
        },
      });
    }
  }

  return borrador;
}

export async function asegurarBorrador() {
  await obtenerOCrearBorrador();
  revalidatePath(RUTA);
}

// ---------------------------------------------------------------------------
// SECCIONES
// ---------------------------------------------------------------------------

export async function crearSeccion(formData: FormData) {
  const borrador = await obtenerOCrearBorrador();
  const ultima = await prisma.formSeccion.findFirst({
    where: { formularioId: borrador.id },
    orderBy: { orden: "desc" },
  });
  await prisma.formSeccion.create({
    data: {
      formularioId: borrador.id,
      titulo: String(formData.get("titulo") || "Nueva sección"),
      descripcion: String(formData.get("descripcion") || "") || null,
      orden: (ultima?.orden ?? -1) + 1,
    },
  });
  revalidatePath(RUTA);
}

export async function actualizarSeccion(formData: FormData) {
  const seccionId = String(formData.get("seccionId"));
  await prisma.formSeccion.update({
    where: { id: seccionId },
    data: {
      titulo: String(formData.get("titulo")),
      descripcion: String(formData.get("descripcion") || "") || null,
    },
  });
  revalidatePath(RUTA);
}

export async function eliminarSeccion(formData: FormData) {
  const seccionId = String(formData.get("seccionId"));
  await prisma.formSeccion.delete({ where: { id: seccionId } });
  revalidatePath(RUTA);
}

export async function moverSeccion(formData: FormData) {
  const seccionId = String(formData.get("seccionId"));
  const direccion = String(formData.get("direccion")); // "arriba" | "abajo"

  const seccion = await prisma.formSeccion.findUniqueOrThrow({ where: { id: seccionId } });
  const vecina = await prisma.formSeccion.findFirst({
    where: {
      formularioId: seccion.formularioId,
      orden: direccion === "arriba" ? { lt: seccion.orden } : { gt: seccion.orden },
    },
    orderBy: { orden: direccion === "arriba" ? "desc" : "asc" },
  });
  if (!vecina) return;

  await prisma.$transaction([
    prisma.formSeccion.update({ where: { id: seccion.id }, data: { orden: vecina.orden } }),
    prisma.formSeccion.update({ where: { id: vecina.id }, data: { orden: seccion.orden } }),
  ]);
  revalidatePath(RUTA);
}

// ---------------------------------------------------------------------------
// PREGUNTAS
// ---------------------------------------------------------------------------

// Las opciones se escriben como una por línea, formato "valor|Etiqueta visible".
// Si no hay "|", se usa el mismo texto como valor y como etiqueta.
function parsearOpciones(texto: string): { valor: string; etiqueta: string }[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((linea) => {
      const [valor, etiqueta] = linea.split("|").map((s) => s.trim());
      return { valor: valor, etiqueta: etiqueta || valor };
    });
}

export async function crearPregunta(formData: FormData) {
  const seccionId = String(formData.get("seccionId"));
  const clave = String(formData.get("clave")).trim();
  const tipo = String(formData.get("tipo")) as TipoPregunta;
  const opcionesTexto = String(formData.get("opcionesTexto") || "");
  const rolSistemaRaw = String(formData.get("rolSistema") || "");

  if (!clave) throw new Error("La pregunta necesita una clave única (sin espacios, ej. 'colorFavorito').");

  const existente = await prisma.formPregunta.findFirst({ where: { seccionId, clave } });
  if (existente) throw new Error(`Ya existe una pregunta con la clave "${clave}" en esta sección.`);

  const ultima = await prisma.formPregunta.findFirst({ where: { seccionId }, orderBy: { orden: "desc" } });

  const pregunta = await prisma.formPregunta.create({
    data: {
      seccionId,
      clave,
      etiqueta: String(formData.get("etiqueta")),
      tipo,
      requerida: formData.get("requerida") === "on",
      placeholder: String(formData.get("placeholder") || "") || null,
      rolSistema: rolSistemaRaw ? (rolSistemaRaw as RolSistemaPregunta) : null,
      orden: (ultima?.orden ?? -1) + 1,
    },
  });

  if ((tipo === "OPCION_UNICA" || tipo === "OPCION_MULTIPLE") && opcionesTexto) {
    const opciones = parsearOpciones(opcionesTexto);
    let orden = 0;
    for (const o of opciones) {
      await prisma.formOpcion.create({
        data: { preguntaId: pregunta.id, valor: o.valor, etiqueta: o.etiqueta, orden: orden++ },
      });
    }
  }

  revalidatePath(RUTA);
}

export async function actualizarPregunta(formData: FormData) {
  const preguntaId = String(formData.get("preguntaId"));
  const tipo = String(formData.get("tipo")) as TipoPregunta;
  const opcionesTexto = String(formData.get("opcionesTexto") || "");
  const rolSistemaRaw = String(formData.get("rolSistema") || "");

  await prisma.formPregunta.update({
    where: { id: preguntaId },
    data: {
      etiqueta: String(formData.get("etiqueta")),
      tipo,
      requerida: formData.get("requerida") === "on",
      placeholder: String(formData.get("placeholder") || "") || null,
      rolSistema: rolSistemaRaw ? (rolSistemaRaw as RolSistemaPregunta) : null,
    },
  });

  if (tipo === "OPCION_UNICA" || tipo === "OPCION_MULTIPLE") {
    await prisma.formOpcion.deleteMany({ where: { preguntaId } });
    const opciones = parsearOpciones(opcionesTexto);
    let orden = 0;
    for (const o of opciones) {
      await prisma.formOpcion.create({
        data: { preguntaId, valor: o.valor, etiqueta: o.etiqueta, orden: orden++ },
      });
    }
  }

  revalidatePath(RUTA);
}

export async function eliminarPregunta(formData: FormData) {
  const preguntaId = String(formData.get("preguntaId"));
  await prisma.formPregunta.delete({ where: { id: preguntaId } });
  revalidatePath(RUTA);
}

export async function moverPregunta(formData: FormData) {
  const preguntaId = String(formData.get("preguntaId"));
  const direccion = String(formData.get("direccion"));

  const pregunta = await prisma.formPregunta.findUniqueOrThrow({ where: { id: preguntaId } });
  const vecina = await prisma.formPregunta.findFirst({
    where: {
      seccionId: pregunta.seccionId,
      orden: direccion === "arriba" ? { lt: pregunta.orden } : { gt: pregunta.orden },
    },
    orderBy: { orden: direccion === "arriba" ? "desc" : "asc" },
  });
  if (!vecina) return;

  await prisma.$transaction([
    prisma.formPregunta.update({ where: { id: pregunta.id }, data: { orden: vecina.orden } }),
    prisma.formPregunta.update({ where: { id: vecina.id }, data: { orden: pregunta.orden } }),
  ]);
  revalidatePath(RUTA);
}

// ---------------------------------------------------------------------------
// CONDICIONES (ramificación)
// ---------------------------------------------------------------------------

export async function crearCondicion(formData: FormData) {
  const preguntaOrigenId = String(formData.get("preguntaOrigenId"));
  const valorEsperado = String(formData.get("valorEsperado"));
  const tipoObjetivo = String(formData.get("tipoObjetivo")); // "pregunta" | "seccion"
  const objetivoId = String(formData.get("objetivoId"));

  await prisma.formCondicion.create({
    data: {
      preguntaOrigenId,
      valorEsperado,
      preguntaObjetivoId: tipoObjetivo === "pregunta" ? objetivoId : null,
      seccionObjetivoId: tipoObjetivo === "seccion" ? objetivoId : null,
    },
  });
  revalidatePath(RUTA);
}

export async function eliminarCondicion(formData: FormData) {
  const condicionId = String(formData.get("condicionId"));
  await prisma.formCondicion.delete({ where: { id: condicionId } });
  revalidatePath(RUTA);
}

// ---------------------------------------------------------------------------
// PUBLICAR
// ---------------------------------------------------------------------------

export async function publicarFormulario() {
  const borrador = await prisma.formularioVersion.findFirst({ where: { estado: "BORRADOR" } });
  if (!borrador) throw new Error("No hay ningún borrador para publicar.");

  await prisma.$transaction([
    prisma.formularioVersion.updateMany({
      where: { estado: "PUBLICADO" },
      data: { estado: "ARCHIVADO" },
    }),
    prisma.formularioVersion.update({
      where: { id: borrador.id },
      data: { estado: "PUBLICADO", publicadoEn: new Date() },
    }),
  ]);

  revalidatePath(RUTA);
  revalidatePath("/inscripcion");
}
