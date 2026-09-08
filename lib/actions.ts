"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requierePermiso } from "@/lib/permisos";
import { generarCargosPendientesAhora } from "@/lib/generacion-cargos";
import { notificarResultadoSolicitud, notificarReciboPago, notificarAccesoPortal } from "@/lib/notificaciones";
import { otorgarAccesoTutor } from "@/lib/portal-acceso";
import { crearPagoYFactura } from "@/lib/pagos";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  ConceptoCargo,
  EstadoCargo,
  MetodoPago,
  ParentescoTipo,
  TipoDescuento,
  AplicaA,
  Tanda,
  Prisma,
  EstadoEstudiante,
  TipoPago,
  PlanPago,
} from "@prisma/client";

const CARPETA_UPLOADS = path.join(process.cwd(), "public", "uploads", "sitio");

async function guardarArchivoSiExiste(formData: FormData, campo: string): Promise<string | undefined> {
  const archivo = formData.get(campo) as File | null;
  if (!archivo || archivo.size === 0) return undefined;
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen (jpg, png, webp).");
  }
  await mkdir(CARPETA_UPLOADS, { recursive: true });
  const extension = archivo.name.split(".").pop() || "jpg";
  const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  await writeFile(path.join(CARPETA_UPLOADS, nombreArchivo), Buffer.from(await archivo.arrayBuffer()));
  return `/uploads/sitio/${nombreArchivo}`;
}

async function guardarDocumentoSiExiste(formData: FormData, campo: string): Promise<string | undefined> {
  const archivo = formData.get(campo) as File | null;
  if (!archivo || archivo.size === 0) return undefined;
  const carpeta = path.join(process.cwd(), "public", "uploads", "documentos");
  await mkdir(carpeta, { recursive: true });
  const extension = archivo.name.split(".").pop() || "pdf";
  const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  await writeFile(path.join(carpeta, nombreArchivo), Buffer.from(await archivo.arrayBuffer()));
  return `/uploads/documentos/${nombreArchivo}`;
}

// ---------------------------------------------------------------------------
// GENERADORES DE NÚMERO DE EXPEDIENTE / FACTURA
// ---------------------------------------------------------------------------

async function siguienteNumeroExpedienteEstudiante(tx: Prisma.TransactionClient) {
  const anio = new Date().getFullYear();
  const total = await tx.estudiante.count();
  return `EST-${anio}-${String(total + 1).padStart(6, "0")}`;
}

