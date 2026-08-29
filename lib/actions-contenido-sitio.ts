"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { SeccionImagen } from "@prisma/client";

const RUTA = "/admin/contenido-sitio";
const CARPETA_UPLOADS = path.join(process.cwd(), "public", "uploads", "sitio");

export async function actualizarQuienesSomos(formData: FormData) {
  const mision = String(formData.get("mision") || "");
  const vision = String(formData.get("vision") || "");
  const valoresTexto = String(formData.get("valores") || "");
  const valores = valoresTexto
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

  const existente = await prisma.contenidoQuienesSomos.findFirst();

  if (existente) {
    await prisma.contenidoQuienesSomos.update({
      where: { id: existente.id },
      data: { mision, vision, valores },
    });
  } else {
    await prisma.contenidoQuienesSomos.create({
      data: { mision, vision, valores },
    });
  }

  revalidatePath(RUTA);
  revalidatePath("/");
}

async function guardarArchivo(archivo: File): Promise<string> {
  await mkdir(CARPETA_UPLOADS, { recursive: true });

  const extension = archivo.name.split(".").pop() || "jpg";
  const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const rutaCompleta = path.join(CARPETA_UPLOADS, nombreArchivo);

  const bytes = await archivo.arrayBuffer();
  await writeFile(rutaCompleta, Buffer.from(bytes));

  return `/uploads/sitio/${nombreArchivo}`;
}

export async function subirImagenSitio(formData: FormData) {
  const archivo = formData.get("archivo") as File | null;
  const seccionRaw = String(formData.get("seccion") || "");
  const nivelId = String(formData.get("nivelId") || "") || null;
  const alt = String(formData.get("alt") || "") || null;

  if (!archivo || archivo.size === 0) {
    throw new Error("Selecciona una imagen para subir.");
  }
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen (jpg, png, webp).");
  }

  const url = await guardarArchivo(archivo);

  await prisma.imagenSitio.create({
    data: {
      seccion: seccionRaw ? (seccionRaw as SeccionImagen) : null,
      nivelId,
      url,
      alt,
    },
  });

  revalidatePath(RUTA);
  revalidatePath("/");
}

export async function eliminarImagenSitio(formData: FormData) {
  const imagenId = String(formData.get("imagenId"));
  const imagen = await prisma.imagenSitio.findUniqueOrThrow({ where: { id: imagenId } });

  await prisma.imagenSitio.delete({ where: { id: imagenId } });

  if (imagen.url.startsWith("/uploads/sitio/")) {
    const rutaArchivo = path.join(process.cwd(), "public", imagen.url);
    await unlink(rutaArchivo).catch(() => {});
  }

  revalidatePath(RUTA);
  revalidatePath("/");
}
