"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// ACCIONES DEL PORTAL DE PADRES
// ---------------------------------------------------------------------------

export type EstadoCambioPassword = { error?: string };

export async function cambiarPasswordTutor(
  _prevState: EstadoCambioPassword,
  formData: FormData
): Promise<EstadoCambioPassword> {
  const session = await auth();
  if (!session?.user || (session.user as { tipoUsuario?: string }).tipoUsuario !== "PADRE") {
    return { error: "No autorizado." };
  }
  const tutorId = (session.user as { id: string }).id;

  const passwordActual = String(formData.get("passwordActual")).trim();
  const passwordNueva = String(formData.get("passwordNueva")).trim();

  if (passwordNueva.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  }

  const tutor = await prisma.tutor.findUniqueOrThrow({ where: { id: tutorId } });
  if (!tutor.passwordHash || !(await bcrypt.compare(passwordActual, tutor.passwordHash))) {
    return { error: "La contraseña actual no es correcta." };
  }

  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  await prisma.tutor.update({
    where: { id: tutorId },
    data: { passwordHash, debeCambiarPassword: false },
  });

  await unstable_update({ debeCambiarPassword: false } as unknown as Parameters<typeof unstable_update>[0]);
  redirect("/portal");
}
