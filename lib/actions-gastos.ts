"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MetodoPagoGasto } from "@prisma/client";

const RUTA = "/admin/gastos";

// ---------------------------------------------------------------------------
// CATEGORÍAS DE GASTO
// ---------------------------------------------------------------------------

export async function crearCategoriaGasto(formData: FormData) {
  const nombre = String(formData.get("nombre")).trim();
  if (!nombre) throw new Error("El nombre de la categoría es obligatorio.");

  const existente = await prisma.categoriaGasto.findUnique({ where: { nombre } });
  if (existente) throw new Error(`Ya existe una categoría llamada "${nombre}".`);

  await prisma.categoriaGasto.create({
    data: { nombre, descripcion: String(formData.get("descripcion") || "") || null },
  });
  revalidatePath(RUTA);
}

export async function actualizarCategoriaGasto(formData: FormData) {
  const categoriaId = String(formData.get("categoriaId"));
  await prisma.categoriaGasto.update({
    where: { id: categoriaId },
    data: {
      nombre: String(formData.get("nombre")),
      descripcion: String(formData.get("descripcion") || "") || null,
      activa: formData.get("activa") === "on",
    },
  });
  revalidatePath(RUTA);
}

// ---------------------------------------------------------------------------
// GASTOS — al crear uno, se debita automáticamente de la cuenta elegida.
// ---------------------------------------------------------------------------

export async function crearGasto(formData: FormData) {
  const session = await auth();
  const usuario = session?.user as { id?: string } | undefined;

  const categoriaId = String(formData.get("categoriaId"));
  const cuentaId = String(formData.get("cuentaId"));
  const descripcion = String(formData.get("descripcion"));
  const monto = Number(formData.get("monto"));
  const fecha = new Date(String(formData.get("fecha")));
  const metodoPago = String(formData.get("metodoPago")) as MetodoPagoGasto;
  const proveedor = String(formData.get("proveedor") || "") || null;
  const numeroComprobante = String(formData.get("numeroComprobante") || "") || null;
  const notas = String(formData.get("notas") || "") || null;

  if (!cuentaId) throw new Error("Debes elegir de qué cuenta bancaria sale este gasto.");
  if (!(monto > 0)) throw new Error("El monto debe ser mayor a cero.");

  await prisma.$transaction(async (tx) => {
    const gasto = await tx.gasto.create({
      data: {
        categoriaId,
        cuentaId,
        descripcion,
        monto,
        fecha,
        metodoPago,
        proveedor,
        numeroComprobante,
        notas,
        registradoPorId: usuario?.id,
      },
    });

    // Debita automáticamente de la cuenta elegida
    await tx.movimientoBancario.create({
      data: {
        cuentaId,
        tipo: "RETIRO",
        monto,
        descripcion: `Gasto: ${descripcion}`,
        fecha,
        gastoId: gasto.id,
        registradoPorId: usuario?.id,
      },
    });
  });

  revalidatePath(RUTA);
  revalidatePath("/admin/cuentas");
}

// Solo se pueden editar los campos descriptivos (no monto, cuenta, ni fecha,
// ya que esos ya generaron un movimiento bancario real). Para corregir el
// monto/cuenta, anula el gasto y crea uno nuevo.
export async function actualizarGasto(formData: FormData) {
  const gastoId = String(formData.get("gastoId"));
  const gasto = await prisma.gasto.findUniqueOrThrow({ where: { id: gastoId } });
  if (gasto.estado === "ANULADO") {
    throw new Error("Este gasto está anulado y no se puede editar.");
  }

  await prisma.gasto.update({
    where: { id: gastoId },
    data: {
      descripcion: String(formData.get("descripcion")),
      proveedor: String(formData.get("proveedor") || "") || null,
      numeroComprobante: String(formData.get("numeroComprobante") || "") || null,
      notas: String(formData.get("notas") || "") || null,
    },
  });
  revalidatePath(RUTA);
}

// Anular un gasto ya pagado revierte automáticamente el dinero a la cuenta
// (con un movimiento de ajuste), en vez de borrar el movimiento original.
export async function anularGasto(formData: FormData) {
  const session = await auth();
  const usuario = session?.user as { id?: string } | undefined;
  const gastoId = String(formData.get("gastoId"));

  const gasto = await prisma.gasto.findUniqueOrThrow({ where: { id: gastoId } });
  if (gasto.estado === "ANULADO") return;

  await prisma.$transaction(async (tx) => {
    await tx.gasto.update({ where: { id: gastoId }, data: { estado: "ANULADO" } });

    await tx.movimientoBancario.create({
      data: {
        cuentaId: gasto.cuentaId,
        tipo: "AJUSTE",
        monto: Number(gasto.monto), // positivo: repone el dinero
        descripcion: `Reversión por anulación de gasto: ${gasto.descripcion}`,
        gastoId: gasto.id,
        registradoPorId: usuario?.id,
      },
    });
  });

  revalidatePath(RUTA);
  revalidatePath("/admin/cuentas");
}
