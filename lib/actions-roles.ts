"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// ROLES
// ---------------------------------------------------------------------------

export async function crearRol(formData: FormData) {
  const nombre = String(formData.get("nombre")).trim().toUpperCase();
  const descripcion = String(formData.get("descripcion") || "") || null;

  if (!nombre) {
    throw new Error("El nombre del rol es obligatorio.");
  }

  const existente = await prisma.role.findUnique({ where: { nombre } });
  if (existente) {
    throw new Error("Ya existe un rol con ese nombre.");
  }

  await prisma.role.create({
    data: { nombre, descripcion, esSistema: false },
  });

  revalidatePath("/admin/roles");
}

// El nombre de los roles base (esSistema=true) no se puede cambiar porque
// el script de migración y el seed original los referencian por nombre.
// La descripción sí se puede editar libremente.
export async function actualizarRol(formData: FormData) {
  const roleId = String(formData.get("roleId"));
  const descripcion = String(formData.get("descripcion") || "") || null;

  const role = await prisma.role.findUniqueOrThrow({ where: { id: roleId } });

  const data: { nombre?: string; descripcion: string | null } = { descripcion };
  if (!role.esSistema) {
    const nombre = String(formData.get("nombre")).trim().toUpperCase();
    if (!nombre) {
      throw new Error("El nombre del rol es obligatorio.");
    }
    data.nombre = nombre;
  }

  await prisma.role.update({ where: { id: roleId }, data });

  revalidatePath("/admin/roles");
  revalidatePath("/admin/usuarios");
}

export async function eliminarRol(formData: FormData) {
  const roleId = String(formData.get("roleId"));

  const role = await prisma.role.findUniqueOrThrow({
    where: { id: roleId },
    include: { _count: { select: { usuarios: true } } },
  });

  if (role.esSistema) {
    throw new Error("Este es un rol base del sistema y no se puede eliminar.");
  }
  if (role._count.usuarios > 0) {
    throw new Error(
      `Este rol tiene ${role._count.usuarios} usuario(s) asignado(s). Reasígnalos a otro rol antes de eliminarlo.`
    );
  }

  await prisma.role.delete({ where: { id: roleId } });
  revalidatePath("/admin/roles");
}

// ---------------------------------------------------------------------------
// MATRIZ DE PERMISOS DE UN ROL
// ---------------------------------------------------------------------------

// Reemplaza por completo el set de permisos del rol con los que vengan
// marcados en el formulario (checkboxes). Si un permiso no viene en la
// lista, se entiende que se desmarcó y se elimina.
export async function actualizarPermisosRol(formData: FormData) {
  const roleId = String(formData.get("roleId"));
  const permisoIdsSeleccionados = formData.getAll("permisoIds").map(String);

  const role = await prisma.role.findUniqueOrThrow({ where: { id: roleId } });
  if (role.nombre === "ADMIN") {
    throw new Error("El rol ADMIN siempre mantiene todos los permisos y no se puede modificar.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (permisoIdsSeleccionados.length > 0) {
      await tx.rolePermission.createMany({
        data: permisoIdsSeleccionados.map((permissionId) => ({ roleId, permissionId })),
      });
    }
  });

  revalidatePath(`/admin/roles/${roleId}/permisos`);
  revalidatePath("/admin/roles");
}
