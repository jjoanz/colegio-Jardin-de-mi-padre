"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requierePermiso } from "@/lib/permisos";
import { crearPagoYFactura } from "@/lib/pagos";
import { notificarNuevoPagoReportado } from "@/lib/notificaciones";
import { MetodoPago } from "@prisma/client";

const CARPETA_COMPROBANTES = path.join(process.cwd(), "public", "uploads", "comprobantes-pago");

async function guardarComprobanteSiExiste(formData: FormData): Promise<string | undefined> {
  const archivo = formData.get("comprobante") as File | null;
  if (!archivo || archivo.size === 0) return undefined;
  await mkdir(CARPETA_COMPROBANTES, { recursive: true });
  const extension = archivo.name.split(".").pop() || "jpg";
  const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  await writeFile(path.join(CARPETA_COMPROBANTES, nombreArchivo), Buffer.from(await archivo.arrayBuffer()));
  return `/uploads/comprobantes-pago/${nombreArchivo}`;
}

// ---------------------------------------------------------------------------
// PADRE: reporta que pagó un cargo (sin gateway en línea todavía — el
// personal confirma manualmente desde /admin/pagos)
// ---------------------------------------------------------------------------

export async function reportarPago(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user as { tipoUsuario?: string }).tipoUsuario !== "PADRE") {
    throw new Error("No autorizado.");
  }
  const tutorId = (session.user as { id: string }).id;
  const cargoId = String(formData.get("cargoId"));

  // El cargo debe pertenecer a un estudiante vinculado a este tutor.
  const cargo = await prisma.cargo.findUniqueOrThrow({
    where: { id: cargoId },
    include: { estudiante: { include: { tutores: true } } },
  });
  const esSuyo = cargo.estudiante.tutores.some((et) => et.tutorId === tutorId);
  if (!esSuyo) {
    throw new Error("No autorizado.");
  }

  const monto = Number(formData.get("monto"));
  if (!monto || monto <= 0) {
    throw new Error("El monto reportado debe ser mayor a cero.");
  }

  const tutor = await prisma.tutor.findUniqueOrThrow({ where: { id: tutorId } });
  const comprobanteUrl = await guardarComprobanteSiExiste(formData);

  await prisma.pagoReportado.create({
    data: {
      cargoId,
      tutorId,
      monto,
      metodo: String(formData.get("metodo")) as MetodoPago,
      referencia: String(formData.get("referencia") || "") || undefined,
      notasTutor: String(formData.get("notasTutor") || "") || undefined,
      comprobanteUrl,
    },
  });

  await notificarNuevoPagoReportado({
    nombreTutor: `${tutor.nombre} ${tutor.apellido}`.trim(),
    nombreEstudiante: `${cargo.estudiante.nombre} ${cargo.estudiante.apellido}`,
    descripcion: cargo.descripcion,
    monto,
  });

  revalidatePath(`/portal/estudiantes/${cargo.estudianteId}`);
}

// ---------------------------------------------------------------------------
// PERSONAL: confirma o rechaza un pago reportado
// ---------------------------------------------------------------------------

export async function confirmarPagoReportado(formData: FormData) {
  const usuario = await requierePermiso("pagos", "crear");
  const pagoReportadoId = String(formData.get("pagoReportadoId"));

  await prisma.$transaction(async (tx) => {
    const reportado = await tx.pagoReportado.findUniqueOrThrow({ where: { id: pagoReportadoId } });
    if (reportado.estado !== "PENDIENTE") {
      throw new Error("Este pago reportado ya fue revisado.");
    }

    const { pago } = await crearPagoYFactura(tx, {
      cargoId: reportado.cargoId,
      monto: Number(reportado.monto),
      metodo: reportado.metodo,
      referencia: reportado.referencia ?? undefined,
      notas: `Reportado por el padre/tutor desde el portal.${reportado.notasTutor ? ` Nota: ${reportado.notasTutor}` : ""}`,
      registradoPorId: usuario.id,
    });

    await tx.pagoReportado.update({
      where: { id: pagoReportadoId },
      data: { estado: "CONFIRMADO", pagoId: pago.id, revisadoEn: new Date(), revisadoPorId: usuario.id },
    });
  });

  revalidatePath("/admin/pagos");
  revalidatePath("/admin/facturas");
  revalidatePath("/admin/estudiantes");
}

export async function rechazarPagoReportado(formData: FormData) {
  const usuario = await requierePermiso("pagos", "editar");
  const pagoReportadoId = String(formData.get("pagoReportadoId"));
  const notasRevision = String(formData.get("notasRevision") || "") || undefined;

  await prisma.pagoReportado.update({
    where: { id: pagoReportadoId },
    data: { estado: "RECHAZADO", notasRevision, revisadoEn: new Date(), revisadoPorId: usuario.id },
  });

  revalidatePath("/admin/pagos");
}
