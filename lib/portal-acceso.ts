import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GENERACIÓN DE CREDENCIALES DE ACCESO (padres al portal, personal al panel)
//
// La contraseña inicial es la cédula de la persona (fácil de recordar, ya la
// tiene a mano) o, si no hay cédula registrada, una contraseña aleatoria.
// Siempre queda marcada para cambiarse en el primer inicio de sesión.
// ---------------------------------------------------------------------------

export function generarPasswordTemporal(): string {
  return crypto.randomBytes(4).toString("hex"); // 8 caracteres
}

export async function otorgarAccesoTutor(
  tutorId: string
): Promise<{ usuario: string; passwordPlano: string }> {
  const tutor = await prisma.tutor.findUniqueOrThrow({ where: { id: tutorId } });

  const passwordPlano = tutor.cedula || generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordPlano, 10);

  await prisma.tutor.update({
    where: { id: tutorId },
    data: { passwordHash, debeCambiarPassword: true },
  });

  return { usuario: tutor.cedula || tutor.email, passwordPlano };
}

export async function otorgarAccesoAdminUser(
  adminUserId: string
): Promise<{ usuario: string; passwordPlano: string }> {
  const usuario = await prisma.adminUser.findUniqueOrThrow({ where: { id: adminUserId } });

  const passwordPlano = usuario.cedula || generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordPlano, 10);

  await prisma.adminUser.update({
    where: { id: adminUserId },
    data: { passwordHash, debeCambiarPassword: true },
  });

  return { usuario: usuario.cedula || usuario.email, passwordPlano };
}
