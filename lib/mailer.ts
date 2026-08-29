import nodemailer from "nodemailer";

let transportador: ReturnType<typeof nodemailer.createTransport> | null | undefined;

// Se arma una sola vez (undefined = todavía no evaluado, null = SMTP no configurado).
function obtenerTransportador() {
  if (transportador !== undefined) return transportador;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP no configurado (faltan SMTP_HOST/SMTP_USER/SMTP_PASS) — los correos no se enviarán.");
    transportador = null;
    return transportador;
  }

  transportador = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transportador;
}

// Nunca lanza — un correo que falla no debe tumbar la operación (aprobar
// solicitud, registrar pago, etc.) que lo disparó. Los errores solo se
// registran en el log del servidor.
export async function enviarCorreo(opts: { to: string; subject: string; html: string }): Promise<void> {
  const transporte = obtenerTransportador();
  if (!transporte) return;

  const nombreColegio = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Colegio";
  const remitente = process.env.SMTP_FROM || process.env.SMTP_USER!;

  try {
    await transporte.sendMail({
      from: `"${nombreColegio}" <${remitente}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (error) {
    console.error(`Error enviando correo a ${opts.to} ("${opts.subject}"):`, error);
  }
}
