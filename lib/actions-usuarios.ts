"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requierePermiso } from "@/lib/permisos";

// ---------------------------------------------------------------------------
// USUARIOS DEL PANEL (módulo de Administración: crear/editar/roles)
// ---------------------------------------------------------------------------

export async function crearUsuarioAdmin(formData: FormData) {
  await requierePermiso("usuarios", "crear");
  const nombre = String(formData.get("nombre"));
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const roleId = String(formData.get("roleId"));

  if (password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.");
  }

  const existente = await prisma.adminUser.findUnique({ where: { email } });
  if (existente) {
    throw new Error("Ya existe un usuario con ese correo.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.create({
    data: {
      nombre,
      email,
      passwordHash,
      roleId,
    },
  });

  revalidatePath("/admin/usuarios");
}

export async function actualizarUsuarioAdmin(formData: FormData) {
  await requierePermiso("usuarios", "editar");
  const usuarioId = String(formData.get("usuarioId"));

  await prisma.adminUser.update({
    where: { id: usuarioId },
    data: {
      nombre: String(formData.get("nombre")),
      email: String(formData.get("email")),
      roleId: String(formData.get("roleId")),
      activo: formData.get("activo") === "on",
    },
  });

  revalidatePath("/admin/usuarios");
}

export async function resetPasswordUsuarioAdmin(formData: FormData) {
  await requierePermiso("usuarios", "editar");
  const usuarioId = String(formData.get("usuarioId"));
  const password = String(formData.get("password"));

  if (password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.update({
    where: { id: usuarioId },
    data: { passwordHash },
  });

  revalidatePath("/admin/usuarios");
}
