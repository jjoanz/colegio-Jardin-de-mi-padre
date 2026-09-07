"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requierePermiso } from "@/lib/permisos";
import { auth, unstable_update } from "@/lib/auth";
import { otorgarAccesoAdminUser } from "@/lib/portal-acceso";
import { notificarAccesoPanel } from "@/lib/notificaciones";

// ---------------------------------------------------------------------------
// USUARIOS DEL PANEL (módulo de Administración: crear/editar/roles)
// ---------------------------------------------------------------------------

export async function crearUsuarioAdmin(formData: FormData) {
  await requierePermiso("usuarios", "crear");
  const nombre = String(formData.get("nombre"));
  const email = String(formData.get("email"));
  const password = String(formData.get("password")).trim();
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
  const password = String(formData.get("password")).trim();

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

// Genera una contraseña temporal (cédula, o aleatoria si no tiene) y la envía
// por correo. Sirve para usuarios viejos que quedaron sin acceso, o para
// reenviar credenciales si la persona las perdió.
export async function otorgarAccesoUsuarioAdmin(formData: FormData) {
  await requierePermiso("usuarios", "editar");
  const usuarioId = String(formData.get("usuarioId"));

  const usuario = await prisma.adminUser.findUniqueOrThrow({
    where: { id: usuarioId },
    include: { role: true },
  });
  const { usuario: nombreUsuarioAcceso, passwordPlano } = await otorgarAccesoAdminUser(usuarioId);
  await notificarAccesoPanel({
    email: usuario.email,
    nombre: usuario.nombre,
    usuario: nombreUsuarioAcceso,
    passwordTemporal: passwordPlano,
    rol: usuario.role?.nombre ?? usuario.rol,
  });

  revalidatePath("/admin/usuarios");
}

// ---------------------------------------------------------------------------
// CAMBIO DE CONTRASEÑA FORZADO (personal con debeCambiarPassword = true)
// ---------------------------------------------------------------------------

export type EstadoCambioPassword = { error?: string };

export async function cambiarPasswordAdminUser(
  _prevState: EstadoCambioPassword,
  formData: FormData
): Promise<EstadoCambioPassword> {
  const session = await auth();
  if (!session?.user || (session.user as { tipoUsuario?: string }).tipoUsuario !== "STAFF") {
    return { error: "No autorizado." };
  }
  const usuarioId = (session.user as { id: string }).id;

  const passwordActual = String(formData.get("passwordActual")).trim();
  const passwordNueva = String(formData.get("passwordNueva")).trim();

  if (passwordNueva.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  }

  const usuario = await prisma.adminUser.findUniqueOrThrow({ where: { id: usuarioId } });
  if (!(await bcrypt.compare(passwordActual, usuario.passwordHash))) {
    return { error: "La contraseña actual no es correcta." };
  }

  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  await prisma.adminUser.update({
    where: { id: usuarioId },
    data: { passwordHash, debeCambiarPassword: false },
  });

  await unstable_update({ debeCambiarPassword: false } as unknown as Parameters<typeof unstable_update>[0]);
  redirect("/admin");
}
