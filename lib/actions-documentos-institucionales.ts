"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { TipoDocumentoInstitucional } from "@prisma/client";

const RUTA = "/admin/poa-proyectos";
const CARPETA_UPLOADS = path.join(process.cwd(), "public", "uploads", "documentos-institucionales");

async function guardarArchivo(formData: FormData): Promise<string> {
  const archivo = formData.get("archivo") as File | null;
  if (!archivo || archivo.size === 0) {
    throw new Error("Debes adjuntar un archivo (PDF u otro documento).");
  }
  await mkdir(CARPETA_UPLOADS, { recursive: true });
  const extension = archivo.name.split(".").pop() || "pdf";
  const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  await writeFile(path.join(CARPETA_UPLOADS, nombreArchivo), Buffer.from(await archivo.arrayBuffer()));
  return `/uploads/documentos-institucionales/${nombreArchivo}`;
}

export async function crearDocumentoInstitucional(formData: FormData) {
  const session = await auth();
  const usuario = session?.user as { id?: string } | undefined;

  const titulo = String(formData.get("titulo") || "").trim();
  if (!titulo) throw new Error("El título es obligatorio.");

  const tipo = String(formData.get("tipo")) as TipoDocumentoInstitucional;
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const anioEscolarId = formData.get("anioEscolarId") ? String(formData.get("anioEscolarId")) : null;
  const archivoUrl = await guardarArchivo(formData);

  await prisma.documentoInstitucional.create({
    data: {
      titulo,
      tipo,
      descripcion,
      anioEscolarId,
      archivoUrl,
      subidoPorId: usuario?.id,
    },
  });

  revalidatePath(RUTA);
}

export async function eliminarDocumentoInstitucional(formData: FormData) {
  const documentoId = String(formData.get("documentoId"));
  await prisma.documentoInstitucional.delete({ where: { id: documentoId } });
  revalidatePath(RUTA);
}
