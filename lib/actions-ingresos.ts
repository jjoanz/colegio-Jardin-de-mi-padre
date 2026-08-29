"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MetodoPagoGasto } from "@prisma/client";

const RUTA = "/admin/ingresos";

export async function crearCategoriaIngreso(formData: FormData) {
  const nombre = String(formData.get("nombre")).trim();
  if (!nombre) throw new Error("El nombre de la categoría es obligatorio.");

  const existente = await prisma.categoriaIngreso.findUnique({ where: { nombre } });
  if (existente) throw new Error(`Ya existe una categoría llamada "${nombre}".`);

  await prisma.categoriaIngreso.create({
    data: { nombre, descripcion: String(formData.get("descripcion") || "") || null },
  });
  revalidatePath(RUTA);
}

export async function actualizarCategoriaIngreso(formData: FormData) {
  const categoriaId = String(formData.get("categoriaId"));
  await prisma.categoriaIngreso.update({
    where: { id: categoriaId },
    data: {
      nombre: String(formData.get("nombre")),
      descripcion: String(formData.get("descripcion") || "") || null,
      activa: formData.get("activa") === "on",
    },
  });
  revalidatePath(RUTA);
}

export async function crearIngreso(formData: FormData) {
  const session = await auth();
  const usuario = session?.user as { id?: string } | undefined;

  const categoriaId = String(formData.get("categoriaId"));
  const cuentaId = String(formData.get("cuentaId"));
  const descripcion = String(formData.get("descripcion"));
  const monto = Number(formData.get("monto"));
  const fecha = new Date(String(formData.get("fecha")));
  const metodoPago = String(formData.get("metodoPago")) as MetodoPagoGasto;
  const fuente = String(formData.get("fuente") || "") || null;
  const numeroComprobante = String(formData.get("numeroComprobante") || "") || null;
  const notas = String(formData.get("notas") || "") || null;

  if (!cuentaId) throw new Error("Debes elegir a qué cuenta bancaria entra este ingreso.");
  if (!(monto > 0)) throw new Error("El monto debe ser mayor a cero.");

  await prisma.$transaction(async (tx) => {
    const ingreso = await tx.ingreso.create({
      data: {
        categoriaId,
        cuentaId,
        descripcion,
        monto,
        fecha,
        metodoPago,
        fuente,
        numeroComprobante,
        notas,
        registradoPorId: usuario?.id,
      },
    });

    await tx.movimientoBancario.create({
      data: {
        cuentaId,
        tipo: "DEPOSITO",
        monto,
        descripcion: `Ingreso: ${descripcion}`,
        fecha,
        ingresoId: ingreso.id,
        registradoPorId: usuario?.id,
      },
    });
  });

  revalidatePath(RUTA);
  revalidatePath("/admin/cuentas");
}

export async function actualizarIngreso(formData: FormData) {
  const ingresoId = String(formData.get("ingresoId"));
  const ingreso = await prisma.ingreso.findUniqueOrThrow({ where: { id: ingresoId } });
  if (ingreso.estado === "ANULADO") {
    throw new Error("Este ingreso está anulado y no se puede editar.");
  }

  await prisma.ingreso.update({
    where: { id: ingresoId },
    data: {
      descripcion: String(formData.get("descripcion")),
      fuente: String(formData.get("fuente") || "") || null,
      numeroComprobante: String(formData.get("numeroComprobante") || "") || null,
      notas: String(formData.get("notas") || "") || null,
    },
  });
  revalidatePath(RUTA);
}

export async function anularIngreso(formData: FormData) {
  const session = await auth();
  const usuario = session?.user as { id?: string } | undefined;
  const ingresoId = String(formData.get("ingresoId"));

  const ingreso = await prisma.ingreso.findUniqueOrThrow({ where: { id: ingresoId } });
  if (ingreso.estado === "ANULADO") return;

  await prisma.$transaction(async (tx) => {
    await tx.ingreso.update({ where: { id: ingresoId }, data: { estado: "ANULADO" } });

    await tx.movimientoBancario.create({
      data: {
        cuentaId: ingreso.cuentaId,
        tipo: "AJUSTE",
        monto: -Number(ingreso.monto),
        descripcion: `Reversión por anulación de ingreso: ${ingreso.descripcion}`,
        ingresoId: ingreso.id,
        registradoPorId: usuario?.id,
      },
    });
  });

  revalidatePath(RUTA);
  revalidatePath("/admin/cuentas");
}
