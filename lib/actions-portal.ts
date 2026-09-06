"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// ACCIONES DEL PORTAL DE PADRES
// ---------------------------------------------------------------------------

export async function cambiarPasswordTutor(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user as { tipoUsuario?: string }).tipoUsuario !== "PADRE") {
    throw new Error("No autorizado.");
  }
  const tutorId = (session.user as { id: string }).id;

  const passwordActual = String(formData.get("passwordActual"));
  const passwordNueva = String(formData.get("passwordNueva"));

  if (passwordNueva.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }

  const tutor = await prisma.tutor.findUniqueOrThrow({ where: { id: tutorId } });
  if (!tutor.passwordHash || !(await bcrypt.compare(passwordActual, tutor.passwordHash))) {
    throw new Error("La contraseña actual no es correcta.");
  }

  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  await prisma.tutor.update({
    where: { id: tutorId },
    data: { passwordHash, debeCambiarPassword: false },
  });

  redirect("/portal");
}
