"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { otorgarAccesoTutor, otorgarAccesoAdminUser } from "@/lib/portal-acceso";
import { notificarAccesoPortal, notificarAccesoPanel } from "@/lib/notificaciones";

// ---------------------------------------------------------------------------
// "OLVIDÉ MI CONTRASEÑA" — accesible sin sesión desde /admin/login.
//
// Por seguridad nunca revela si el correo/cédula existe o no: siempre
// redirige al mismo mensaje de éxito, exista o no la cuenta.
// ---------------------------------------------------------------------------

export async function solicitarRecuperacionPassword(formData: FormData) {
  const identificador = String(formData.get("identificador") || "").trim();

  if (identificador) {
    const staff = await prisma.adminUser.findFirst({
      where: { OR: [{ email: identificador }, { cedula: identificador }] },
      include: { role: true },
    });

    if (staff && staff.activo) {
      const { usuario, passwordPlano } = await otorgarAccesoAdminUser(staff.id);
      await notificarAccesoPanel({
        email: staff.email,
        nombre: staff.nombre,
        usuario,
        passwordTemporal: passwordPlano,
        rol: staff.role?.nombre ?? staff.rol,
      });
    } else {
      const tutor = await prisma.tutor.findFirst({
        where: { OR: [{ email: identificador }, { cedula: identificador }] },
      });
      if (tutor && tutor.activo) {
        const { usuario, passwordPlano } = await otorgarAccesoTutor(tutor.id);
        await notificarAccesoPortal({
          email: tutor.email,
          nombre: tutor.nombre,
          usuario,
          passwordTemporal: passwordPlano,
        });
      }
    }
  }

  redirect("/admin/recuperar-password?enviado=1");
}
