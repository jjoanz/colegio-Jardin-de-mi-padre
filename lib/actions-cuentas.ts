"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TipoMovimientoBancario } from "@prisma/client";

const RUTA = "/admin/cuentas";

export async function crearCuenta(formData: FormData) {
  await prisma.cuentaBancaria.create({
    data: {
      nombre: String(formData.get("nombre")),
      banco: String(formData.get("banco")),
      numeroCuenta: String(formData.get("numeroCuenta") || "") || null,
      tipoCuenta: String(formData.get("tipoCuenta") || "") || null,
      moneda: String(formData.get("moneda") || "DOP"),
      balanceInicial: Number(formData.get("balanceInicial") || 0),
    },
  });
  revalidatePath(RUTA);
}

export async function actualizarCuenta(formData: FormData) {
  const cuentaId = String(formData.get("cuentaId"));
  await prisma.cuentaBancaria.update({
    where: { id: cuentaId },
    data: {
      nombre: String(formData.get("nombre")),
      banco: String(formData.get("banco")),
      numeroCuenta: String(formData.get("numeroCuenta") || "") || null,
      tipoCuenta: String(formData.get("tipoCuenta") || "") || null,
      moneda: String(formData.get("moneda") || "DOP"),
      activa: formData.get("activa") === "on",
    },
  });
  revalidatePath(RUTA);
}

// Los movimientos no se editan ni se borran una vez creados (integridad del
// libro de movimientos) — para corregir un error se registra un movimiento
// de tipo AJUSTE que compense la diferencia.
export async function registrarMovimiento(formData: FormData) {
  const session = await auth();
  const usuario = session?.user as { id?: string } | undefined;

  await prisma.movimientoBancario.create({
    data: {
      cuentaId: String(formData.get("cuentaId")),
      tipo: String(formData.get("tipo")) as TipoMovimientoBancario,
      monto: Number(formData.get("monto")),
      descripcion: String(formData.get("descripcion")),
      fecha: new Date(String(formData.get("fecha"))),
      referencia: String(formData.get("referencia") || "") || null,
      registradoPorId: usuario?.id,
    },
  });
  revalidatePath(RUTA);
}
