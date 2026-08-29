"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const RUTA = "/admin/publicaciones";
const CARPETA_UPLOADS = path.join(process.cwd(), "public", "uploads", "sitio");

async function guardarArchivoSiExiste(formData: FormData, campo: string): Promise<string | undefined> {
  const archivo = formData.get(campo) as File | null;
  if (!archivo || archivo.size === 0) return undefined;
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen (jpg, png, webp).");
  }
  await mkdir(CARPETA_UPLOADS, { recursive: true });
  const extension = archivo.name.split(".").pop() || "jpg";
  const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  await writeFile(path.join(CARPETA_UPLOADS, nombreArchivo), Buffer.from(await archivo.arrayBuffer()));
  return `/uploads/sitio/${nombreArchivo}`;
}

export async function crearPublicacion(formData: FormData) {
  const session = await auth();
  const usuario = session?.user as { id?: string } | undefined;
  const imagenUrl = await guardarArchivoSiExiste(formData, "foto");

  await prisma.publicacion.create({
    data: {
      titulo: String(formData.get("titulo")),
      resumen: String(formData.get("resumen")),
      contenido: String(formData.get("contenido")),
      imagenUrl: imagenUrl ?? null,
      publicada: formData.get("publicada") === "on",
      fecha: formData.get("fecha") ? new Date(String(formData.get("fecha"))) : new Date(),
      autorId: usuario?.id,
    },
  });

  revalidatePath(RUTA);
  revalidatePath("/");
}

export async function actualizarPublicacion(formData: FormData) {
  const publicacionId = String(formData.get("publicacionId"));
  const imagenUrl = await guardarArchivoSiExiste(formData, "foto");

  await prisma.publicacion.update({
    where: { id: publicacionId },
    data: {
      titulo: String(formData.get("titulo")),
      resumen: String(formData.get("resumen")),
      contenido: String(formData.get("contenido")),
      publicada: formData.get("publicada") === "on",
      fecha: formData.get("fecha") ? new Date(String(formData.get("fecha"))) : undefined,
      ...(imagenUrl ? { imagenUrl } : {}),
    },
  });

  revalidatePath(RUTA);
  revalidatePath("/");
}

export async function eliminarPublicacion(formData: FormData) {
  const publicacionId = String(formData.get("publicacionId"));
  await prisma.publicacion.delete({ where: { id: publicacionId } });
  revalidatePath(RUTA);
  revalidatePath("/");
}