async function siguienteNumeroExpedienteTutor(tx: Prisma.TransactionClient) {
  const total = await tx.tutor.count();
  return `TUT-${String(total + 1).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// SOLICITUDES DE INSCRIPCIÓN
// ---------------------------------------------------------------------------

export async function aprobarSolicitud(formData: FormData) {
  await requierePermiso("inscripciones", "editar");
  const solicitudId = String(formData.get("solicitudId"));
  const aulaId = formData.get("aulaId") ? String(formData.get("aulaId")) : null;
  const planPago = formData.get("planPago") ? (String(formData.get("planPago")) as PlanPago) : null;
  const confirmarActualizarTutor = formData.get("confirmarActualizarTutor") === "on";

  const solicitud = await prisma.solicitudInscripcion.findUniqueOrThrow({
    where: { id: solicitudId },
  });

  const parentescoContacto: ParentescoTipo =
    (solicitud.relacionContacto as ParentescoTipo | null) ?? ParentescoTipo.TUTOR_LEGAL;

  // Estos campos son opcionales en el schema porque un formulario personalizado
  // podría no incluirlos, pero son obligatorios para crear el tutor/estudiante.
  // Se validan aquí (con mensaje claro) en vez de dejar que Prisma falle a medio
  // camino de la transacción o, peor, guarde un registro con datos vacíos.
  const { nombreTutor, telefonoTutor, emailTutor } = solicitud;
  if (!nombreTutor || !telefonoTutor || !emailTutor) {
    throw new Error(
      "Esta solicitud no tiene completos los datos de contacto (nombre, teléfono o correo del padre/madre/tutor). Complétalos editando la solicitud antes de aprobarla."
    );
  }
  const { nombreEstudiante, apellidoEstudiante, fechaNacimiento } = solicitud;
  if (!nombreEstudiante || !apellidoEstudiante || !fechaNacimiento) {
    throw new Error(
      "Esta solicitud no tiene completos los datos del estudiante (nombre, apellido o fecha de nacimiento). Complétalos antes de aprobarla."
    );
  }

  const resultado = await prisma.$transaction(async (tx) => {
    // 1. Crear o encontrar al tutor por correo (con número de expediente si es nuevo)
    const tutorExistente = await tx.tutor.findUnique({ where: { email: emailTutor } });
    const tutor =
      tutorExistente ??
      (await tx.tutor.create({
        data: {
          numeroExpediente: await siguienteNumeroExpedienteTutor(tx),
          nombre: nombreTutor,
          apellido: "",
          cedula: solicitud.cedulaTutor || undefined,
          telefono: telefonoTutor,
          email: emailTutor,
        },
      }));

    // Si el tutor ya existía: los campos que estaban vacíos se completan solos.
    // Los campos que ya tenían un valor DISTINTO al de esta solicitud (posible
    // conflicto — ¿es la misma persona?) solo se actualizan si el personal
    // confirmó explícitamente que sí lo es.
    if (tutorExistente) {
      const actualizaciones: { cedula?: string; telefono?: string } = {};

      if (!tutorExistente.cedula && solicitud.cedulaTutor) {
        actualizaciones.cedula = solicitud.cedulaTutor;
      } else if (
        confirmarActualizarTutor &&
        solicitud.cedulaTutor &&
        solicitud.cedulaTutor !== tutorExistente.cedula
      ) {
        actualizaciones.cedula = solicitud.cedulaTutor;
      }

      if (!tutorExistente.telefono && solicitud.telefonoTutor) {
        actualizaciones.telefono = solicitud.telefonoTutor;
      } else if (
        confirmarActualizarTutor &&
        solicitud.telefonoTutor &&
        solicitud.telefonoTutor !== tutorExistente.telefono
      ) {
        actualizaciones.telefono = solicitud.telefonoTutor;
      }

      if (Object.keys(actualizaciones).length > 0) {
        await tx.tutor.update({ where: { id: tutor.id }, data: actualizaciones });
      }
    }

    // 2. Compilar la información adicional del formulario en las observaciones
    //    del estudiante, para que el personal la vea sin rebuscar en la solicitud.
    const observaciones = construirObservacionesDesdeSolicitud(solicitud);

    // 3. Crear el estudiante con su número de expediente
    const estudiante = await tx.estudiante.create({
      data: {
        numeroExpediente: await siguienteNumeroExpedienteEstudiante(tx),
        nombre: nombreEstudiante,
        apellido: apellidoEstudiante,
        fechaNacimiento: fechaNacimiento,
        nivelId: solicitud.nivelInteresId,
        gradoId: solicitud.gradoInteresId,
        genero: solicitud.sexo ?? undefined,
        observaciones,
        estado: "ACTIVO",
        tutores: {
          create: {
            tutorId: tutor.id,
            parentesco: parentescoContacto,
            esContactoPrincipal: true,
          },
        },
      },
    });

    // 4. Si eligió cuido, crear la inscripción de cuido
    if (solicitud.interesCuidoId) {
      await tx.inscripcionCuido.create({
        data: {
          estudianteId: estudiante.id,
          programaCuidoId: solicitud.interesCuidoId,
        },
      });
    }

    // 5. Matricularlo en un aula si se seleccionó una (queda como historial académico)
    let anioEscolarId: string | null = null;
    if (aulaId) {
      const aula = await tx.aula.findUniqueOrThrow({
        where: { id: aulaId },
        include: { _count: { select: { matriculas: { where: { estado: "ACTIVA" } } } } },
      });
      if (aula._count.matriculas >= aula.capacidad) {
        throw new Error(
          `El aula "${aula.nombre}" ya alcanzó su cupo máximo (${aula.capacidad}). Elige otra aula o aumenta su cupo antes de aprobar.`
        );
      }
      anioEscolarId = aula.anioEscolarId;
      await tx.matricula.create({
        data: {
          estudianteId: estudiante.id,
          aulaId: aula.id,
          anioEscolarId: aula.anioEscolarId,
          planPago: planPago ?? solicitud.planPago,
        },
      });
    }

    // 6. Generar el cargo inicial de matrícula — si eligió grado, su precio
    //    manda sobre el del nivel.
    if (solicitud.gradoInteresId) {
      const grado = await tx.grado.findUnique({ where: { id: solicitud.gradoInteresId }, include: { nivel: true } });
      if (grado) {
        await tx.cargo.create({
          data: {
            estudianteId: estudiante.id,
            concepto: ConceptoCargo.MATRICULA,
            descripcion: `Matrícula - ${grado.nivel.nombre} ${grado.nombre}`,
            monto: grado.tarifaInscripcion,
            anioEscolarId,
          },
        });
      }
    } else if (solicitud.nivelInteresId) {
      const nivel = await tx.nivel.findUnique({ where: { id: solicitud.nivelInteresId } });
      if (nivel) {
        await tx.cargo.create({
          data: {
            estudianteId: estudiante.id,
            concepto: ConceptoCargo.MATRICULA,
            descripcion: `Matrícula - ${nivel.nombre}`,
            monto: nivel.tarifaInscripcion,
            anioEscolarId,
          },
        });
      }
    }

    // 7. Marcar la solicitud como aprobada
    await tx.solicitudInscripcion.update({
      where: { id: solicitudId },
      data: { estado: "APROBADA", estudianteCreadoId: estudiante.id },
    });

    return { estudiante, tutorId: tutor.id, tutorEsNuevo: !tutorExistente };
  });

  const { tutorId, tutorEsNuevo } = resultado;

  await notificarResultadoSolicitud(emailTutor, `${nombreEstudiante} ${apellidoEstudiante}`, true);

  // Si el tutor es nuevo, se le crea de una vez su acceso al portal de padres.
  if (tutorEsNuevo) {
    const { usuario, passwordPlano } = await otorgarAccesoTutor(tutorId);
    await notificarAccesoPortal({
      email: emailTutor,
      nombre: nombreTutor,
      usuario,
      passwordTemporal: passwordPlano,
    });
  }

  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/estudiantes");
  revalidatePath("/admin/padres");
}

// Compila los campos nuevos del formulario de inscripción (salud, familia,
// emergencia, plan de pago, etc.) en un texto legible para las Observaciones
// del estudiante. Solo incluye lo que realmente se llenó.
function construirObservacionesDesdeSolicitud(
  s: Awaited<ReturnType<typeof prisma.solicitudInscripcion.findUniqueOrThrow>>
): string {
  const lineas: string[] = [];

  if (s.viveCon) lineas.push(`Vive con: ${s.viveCon}`);
  if (s.religion) lineas.push(`Religión: ${s.religion}`);
  if (s.tieneHermanosEnColegio) lineas.push(`Hermanos en el colegio: ${s.numeroHermanos ?? "sí"}`);

  if (s.padeceEnfermedad) lineas.push(`Enfermedad: ${s.especifiqueEnfermedad ?? "sí (sin detalle)"}`);
  if (s.siguiendoProcedimientoMedico)
    lineas.push(`Procedimiento médico en curso: ${s.especifiqueProcedimiento ?? "sí (sin detalle)"}`);
  if (s.tipoSangre) lineas.push(`Tipo de sangre: ${s.tipoSangre}`);
  if (s.alergias) lineas.push(`Alergias: ${s.alergias}`);
  if (s.medicamentos) lineas.push(`Medicamentos: ${s.medicamentos}`);
  if (s.seguroMedico) lineas.push(`Seguro médico: ${s.seguroMedico}`);

  if (s.nombrePadre)
    lineas.push(
      `Padre: ${s.nombrePadre} ${s.apellidoPadre ?? ""} · Tel: ${s.telefonoPadre ?? "-"} · Cédula: ${s.cedulaPadre ?? "-"}`
    );
  if (s.nombreMadre)
    lineas.push(
      `Madre: ${s.nombreMadre} ${s.apellidoMadre ?? ""} · Tel: ${s.telefonoMadre ?? "-"} · Cédula: ${s.cedulaMadre ?? "-"}`
    );
  if (s.tutorLegalNombre)
    lineas.push(
      `Tutor legal: ${s.tutorLegalNombre} ${s.tutorLegalApellido ?? ""} (${s.tutorLegalParentesco ?? "-"}) · Tel: ${s.tutorLegalTelefono ?? "-"}`
    );

  if (s.emergenciaNombre)
    lineas.push(
      `Contacto de emergencia: ${s.emergenciaNombre} ${s.emergenciaApellido ?? ""} (${s.emergenciaParentesco ?? "-"}) · Tel: ${s.emergenciaTelefono ?? s.emergenciaCelular ?? "-"}`
    );
  if (s.personasAutorizadasRetirar)
    lineas.push(`Autorizados a retirar: ${s.personasAutorizadasRetirar}`);

  if (s.colegioProcedencia)
    lineas.push(
      `Colegio de procedencia: ${s.colegioProcedencia}${s.motivoCambioColegio ? " · Motivo: " + s.motivoCambioColegio : ""}`
    );
  if (s.tieneDificultad) {
    const tipos = [
      s.dificultadConducta && "conducta",
      s.dificultadAprendizaje && "aprendizaje",
      s.dificultadDiscapacidad && "discapacidad",
    ].filter(Boolean);
    lineas.push(`Dificultad reportada (${tipos.join(", ")}): ${s.especifiqueDificultad ?? "sin detalle"}`);
  }

  if (s.planPago) lineas.push(`Plan de pago acordado: ${s.planPago}`);
  if (s.tipoEscolaridad) lineas.push(`Tipo de escolaridad: ${s.tipoEscolaridad}`);

  if (s.responsablePagoNombre)
    lineas.push(
      `Responsable del pago: ${s.responsablePagoNombre} ${s.responsablePagoApellido ?? ""} (${s.responsablePagoParentesco ?? "-"}) · Cédula: ${s.responsablePagoCedula ?? "-"} · Tel: ${s.responsablePagoTelefono ?? "-"}`
    );

  if (s.metodoPagoPreferido) {
    const metodo = s.metodoPagoPreferido === "TRANSFERENCIA" ? "Transferencia bancaria" : "Efectivo en oficina";
    lineas.push(`Método de pago elegido: ${metodo}`);
  }
  if (s.comprobantePagoUrl) lineas.push(`Comprobante de pago adjunto: ${s.comprobantePagoUrl}`);

  if (s.tieneBecaExterna) {
    lineas.push(
      `Beca de institución externa: ${s.institucionBecaExterna ?? "sin especificar"}${
        s.cartaCompromisoBecaUrl ? ` · Carta compromiso: ${s.cartaCompromisoBecaUrl}` : ""
      }`
    );
  }

  if (s.comentarios) lineas.push(`Comentarios: ${s.comentarios}`);

  return lineas.length > 0 ? lineas.join("\n") : "";
}

export async function rechazarSolicitud(solicitudId: string) {
  await requierePermiso("inscripciones", "editar");
  const solicitud = await prisma.solicitudInscripcion.update({
    where: { id: solicitudId },
    data: { estado: "RECHAZADA" },
  });

  if (solicitud.emailTutor) {
    const nombreEstudiante =
      [solicitud.nombreEstudiante, solicitud.apellidoEstudiante].filter(Boolean).join(" ") || "el estudiante";
    await notificarResultadoSolicitud(solicitud.emailTutor, nombreEstudiante, false);
  }

  revalidatePath("/admin/solicitudes");
}

// ---------------------------------------------------------------------------
// NIVELES ACADÉMICOS (aquí se define el precio de la matrícula)
// ---------------------------------------------------------------------------

export async function crearNivel(formData: FormData) {
  await requierePermiso("niveles", "crear");
  await prisma.nivel.create({
    data: {
      nombre: String(formData.get("nombre")),
      tarifaInscripcion: Number(formData.get("tarifaInscripcion")),
      colegiaturaAnual: formData.get("colegiaturaAnual") ? Number(formData.get("colegiaturaAnual")) : 0,
      diaPago: formData.get("diaPago") ? Number(formData.get("diaPago")) : 5,
      cupoMaximo: formData.get("cupoMaximo") ? Number(formData.get("cupoMaximo")) : null,
      ordenVisual: formData.get("ordenVisual") ? Number(formData.get("ordenVisual")) : 0,
    },
  });
  revalidatePath("/admin/niveles");
  revalidatePath("/");
}

export async function actualizarNivel(formData: FormData) {
  await requierePermiso("niveles", "editar");
  const nivelId = String(formData.get("nivelId"));
  await prisma.nivel.update({
    where: { id: nivelId },
    data: {
      nombre: String(formData.get("nombre")),
      tarifaInscripcion: Number(formData.get("tarifaInscripcion")),
      colegiaturaAnual: formData.get("colegiaturaAnual") ? Number(formData.get("colegiaturaAnual")) : 0,
      diaPago: formData.get("diaPago") ? Number(formData.get("diaPago")) : 5,
      cupoMaximo: formData.get("cupoMaximo") ? Number(formData.get("cupoMaximo")) : null,
      ordenVisual: formData.get("ordenVisual") ? Number(formData.get("ordenVisual")) : 0,
      activo: formData.get("activo") === "on",
    },
  });
  revalidatePath("/admin/niveles");
  revalidatePath("/");
}

// Edición rápida, solo del monto y el día de cobro, para la pantalla de
// Facturación automática (sin tener que reescribir el resto del nivel).
export async function actualizarColegiaturaNivel(formData: FormData) {
  await requierePermiso("niveles", "editar");
  const nivelId = String(formData.get("nivelId"));
  await prisma.nivel.update({
    where: { id: nivelId },
    data: {
      colegiaturaAnual: Number(formData.get("colegiaturaAnual")) || 0,
      diaPago: Number(formData.get("diaPago")) || 5,
    },
  });
  revalidatePath("/admin/facturacion-automatica");
  revalidatePath("/admin/niveles");
}

// ---------------------------------------------------------------------------
// FACTURACIÓN AUTOMÁTICA (generación de cuotas de colegiatura)
// ---------------------------------------------------------------------------

export async function generarCargosAhora() {
  await requierePermiso("cargos", "crear");
  await generarCargosPendientesAhora();
  revalidatePath("/admin/facturacion-automatica");
  revalidatePath("/admin/cargos");
}

// ---------------------------------------------------------------------------
// PROGRAMAS DE CUIDO
// ---------------------------------------------------------------------------

export async function crearProgramaCuido(formData: FormData) {
  await requierePermiso("cuido", "crear");
  const imagenUrl = await guardarArchivoSiExiste(formData, "foto");

  await prisma.programaCuido.create({
    data: {
      nombre: String(formData.get("nombre")),
      horario: String(formData.get("horario")),
      tarifaMensual: Number(formData.get("tarifaMensual")),
      cupoMaximo: formData.get("cupoMaximo") ? Number(formData.get("cupoMaximo")) : null,
      imagenUrl,
    },
  });
  revalidatePath("/admin/cuido");
  revalidatePath("/");
}

export async function actualizarProgramaCuido(formData: FormData) {
  await requierePermiso("cuido", "editar");
  const programaId = String(formData.get("programaId"));
  const imagenUrl = await guardarArchivoSiExiste(formData, "foto");

  await prisma.programaCuido.update({
    where: { id: programaId },
    data: {
      nombre: String(formData.get("nombre")),
      horario: String(formData.get("horario")),
      tarifaMensual: Number(formData.get("tarifaMensual")),
      cupoMaximo: formData.get("cupoMaximo") ? Number(formData.get("cupoMaximo")) : null,
      activo: formData.get("activo") === "on",
      ...(imagenUrl ? { imagenUrl } : {}),
    },
  });
  revalidatePath("/admin/cuido");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// ACTIVIDADES / CAMPAMENTOS
// ---------------------------------------------------------------------------

export async function crearActividad(formData: FormData) {
  await requierePermiso("actividades", "crear");
  const imagenUrl = await guardarArchivoSiExiste(formData, "foto");

  await prisma.actividad.create({
    data: {
      nombre: String(formData.get("nombre")),
      descripcion: String(formData.get("descripcion") || ""),
      fechaInicio: new Date(String(formData.get("fechaInicio"))),
      fechaFin: new Date(String(formData.get("fechaFin"))),
      tarifa: Number(formData.get("tarifa")),
      cupoMaximo: formData.get("cupoMaximo") ? Number(formData.get("cupoMaximo")) : null,
      imagenUrl,
    },
  });
  revalidatePath("/admin/actividades");
  revalidatePath("/");
}

export async function actualizarActividad(formData: FormData) {
  await requierePermiso("actividades", "editar");
  const actividadId = String(formData.get("actividadId"));
  const imagenUrl = await guardarArchivoSiExiste(formData, "foto");

  await prisma.actividad.update({
    where: { id: actividadId },
    data: {
      nombre: String(formData.get("nombre")),
      descripcion: String(formData.get("descripcion") || ""),
      fechaInicio: new Date(String(formData.get("fechaInicio"))),
      fechaFin: new Date(String(formData.get("fechaFin"))),
      tarifa: Number(formData.get("tarifa")),
      cupoMaximo: formData.get("cupoMaximo") ? Number(formData.get("cupoMaximo")) : null,
      activa: formData.get("activa") === "on",
      ...(imagenUrl ? { imagenUrl } : {}),
    },
  });
  revalidatePath("/admin/actividades");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// ESPECIALES / PROMOCIONES
// ---------------------------------------------------------------------------

export async function crearEspecial(formData: FormData) {
  await requierePermiso("especiales", "crear");
  await prisma.especial.create({
    data: {
      nombre: String(formData.get("nombre")),
      tipoDescuento: String(formData.get("tipoDescuento")) as TipoDescuento,
      valor: Number(formData.get("valor")),
      aplicaA: String(formData.get("aplicaA")) as AplicaA,
      fechaInicio: new Date(String(formData.get("fechaInicio"))),
      fechaFin: new Date(String(formData.get("fechaFin"))),
    },
  });
  revalidatePath("/admin/especiales");
}

export async function actualizarEspecial(formData: FormData) {
  await requierePermiso("especiales", "editar");
  const especialId = String(formData.get("especialId"));
  await prisma.especial.update({
    where: { id: especialId },
    data: {
      nombre: String(formData.get("nombre")),
      tipoDescuento: String(formData.get("tipoDescuento")) as TipoDescuento,
      valor: Number(formData.get("valor")),
      aplicaA: String(formData.get("aplicaA")) as AplicaA,
      fechaInicio: new Date(String(formData.get("fechaInicio"))),
      fechaFin: new Date(String(formData.get("fechaFin"))),
      activo: formData.get("activo") === "on",
    },
  });
  revalidatePath("/admin/especiales");
}

// ---------------------------------------------------------------------------
// CARGOS
// ---------------------------------------------------------------------------

export async function crearCargo(formData: FormData) {
  await requierePermiso("cargos", "crear");
  await prisma.cargo.create({
    data: {
      estudianteId: String(formData.get("estudianteId")),
      concepto: String(formData.get("concepto")) as ConceptoCargo,
      descripcion: String(formData.get("descripcion")),
      monto: Number(formData.get("monto")),
      especialId: formData.get("especialId") ? String(formData.get("especialId")) : null,
    },
  });
  revalidatePath("/admin/cargos");
}

// Un cargo solo se puede editar o anular si todavía NO tiene ningún pago registrado.
// Una vez recibió un pago (y por lo tanto ya generó una factura), se conserva tal cual
// por integridad contable — para corregirlo se anula y se crea uno nuevo.
export async function actualizarCargo(formData: FormData) {
  await requierePermiso("cargos", "editar");
  const cargoId = String(formData.get("cargoId"));
  const cargo = await prisma.cargo.findUniqueOrThrow({ where: { id: cargoId }, include: { pagos: true } });
  if (cargo.pagos.length > 0) {
    throw new Error("Este cargo ya tiene pagos registrados y no se puede editar. Anúlalo y crea uno nuevo si necesitas corregirlo.");
  }
  await prisma.cargo.update({
    where: { id: cargoId },
    data: {
      concepto: String(formData.get("concepto")) as ConceptoCargo,
      descripcion: String(formData.get("descripcion")),
      monto: Number(formData.get("monto")),
      especialId: formData.get("especialId") ? String(formData.get("especialId")) : null,
    },
  });
  revalidatePath("/admin/cargos");
}

export async function anularCargo(formData: FormData) {
  await requierePermiso("cargos", "editar");
  const cargoId = String(formData.get("cargoId"));
  const cargo = await prisma.cargo.findUniqueOrThrow({ where: { id: cargoId }, include: { pagos: true } });
  if (cargo.pagos.length > 0) {
    throw new Error("Este cargo ya tiene pagos registrados y no se puede anular.");
  }
  await prisma.cargo.update({ where: { id: cargoId }, data: { estado: "ANULADO" } });
  revalidatePath("/admin/cargos");
  revalidatePath("/admin/estudiantes");
}

// ---------------------------------------------------------------------------
// COBRO POR CÉDULA DEL TUTOR (varios hijos / varios cargos a la vez)
// ---------------------------------------------------------------------------

export type CargoPendienteInfo = { id: string; descripcion: string; pendiente: number };
export type HijoConCargos = {
  id: string;
  nombre: string;
  apellido: string;
  numeroExpediente: string;
  cargosPendientes: CargoPendienteInfo[];
};
export type GrupoCobro = {
  tutor?: { nombre: string; apellido: string; numeroExpediente: string };
  hijos: HijoConCargos[];
};

export type ResultadoBusquedaCobro = {
  encontrado: boolean;
  mensaje?: string;
  grupos?: GrupoCobro[];
};

function armarHijoConCargos(est: {
  id: string;
  nombre: string;
  apellido: string;
  numeroExpediente: string;
  cargos: { id: string; descripcion: string; monto: Prisma.Decimal; pagos: { monto: Prisma.Decimal }[] }[];
}): HijoConCargos {
  const cargosPendientes = est.cargos.map((c) => {
    const totalPagado = c.pagos.reduce((s, p) => s + Number(p.monto), 0);
    return { id: c.id, descripcion: c.descripcion, pendiente: Number(c.monto) - totalPagado };
  });
  return {
    id: est.id,
    nombre: est.nombre,
    apellido: est.apellido,
    numeroExpediente: est.numeroExpediente,
    cargosPendientes,
  };
}

async function armarGrupoDesdeTutor(tutorId: string): Promise<GrupoCobro> {
  const tutor = await prisma.tutor.findUniqueOrThrow({
    where: { id: tutorId },
    include: {
      estudiantes: {
        include: {
          estudiante: {
            include: {
              cargos: {
                where: { estado: { in: ["PENDIENTE", "PARCIAL"] } },
                include: { pagos: true },
              },
            },
          },
        },
      },
    },
  });

  return {
    tutor: { nombre: tutor.nombre, apellido: tutor.apellido, numeroExpediente: tutor.numeroExpediente },
    hijos: tutor.estudiantes.map((et) => armarHijoConCargos(et.estudiante)),
  };
}

// Si el estudiante encontrado tiene un padre, madre o tutor vinculado, se
// muestran TODOS sus hijos (mismo comportamiento que buscar por cédula). Si
// no tiene ninguno vinculado, se muestra solo él.
async function armarGrupoDesdeEstudiante(estudianteId: string): Promise<GrupoCobro> {
  const tutorVinculo = await prisma.estudianteTutor.findFirst({
    where: { estudianteId },
    orderBy: { esContactoPrincipal: "desc" },
  });
  if (tutorVinculo) return armarGrupoDesdeTutor(tutorVinculo.tutorId);

  const est = await prisma.estudiante.findUniqueOrThrow({
    where: { id: estudianteId },
    include: { cargos: { where: { estado: { in: ["PENDIENTE", "PARCIAL"] } }, include: { pagos: true } } },
  });
  return { hijos: [armarHijoConCargos(est)] };
}

export async function buscarParaCobro(
  _prevState: ResultadoBusquedaCobro,
  formData: FormData
): Promise<ResultadoBusquedaCobro> {
  const busquedaInput = String(formData.get("busqueda") || "").trim();
  if (!busquedaInput) {
    return { encontrado: false, mensaje: "Escribe una cédula, expediente, matrícula o nombre para buscar." };
  }

  // 1. Cédula del padre/madre/tutor — se compara solo por dígitos para que no
  //    importe si se guardó con guiones, espacios, o distinto formato.
  const soloDigitos = (s: string) => s.replace(/\D/g, "");
  const busquedaDigitos = soloDigitos(busquedaInput);
  if (busquedaDigitos) {
    const candidatos = await prisma.tutor.findMany({ where: { cedula: { not: null } } });
    const tutor = candidatos.find((t) => soloDigitos(t.cedula ?? "") === busquedaDigitos);
    if (tutor) return { encontrado: true, grupos: [await armarGrupoDesdeTutor(tutor.id)] };
  }

  // 2. Número de expediente del estudiante
  const porExpediente = await prisma.estudiante.findFirst({
    where: { numeroExpediente: { equals: busquedaInput, mode: "insensitive" } },
  });
  if (porExpediente) return { encontrado: true, grupos: [await armarGrupoDesdeEstudiante(porExpediente.id)] };

  // 3. Número de matrícula MINERD del estudiante
  const porMatricula = await prisma.estudiante.findFirst({
    where: { numeroMatriculaMinerd: { equals: busquedaInput, mode: "insensitive" } },
  });
  if (porMatricula) return { encontrado: true, grupos: [await armarGrupoDesdeEstudiante(porMatricula.id)] };

  // 4. Nombre del padre/madre/tutor o del estudiante (búsqueda parcial, puede
  //    traer varios resultados relacionados — se muestran todos para elegir).
  const [tutoresPorNombre, estudiantesPorNombre] = await Promise.all([
    prisma.tutor.findMany({
      where: {
        OR: [
          { nombre: { contains: busquedaInput, mode: "insensitive" } },
          { apellido: { contains: busquedaInput, mode: "insensitive" } },
        ],
      },
      take: 8,
    }),
    prisma.estudiante.findMany({
      where: {
        OR: [
          { nombre: { contains: busquedaInput, mode: "insensitive" } },
          { apellido: { contains: busquedaInput, mode: "insensitive" } },
        ],
      },
      include: { tutores: { orderBy: { esContactoPrincipal: "desc" } } },
      take: 8,
    }),
  ]);

  const tutorIds = new Set(tutoresPorNombre.map((t) => t.id));
  for (const est of estudiantesPorNombre) {
    const principal = est.tutores[0];
    if (principal) tutorIds.add(principal.tutorId);
  }

  const grupos: GrupoCobro[] = [];
  for (const tutorId of tutorIds) {
    grupos.push(await armarGrupoDesdeTutor(tutorId));
  }
  for (const est of estudiantesPorNombre) {
    if (est.tutores.length === 0) {
      grupos.push(await armarGrupoDesdeEstudiante(est.id));
    }
  }

  if (grupos.length > 0) {
    return { encontrado: true, grupos };
  }

  return {
    encontrado: false,
    mensaje: "No se encontró ningún padre, madre, tutor o estudiante con esos datos.",
  };
}

// Cobra cada cargo seleccionado por el monto que se indique (puede ser el saldo
// completo o un abono parcial) — permite mezclar, ej. pagar completa la matrícula
// de un hijo y solo un abono de la del otro, en una sola operación.
export async function registrarPagosMultiples(formData: FormData) {
  const usuario = await requierePermiso("pagos", "crear");
  const cargoIds = formData.getAll("cargoIds").map(String);
  const metodo = String(formData.get("metodo")) as MetodoPago;
  const referencia = String(formData.get("referencia") || "");
  const notas = String(formData.get("notas") || "");
  const cuentaId = String(formData.get("cuentaId") || "") || null;

  if (cargoIds.length === 0) {
    throw new Error("Selecciona al menos un cargo para cobrar.");
  }

  const pagosRealizados: { estudianteId: string; descripcion: string; monto: number; numeroFactura: string }[] = [];

  await prisma.$transaction(async (tx) => {
    for (const cargoId of cargoIds) {
      const cargo = await tx.cargo.findUniqueOrThrow({ where: { id: cargoId }, include: { pagos: true } });
      const totalPagadoAntes = cargo.pagos.reduce((s, p) => s + Number(p.monto), 0);
      const pendienteReal = Number(cargo.monto) - totalPagadoAntes;
      if (pendienteReal <= 0) continue;

      const montoSolicitado = Number(formData.get(`monto-${cargoId}`)) || 0;
      if (montoSolicitado <= 0) continue;

      // Nunca se cobra de más, aunque el monto pedido sea mayor al saldo real.
      const monto = Math.min(montoSolicitado, pendienteReal);

      const { factura, estudianteId, descripcion } = await crearPagoYFactura(tx, {
        cargoId,
        cuentaId,
        monto,
        metodo,
        referencia,
        notas,
        registradoPorId: usuario.id,
      });

      pagosRealizados.push({
        estudianteId,
        descripcion,
        monto,
        numeroFactura: factura.numeroFactura,
      });
    }
  });

  await Promise.all(pagosRealizados.map((p) => notificarReciboPago(p)));

  revalidatePath("/admin/cargos");
  revalidatePath("/admin/pagos");
  revalidatePath("/admin/estudiantes");
  revalidatePath("/admin/facturas");
  revalidatePath("/admin/cuentas");
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// PAGOS — registro manual individual + generación automática de factura
// ---------------------------------------------------------------------------

export async function registrarPago(formData: FormData) {
  const usuario = await requierePermiso("pagos", "crear");
  const cargoId = String(formData.get("cargoId"));
  const monto = Number(formData.get("monto"));
  const cuentaId = String(formData.get("cuentaId") || "") || null;

  const resultado = await prisma.$transaction(async (tx) => {
    const { factura, estudianteId, descripcion } = await crearPagoYFactura(tx, {
      cargoId,
      cuentaId,
      monto,
      metodo: String(formData.get("metodo")) as MetodoPago,
      referencia: String(formData.get("referencia") || ""),
      notas: String(formData.get("notas") || ""),
      registradoPorId: usuario.id,
    });

    return { estudianteId, descripcion, numeroFactura: factura.numeroFactura };
  });

  await notificarReciboPago({ ...resultado, monto });

  revalidatePath("/admin/cargos");
  revalidatePath("/admin/pagos");
  revalidatePath("/admin/estudiantes");
  revalidatePath("/admin/facturas");
  revalidatePath("/admin/cuentas");
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// OFERTA ACADÉMICA: AÑOS ESCOLARES Y AULAS
// ---------------------------------------------------------------------------

export async function crearAnioEscolar(formData: FormData) {
  await requierePermiso("oferta_academica", "crear");
  const nombre = String(formData.get("nombre"));

  const existente = await prisma.anioEscolar.findUnique({ where: { nombre } });
  if (existente) {
    throw new Error(`Ya existe un año escolar llamado "${nombre}". Edítalo en la lista de arriba en vez de crear uno nuevo.`);
  }

  await prisma.anioEscolar.create({
    data: {
      nombre,
      fechaInicio: new Date(String(formData.get("fechaInicio"))),
      fechaFin: new Date(String(formData.get("fechaFin"))),
    },
  });
  revalidatePath("/admin/aulas");
}

export async function actualizarAnioEscolar(formData: FormData) {
  await requierePermiso("oferta_academica", "editar");
  const anioEscolarId = String(formData.get("anioEscolarId"));
  await prisma.anioEscolar.update({
    where: { id: anioEscolarId },
    data: {
      nombre: String(formData.get("nombre")),
      fechaInicio: new Date(String(formData.get("fechaInicio"))),
      fechaFin: new Date(String(formData.get("fechaFin"))),
      activo: formData.get("activo") === "on",
    },
  });
  revalidatePath("/admin/aulas");
}

export async function crearAula(formData: FormData) {
  await requierePermiso("oferta_academica", "crear");
  await prisma.aula.create({
    data: {
      nombre: String(formData.get("nombre")),
      nivelId: String(formData.get("nivelId")),
      gradoId: String(formData.get("gradoId") || "") || null,
      tanda: String(formData.get("tanda")) as Tanda,
      capacidad: Number(formData.get("capacidad")),
      anioEscolarId: String(formData.get("anioEscolarId")),
    },
  });
  revalidatePath("/admin/aulas");
}

export async function actualizarAula(formData: FormData) {
  await requierePermiso("oferta_academica", "editar");
  const aulaId = String(formData.get("aulaId"));
  await prisma.aula.update({
    where: { id: aulaId },
    data: {
      nombre: String(formData.get("nombre")),
      gradoId: String(formData.get("gradoId") || "") || null,
      capacidad: Number(formData.get("capacidad")),
      activa: formData.get("activa") === "on",
    },
  });
  revalidatePath("/admin/aulas");
  revalidatePath("/admin/estudiantes");
}

// ---------------------------------------------------------------------------
// MATRÍCULA (asignar/cambiar de aula a un estudiante ya activo)
// ---------------------------------------------------------------------------

export async function matricularEstudiante(formData: FormData) {
  await requierePermiso("estudiantes", "editar");
  const estudianteId = String(formData.get("estudianteId"));
  const aulaId = String(formData.get("aulaId"));
  const planPago = formData.get("planPago") ? (String(formData.get("planPago")) as PlanPago) : null;

  const aula = await prisma.aula.findUniqueOrThrow({
    where: { id: aulaId },
    include: { _count: { select: { matriculas: { where: { estado: "ACTIVA" } } } } },
  });

  const yaEstaEnEstaAula = await prisma.matricula.findFirst({
    where: { aulaId, estudianteId, estado: "ACTIVA" },
  });

  if (!yaEstaEnEstaAula && aula._count.matriculas >= aula.capacidad) {
    throw new Error(
      `El aula "${aula.nombre}" ya alcanzó su cupo máximo (${aula.capacidad}). Aumenta el cupo del aula o elige otra.`
    );
  }

  await prisma.matricula.upsert({
    where: {
      estudianteId_anioEscolarId: {
        estudianteId,
        anioEscolarId: aula.anioEscolarId,
      },
    },
    update: { aulaId, estado: "ACTIVA", ...(planPago ? { planPago } : {}) },
    create: {
      estudianteId,
      aulaId,
      anioEscolarId: aula.anioEscolarId,
      planPago,
    },
  });

  revalidatePath(`/admin/estudiantes/${estudianteId}`);
  revalidatePath("/admin/estudiantes");
}

// ---------------------------------------------------------------------------
// BECAS (% de descuento persistente por estudiante)
// ---------------------------------------------------------------------------

export async function asignarBeca(formData: FormData) {
  const usuario = await requierePermiso("becas", "crear");
  const estudianteId = String(formData.get("estudianteId"));
  const porcentaje = Number(formData.get("porcentaje"));
  const motivo = String(formData.get("motivo") || "").trim() || null;
  const esExterna = formData.get("esExterna") === "on";
  const institucionExterna = String(formData.get("institucionExterna") || "").trim() || null;
  const cartaCompromisoUrl = await guardarDocumentoSiExiste(formData, "cartaCompromiso");

  if (!porcentaje || porcentaje <= 0 || porcentaje > 100) {
    throw new Error("El porcentaje de la beca debe estar entre 1 y 100.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.beca.updateMany({
      where: { estudianteId, activa: true },
      data: { activa: false },
    });

    const beca = await tx.beca.create({
      data: {
        estudianteId,
        porcentaje,
        motivo,
        creadaPorId: usuario.id,
        esExterna,
        institucionExterna: esExterna ? institucionExterna : null,
        cartaCompromisoUrl: esExterna ? cartaCompromisoUrl : null,
      },
    });

    // Aplica el descuento a las cuotas ya generadas pero aún no cobradas.
    // Las cuotas que se generen después ya nacen con el descuento aplicado
    // (generarCargosPendientes consulta la beca activa vigente).
    const cargosPendientesSinBeca = await tx.cargo.findMany({
      where: { estudianteId, concepto: "MENSUALIDAD", estado: "PENDIENTE", becaId: null },
    });
    for (const cargo of cargosPendientesSinBeca) {
      await tx.cargo.update({
        where: { id: cargo.id },
        data: { monto: Number(cargo.monto) * (1 - porcentaje / 100), becaId: beca.id },
      });
    }
  });

  revalidatePath(`/admin/estudiantes/${estudianteId}`);
}

export async function revocarBeca(formData: FormData) {
  await requierePermiso("becas", "editar");
  const becaId = String(formData.get("becaId"));
  const beca = await prisma.beca.update({ where: { id: becaId }, data: { activa: false } });
  revalidatePath(`/admin/estudiantes/${beca.estudianteId}`);
}

// ---------------------------------------------------------------------------
// EDITAR DATOS DE ESTUDIANTE Y TUTOR
// ---------------------------------------------------------------------------

export async function actualizarEstudiante(formData: FormData) {
  await requierePermiso("estudiantes", "editar");
  const estudianteId = String(formData.get("estudianteId"));
  const aulaId = formData.get("aulaId") ? String(formData.get("aulaId")) : null;

  await prisma.estudiante.update({
    where: { id: estudianteId },
    data: {
      nombre: String(formData.get("nombre")),
      apellido: String(formData.get("apellido")),
      fechaNacimiento: new Date(String(formData.get("fechaNacimiento"))),
      cedulaONum: String(formData.get("cedulaONum") || "") || null,
      nivelId: formData.get("nivelId") ? String(formData.get("nivelId")) : null,
      estado: String(formData.get("estado")) as EstadoEstudiante,
      numeroMatriculaMinerd: String(formData.get("numeroMatriculaMinerd") || "") || null,
      observaciones: String(formData.get("observaciones") || "") || null,
    },
  });

  // Si se eligió un aula (normalmente porque cambió el nivel), actualiza
  // también su matrícula del año escolar correspondiente — así el nivel del
  // expediente y el nivel real (el de Historial académico) quedan sincronizados.
  if (aulaId) {
    const aula = await prisma.aula.findUniqueOrThrow({
      where: { id: aulaId },
      include: { _count: { select: { matriculas: { where: { estado: "ACTIVA" } } } } },
    });
    const yaEstaEnEstaAula = await prisma.matricula.findFirst({
      where: { aulaId, estudianteId, estado: "ACTIVA" },
    });
    if (!yaEstaEnEstaAula && aula._count.matriculas >= aula.capacidad) {
      throw new Error(
        `El aula "${aula.nombre}" ya alcanzó su cupo máximo (${aula.capacidad}). Aumenta el cupo del aula o elige otra.`
      );
    }
    await prisma.matricula.upsert({
      where: { estudianteId_anioEscolarId: { estudianteId, anioEscolarId: aula.anioEscolarId } },
      update: { aulaId, estado: "ACTIVA" },
      create: { estudianteId, aulaId, anioEscolarId: aula.anioEscolarId },
    });
  }

  revalidatePath(`/admin/estudiantes/${estudianteId}`);
  revalidatePath("/admin/estudiantes");
}

export async function actualizarTutor(formData: FormData) {
  await requierePermiso("padres", "editar");
  const tutorId = String(formData.get("tutorId"));
  await prisma.tutor.update({
    where: { id: tutorId },
    data: {
      nombre: String(formData.get("nombre")),
      apellido: String(formData.get("apellido")),
      cedula: String(formData.get("cedula") || "") || null,
      telefono: String(formData.get("telefono")),
      telefonoAlt: String(formData.get("telefonoAlt") || "") || null,
      email: String(formData.get("email")),
      direccion: String(formData.get("direccion") || "") || null,
      ocupacion: String(formData.get("ocupacion") || "") || null,
    },
  });
  revalidatePath("/admin/padres");
  revalidatePath("/admin/estudiantes");
}

// Genera (o regenera) la contraseña de acceso al portal de un tutor y le
// reenvía el correo con las credenciales. Sirve para tutores que quedaron
// sin acceso (creados antes de este sistema) o que perdieron su contraseña.
export async function otorgarAccesoTutorManual(formData: FormData) {
  await requierePermiso("padres", "editar");
  const tutorId = String(formData.get("tutorId"));

  const tutor = await prisma.tutor.findUniqueOrThrow({ where: { id: tutorId } });
  const { usuario, passwordPlano } = await otorgarAccesoTutor(tutorId);
  await notificarAccesoPortal({
    email: tutor.email,
    nombre: tutor.nombre,
    usuario,
    passwordTemporal: passwordPlano,
  });

  revalidatePath("/admin/padres");
}

// ---------------------------------------------------------------------------
// ANULAR FACTURA (no se edita ni se borra — se anula, para conservar el historial)
// ---------------------------------------------------------------------------

export async function anularFactura(formData: FormData) {
  await requierePermiso("facturas", "editar");
  const facturaId = String(formData.get("facturaId"));
  await prisma.factura.update({ where: { id: facturaId }, data: { anulada: true } });
  revalidatePath("/admin/facturas");
}
