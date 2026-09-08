"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requierePermiso } from "@/lib/permisos";
import type { EstadoEliminacion } from "@/lib/actions";

// ---------------------------------------------------------------------------
// GRADOS (viven dentro de un nivel, cada uno con su propio precio)
// ---------------------------------------------------------------------------

export async function crearGrado(formData: FormData) {
  await requierePermiso("niveles", "crear");
  await prisma.grado.create({
    data: {
      nivelId: String(formData.get("nivelId")),
      nombre: String(formData.get("nombre")),
      tarifaInscripcion: Number(formData.get("tarifaInscripcion")),
      colegiaturaAnual: formData.get("colegiaturaAnual") ? Number(formData.get("colegiaturaAnual")) : 0,
      diaPago: formData.get("diaPago") ? Number(formData.get("diaPago")) : 5,
      ordenVisual: formData.get("ordenVisual") ? Number(formData.get("ordenVisual")) : 0,
    },
  });
  revalidatePath("/admin/niveles");
  revalidatePath("/admin/aulas");
}

export async function actualizarGrado(formData: FormData) {
  await requierePermiso("niveles", "editar");
  const gradoId = String(formData.get("gradoId"));
  await prisma.grado.update({
    where: { id: gradoId },
    data: {
      nombre: String(formData.get("nombre")),
      tarifaInscripcion: Number(formData.get("tarifaInscripcion")),
      colegiaturaAnual: formData.get("colegiaturaAnual") ? Number(formData.get("colegiaturaAnual")) : 0,
      diaPago: formData.get("diaPago") ? Number(formData.get("diaPago")) : 5,
      activo: formData.get("activo") === "on",
    },
  });
  revalidatePath("/admin/niveles");
  revalidatePath("/admin/aulas");
}

// Devuelve el error en vez de lanzarlo (throw) — en producción, Next.js
// oculta el mensaje de cualquier error lanzado desde una Server Action.
export async function eliminarGrado(
  _prevState: EstadoEliminacion,
  formData: FormData
): Promise<EstadoEliminacion> {
  await requierePermiso("niveles", "eliminar");
  const gradoId = String(formData.get("gradoId"));
  try {
    await prisma.grado.delete({ where: { id: gradoId } });
  } catch {
    return {
      error: "No se puede eliminar este grado porque todavía tiene estudiantes asociados. Muévelos primero.",
    };
  }
  revalidatePath("/admin/niveles");
  revalidatePath("/admin/aulas");
  return {};
}

// ---------------------------------------------------------------------------
// COSTOS ADICIONALES (catálogo por grado: libros, uniformes, etc. — el
// precio suele variar de un grado a otro, por eso no se define a nivel
// general. El personal los aplica manualmente al cobrar, nunca automático)
// ---------------------------------------------------------------------------

export async function crearCargoAdicional(formData: FormData) {
  await requierePermiso("niveles", "crear");
  await prisma.cargoAdicional.create({
    data: {
      gradoId: String(formData.get("gradoId")),
      nombre: String(formData.get("nombre")),
      monto: Number(formData.get("monto")),
      descripcion: String(formData.get("descripcion") || "") || undefined,
    },
  });
  revalidatePath("/admin/niveles");
  revalidatePath("/admin/cargos");
}

export async function actualizarCargoAdicional(formData: FormData) {
  await requierePermiso("niveles", "editar");
  const cargoAdicionalId = String(formData.get("cargoAdicionalId"));
  await prisma.cargoAdicional.update({
    where: { id: cargoAdicionalId },
    data: {
      nombre: String(formData.get("nombre")),
      monto: Number(formData.get("monto")),
      descripcion: String(formData.get("descripcion") || "") || undefined,
      activo: formData.get("activo") === "on",
    },
  });
  revalidatePath("/admin/niveles");
  revalidatePath("/admin/cargos");
}

// Sin dependientes que la bloqueen — es solo un ítem de catálogo, nunca se
// referencia desde un Cargo real (el cargo ya creado queda igual si se
// borra el ítem del catálogo que lo originó).
export async function eliminarCargoAdicional(formData: FormData) {
  await requierePermiso("niveles", "eliminar");
  const cargoAdicionalId = String(formData.get("cargoAdicionalId"));
  await prisma.cargoAdicional.delete({ where: { id: cargoAdicionalId } });
  revalidatePath("/admin/niveles");
  revalidatePath("/admin/cargos");
}
