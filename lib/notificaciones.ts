import { prisma } from "@/lib/prisma";
import { enviarCorreo } from "@/lib/mailer";

const NOMBRE_COLEGIO = process.env.NEXT_PUBLIC_SCHOOL_NAME || "el colegio";
const CORREO_COLEGIO = process.env.NEXT_PUBLIC_SCHOOL_EMAIL;

function formatoMoneda(monto: number): string {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(monto);
}

function formatoFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-DO", { day: "numeric", month: "long", year: "numeric" }).format(fecha);
}

function plantillaBase(titulo: string, cuerpoHtml: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color:#222;">
      <h2 style="color:#2b3a67; margin-bottom:4px;">${NOMBRE_COLEGIO}</h2>
      <h3 style="margin-top:0; color:#444;">${titulo}</h3>
      ${cuerpoHtml}
      <p style="margin-top:32px; font-size:12px; color:#888;">
        Este es un mensaje automático de la plataforma de ${NOMBRE_COLEGIO}.
      </p>
    </div>`;
}

async function obtenerTutorPrincipal(estudianteId: string) {
  const vinculo = await prisma.estudianteTutor.findFirst({
    where: { estudianteId },
    orderBy: { esContactoPrincipal: "desc" },
    include: { tutor: true },
  });
  return vinculo?.tutor ?? null;
}

export async function notificarConfirmacionInscripcion(email: string, nombreEstudiante: string): Promise<void> {
  await enviarCorreo({
    to: email,
    subject: `Hemos recibido la solicitud de inscripción de ${nombreEstudiante}`,
    html: plantillaBase(
      "Solicitud recibida",
      `<p>Hola,</p>
       <p>Hemos recibido la solicitud de inscripción de <strong>${nombreEstudiante}</strong>.
       Nuestro equipo de secretaría la revisará pronto y te contactaremos con la respuesta.</p>`
    ),
  });
}

export async function notificarNuevaSolicitudAAdmin(
  nombreEstudiante: string,
  nombreTutor: string,
  telefonoTutor: string
): Promise<void> {
  if (!CORREO_COLEGIO) return;
  await enviarCorreo({
    to: CORREO_COLEGIO,
    subject: `Nueva solicitud de inscripción: ${nombreEstudiante}`,
    html: plantillaBase(
      "Nueva solicitud de inscripción",
      `<p>Se recibió una nueva solicitud de inscripción en el sitio web.</p>
       <ul>
         <li><strong>Estudiante:</strong> ${nombreEstudiante}</li>
         <li><strong>Contacto:</strong> ${nombreTutor || "-"} · ${telefonoTutor || "-"}</li>
       </ul>
       <p>Revísala en el panel administrativo, sección Solicitudes.</p>`
    ),
  });
}

export async function notificarResultadoSolicitud(
  email: string,
  nombreEstudiante: string,
  aprobada: boolean
): Promise<void> {
  await enviarCorreo({
    to: email,
    subject: aprobada
      ? `¡Buenas noticias! La inscripción de ${nombreEstudiante} fue aprobada`
      : `Actualización sobre la solicitud de inscripción de ${nombreEstudiante}`,
    html: plantillaBase(
      aprobada ? "Solicitud aprobada" : "Solicitud no aprobada",
      aprobada
        ? `<p>Nos complace informarte que la solicitud de inscripción de <strong>${nombreEstudiante}</strong> fue aprobada.</p>
           <p>Pronto recibirás información sobre los próximos pasos y los pagos correspondientes.</p>`
        : `<p>Lamentamos informarte que, por el momento, no fue posible aprobar la solicitud de inscripción de <strong>${nombreEstudiante}</strong>.</p>
           <p>Si tienes preguntas, contáctanos respondiendo este correo.</p>`
    ),
  });
}

export async function notificarReciboPago(params: {
  estudianteId: string;
  descripcion: string;
  monto: number;
  numeroFactura: string;
}): Promise<void> {
  const tutor = await obtenerTutorPrincipal(params.estudianteId);
  if (!tutor) return;

  const estudiante = await prisma.estudiante.findUnique({ where: { id: params.estudianteId } });
  const nombreEstudiante = estudiante ? `${estudiante.nombre} ${estudiante.apellido}` : null;

  await enviarCorreo({
    to: tutor.email,
    subject: `Recibo de pago - Factura ${params.numeroFactura}`,
    html: plantillaBase(
      "Recibo de pago",
      `<p>Hemos registrado el siguiente pago${nombreEstudiante ? ` para <strong>${nombreEstudiante}</strong>` : ""}:</p>
       <table style="width:100%; border-collapse: collapse;">
         <tr><td style="padding:4px 0;">Concepto</td><td style="text-align:right;">${params.descripcion}</td></tr>
         <tr><td style="padding:4px 0;">Monto pagado</td><td style="text-align:right;">${formatoMoneda(params.monto)}</td></tr>
         <tr><td style="padding:4px 0;">Factura</td><td style="text-align:right;">${params.numeroFactura}</td></tr>
       </table>
       <p>Gracias por tu pago.</p>`
    ),
  });
}

export async function notificarCargoGenerado(params: {
  estudianteId: string;
  descripcion: string;
  monto: number;
  fechaVencimiento: Date;
}): Promise<void> {
  const tutor = await obtenerTutorPrincipal(params.estudianteId);
  if (!tutor) return;

  const estudiante = await prisma.estudiante.findUnique({ where: { id: params.estudianteId } });
  const nombreEstudiante = estudiante ? `${estudiante.nombre} ${estudiante.apellido}` : null;

  await enviarCorreo({
    to: tutor.email,
    subject: `Nuevo cargo pendiente${nombreEstudiante ? ` - ${nombreEstudiante}` : ""}`,
    html: plantillaBase(
      "Nuevo cargo pendiente",
      `<p>Se generó un nuevo cargo${nombreEstudiante ? ` para <strong>${nombreEstudiante}</strong>` : ""}:</p>
       <table style="width:100%; border-collapse: collapse;">
         <tr><td style="padding:4px 0;">Concepto</td><td style="text-align:right;">${params.descripcion}</td></tr>
         <tr><td style="padding:4px 0;">Monto</td><td style="text-align:right;">${formatoMoneda(params.monto)}</td></tr>
         <tr><td style="padding:4px 0;">Fecha límite de pago</td><td style="text-align:right;">${formatoFecha(params.fechaVencimiento)}</td></tr>
       </table>`
    ),
  });
}
