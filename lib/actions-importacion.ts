"use server";

import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requierePermiso } from "@/lib/permisos";
import { ParentescoTipo } from "@prisma/client";
import { otorgarAccesoTutor, otorgarAccesoAdminUser } from "@/lib/portal-acceso";
import { notificarAccesoPortal, notificarAccesoPanel } from "@/lib/notificaciones";

// ---------------------------------------------------------------------------
// CARGA MASIVA DE PADRES Y MAESTROS (vía archivo .xlsx/.csv)
// ---------------------------------------------------------------------------

export type FilaResultado = { fila: number; ok: boolean; mensaje: string };
export type ResultadoImportacion = { procesado: boolean; filas: FilaResultado[] };

export const estadoInicialImportacion: ResultadoImportacion = { procesado: false, filas: [] };

function leerFilas(archivo: File): Promise<Record<string, unknown>[]> {
  return archivo.arrayBuffer().then((buf) => {
    const wb = XLSX.read(Buffer.from(buf), { type: "buffer" });
    const hoja = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: "" });
  });
}

function texto(fila: Record<string, unknown>, clave: string): string {
  return String(fila[clave] ?? "").trim();
}

export async function importarTutoresMasivo(
  _prevState: ResultadoImportacion,
  formData: FormData
): Promise<ResultadoImportacion> {
  await requierePermiso("padres", "crear");
  const archivo = formData.get("archivo") as File | null;
  if (!archivo || archivo.size === 0) {
    return { procesado: true, filas: [{ fila: 0, ok: false, mensaje: "No se seleccionó ningún archivo." }] };
  }

  const filas = await leerFilas(archivo);
  const resultados: FilaResultado[] = [];

  for (let i = 0; i < filas.length; i++) {
    const numeroFila = i + 2; // fila 1 = encabezado
    const fila = filas[i];
    try {
      const cedula = texto(fila, "Cedula");
      const nombre = texto(fila, "Nombre");
      const apellido = texto(fila, "Apellido");
      const telefono = texto(fila, "Telefono");
      const email = texto(fila, "Email");
      const expediente = texto(fila, "ExpedienteEstudiante");
      const parentescoTexto = texto(fila, "Parentesco").toUpperCase();

      if (!nombre || !email || !telefono) {
        throw new Error("Nombre, Email y Telefono son obligatorios.");
      }

      const parentesco = (Object.values(ParentescoTipo) as string[]).includes(parentescoTexto)
        ? (parentescoTexto as ParentescoTipo)
        : ParentescoTipo.TUTOR_LEGAL;

      const estudiante = expediente
        ? await prisma.estudiante.findUnique({ where: { numeroExpediente: expediente } })
        : null;
      if (expediente && !estudiante) {
        throw new Error(`No existe ningún estudiante con expediente "${expediente}".`);
      }

      const existente = await prisma.tutor.findUnique({ where: { email } });
      let tutorId: string;
      let esNuevo = false;

      if (existente) {
        tutorId = existente.id;
        await prisma.tutor.update({
          where: { id: tutorId },
          data: {
            cedula: existente.cedula || cedula || undefined,
            telefono: existente.telefono || telefono,
          },
        });
      } else {
        const total = await prisma.tutor.count();
        const nuevo = await prisma.tutor.create({
          data: {
            numeroExpediente: `TUT-${String(total + 1).padStart(6, "0")}`,
            nombre,
            apellido,
            cedula: cedula || undefined,
            telefono,
            email,
          },
        });
        tutorId = nuevo.id;
        esNuevo = true;
      }

      if (estudiante) {
        await prisma.estudianteTutor.upsert({
          where: { estudianteId_tutorId: { estudianteId: estudiante.id, tutorId } },
          update: {},
          create: { estudianteId: estudiante.id, tutorId, parentesco },
        });
      }

      if (esNuevo) {
        const { usuario, passwordPlano } = await otorgarAccesoTutor(tutorId);
        await notificarAccesoPortal({ email, nombre, usuario, passwordTemporal: passwordPlano });
      }

      resultados.push({
        fila: numeroFila,
        ok: true,
        mensaje: esNuevo ? "Tutor creado y acceso al portal enviado por correo." : "Tutor ya existía, datos actualizados.",
      });
    } catch (error) {
      resultados.push({
        fila: numeroFila,
        ok: false,
        mensaje: error instanceof Error ? error.message : "Error desconocido.",
      });
    }
  }

  revalidatePath("/admin/padres");
  return { procesado: true, filas: resultados };
}

export async function importarDocentesMasivo(
  _prevState: ResultadoImportacion,
  formData: FormData
): Promise<ResultadoImportacion> {
  await requierePermiso("usuarios", "crear");
  const archivo = formData.get("archivo") as File | null;
  if (!archivo || archivo.size === 0) {
    return { procesado: true, filas: [{ fila: 0, ok: false, mensaje: "No se seleccionó ningún archivo." }] };
  }

  const filas = await leerFilas(archivo);
  const resultados: FilaResultado[] = [];

  for (let i = 0; i < filas.length; i++) {
    const numeroFila = i + 2;
    const fila = filas[i];
    try {
      const cedula = texto(fila, "Cedula");
      const nombre = texto(fila, "Nombre");
      const email = texto(fila, "Email");
      const rolNombre = texto(fila, "RolNombre").toUpperCase();

      if (!nombre || !email || !rolNombre) {
        throw new Error("Nombre, Email y RolNombre son obligatorios.");
      }

      const role = await prisma.role.findUnique({ where: { nombre: rolNombre } });
      if (!role) {
        throw new Error(`No existe el rol "${rolNombre}".`);
      }

      const existente = await prisma.adminUser.findUnique({ where: { email } });
      if (existente) {
        resultados.push({ fila: numeroFila, ok: false, mensaje: "Ya existe un usuario con ese correo, se omitió." });
        continue;
      }

      // Password provisional al crear (no nulo en el schema); se reemplaza de
      // inmediato por la contraseña temporal real vía otorgarAccesoAdminUser.
      const nuevo = await prisma.adminUser.create({
        data: {
          nombre,
          email,
          cedula: cedula || undefined,
          roleId: role.id,
          passwordHash: await bcrypt.hash(crypto.randomBytes(8).toString("hex"), 10),
        },
      });

      const { usuario, passwordPlano } = await otorgarAccesoAdminUser(nuevo.id);
      await notificarAccesoPanel({ email, nombre, usuario, passwordTemporal: passwordPlano, rol: role.nombre });

      resultados.push({ fila: numeroFila, ok: true, mensaje: "Usuario creado y acceso enviado por correo." });
    } catch (error) {
      resultados.push({
        fila: numeroFila,
        ok: false,
        mensaje: error instanceof Error ? error.message : "Error desconocido.",
      });
    }
  }

  revalidatePath("/admin/usuarios");
  return { procesado: true, filas: resultados };
}
