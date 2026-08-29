// agregar-pago-becas-responsable.js
//
// Actualiza el formulario de inscripción ya publicado (versión 1) sin
// recrearlo desde cero:
//   1. Hace obligatorios los campos de "Autorización en caso de emergencia"
//      (nombre, apellido, parentesco, cédula, teléfono).
//   2. Agrega los datos del Responsable del pago (nombre, apellido, cédula,
//      teléfono, parentesco) a la sección "Responsable económico".
//   3. Agrega la sección "Beca de institución externa (opcional)": casilla
//      + nombre de la institución + carta compromiso adjunta (solo visibles
//      si se marca la casilla).
//   4. Agrega la sección "Método de pago": efectivo en oficina o transferencia
//      bancaria; si elige transferencia, se muestran los datos bancarios del
//      colegio y puede adjuntar el comprobante.
//
// USO: node agregar-pago-becas-responsable.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function crearSeccion(formularioId, orden, titulo, descripcion, preguntas) {
  const seccion = await prisma.formSeccion.create({
    data: { formularioId, orden, titulo, descripcion: descripcion || null },
  });

  const idsPorClave = {};
  let ordenPregunta = 0;
  for (const p of preguntas) {
    const pregunta = await prisma.formPregunta.create({
      data: {
        seccionId: seccion.id,
        clave: p.clave,
        etiqueta: p.etiqueta,
        tipo: p.tipo,
        requerida: !!p.requerida,
        orden: ordenPregunta++,
        placeholder: p.placeholder || null,
        rolSistema: p.rolSistema || null,
      },
    });
    idsPorClave[p.clave] = pregunta.id;

    if (p.opciones) {
      let ordenOpcion = 0;
      for (const o of p.opciones) {
        await prisma.formOpcion.create({
          data: { preguntaId: pregunta.id, valor: o.valor, etiqueta: o.etiqueta, orden: ordenOpcion++ },
        });
      }
    }
  }

  return { seccionId: seccion.id, idsPorClave };
}

async function agregarPreguntas(seccionId, ordenInicial, preguntas) {
  const idsPorClave = {};
  let orden = ordenInicial;
  for (const p of preguntas) {
    const pregunta = await prisma.formPregunta.create({
      data: {
        seccionId,
        clave: p.clave,
        etiqueta: p.etiqueta,
        tipo: p.tipo,
        requerida: !!p.requerida,
        orden: orden++,
        placeholder: p.placeholder || null,
        rolSistema: p.rolSistema || null,
      },
    });
    idsPorClave[p.clave] = pregunta.id;
    if (p.opciones) {
      let ordenOpcion = 0;
      for (const o of p.opciones) {
        await prisma.formOpcion.create({
          data: { preguntaId: pregunta.id, valor: o.valor, etiqueta: o.etiqueta, orden: ordenOpcion++ },
        });
      }
    }
  }
  return idsPorClave;
}

async function main() {
  const formulario = await prisma.formularioVersion.findFirst({ where: { numero: 1 } });
  if (!formulario) {
    console.error("No se encontró la versión 1 del formulario. Corre primero seed-formulario-inscripcion.js");
    process.exit(1);
  }

  // 1. Hacer obligatorios los campos de emergencia -------------------------
  const seccionEmergencia = await prisma.formSeccion.findFirst({
    where: { formularioId: formulario.id, titulo: "Autorización en caso de emergencia" },
  });
  if (seccionEmergencia) {
    const claves = ["emergenciaNombre", "emergenciaApellido", "emergenciaParentesco", "emergenciaCedula", "emergenciaTelefono"];
    const actualizado = await prisma.formPregunta.updateMany({
      where: { seccionId: seccionEmergencia.id, clave: { in: claves } },
      data: { requerida: true },
    });
    console.log(`Emergencia: ${actualizado.count} campos marcados como obligatorios.`);
  } else {
    console.log("No se encontró la sección de emergencia, se omite ese paso.");
  }

  // 2. Responsable del pago -------------------------------------------------
  const seccionResponsable = await prisma.formSeccion.findFirst({
    where: { formularioId: formulario.id, titulo: "Responsable económico" },
  });
  if (seccionResponsable) {
    const existentes = await prisma.formPregunta.count({ where: { seccionId: seccionResponsable.id } });
    await agregarPreguntas(seccionResponsable.id, existentes, [
      { clave: "responsablePagoNombre", etiqueta: "Nombre/s del responsable del pago", tipo: "TEXTO_CORTO", requerida: true, rolSistema: "RESPONSABLE_PAGO_NOMBRE" },
      { clave: "responsablePagoApellido", etiqueta: "Apellido/s del responsable del pago", tipo: "TEXTO_CORTO", requerida: true, rolSistema: "RESPONSABLE_PAGO_APELLIDO" },
      { clave: "responsablePagoCedula", etiqueta: "Cédula del responsable del pago", tipo: "TEXTO_CORTO", requerida: true, rolSistema: "RESPONSABLE_PAGO_CEDULA" },
      { clave: "responsablePagoTelefono", etiqueta: "Teléfono del responsable del pago", tipo: "TEXTO_CORTO", requerida: true, rolSistema: "RESPONSABLE_PAGO_TELEFONO" },
      {
        clave: "responsablePagoParentesco",
        etiqueta: "Relación del responsable del pago con el estudiante",
        tipo: "OPCION_UNICA",
        requerida: true,
        rolSistema: "RESPONSABLE_PAGO_PARENTESCO",
        opciones: [
          { valor: "PADRE", etiqueta: "Padre" },
          { valor: "MADRE", etiqueta: "Madre" },
          { valor: "TUTOR_LEGAL", etiqueta: "Tutor legal" },
          { valor: "OTRO", etiqueta: "Otro familiar" },
        ],
      },
    ]);
    console.log("Responsable del pago: preguntas agregadas a 'Responsable económico'.");
  } else {
    console.log("No se encontró la sección 'Responsable económico', se omite ese paso.");
  }

  // 3. Beca de institución externa ------------------------------------------
  const seccionesExistentes = await prisma.formSeccion.count({ where: { formularioId: formulario.id } });

  const { idsPorClave: idsBeca } = await crearSeccion(
    formulario.id,
    seccionesExistentes,
    "Beca de institución externa (opcional)",
    "Si el estudiante cuenta con una beca otorgada por una fundación, el gobierno, una empresa u otra institución (no por el colegio), indícalo aquí.",
    [
      {
        clave: "tieneBecaExterna",
        etiqueta: "El estudiante cuenta con una beca de una institución externa",
        tipo: "CASILLA",
        rolSistema: "TIENE_BECA_EXTERNA",
      },
      {
        clave: "institucionBecaExterna",
        etiqueta: "Nombre de la institución que otorga la beca",
        tipo: "TEXTO_CORTO",
        rolSistema: "INSTITUCION_BECA_EXTERNA",
      },
      {
        clave: "cartaCompromisoBeca",
        etiqueta: "Carta compromiso de la beca (foto o PDF)",
        tipo: "ARCHIVO",
        rolSistema: "CARTA_COMPROMISO_BECA",
      },
    ]
  );
  for (const clave of ["institucionBecaExterna", "cartaCompromisoBeca"]) {
    await prisma.formCondicion.create({
      data: { preguntaOrigenId: idsBeca.tieneBecaExterna, valorEsperado: "true", preguntaObjetivoId: idsBeca[clave] },
    });
  }
  console.log("Sección 'Beca de institución externa' creada.");

  // 4. Método de pago ---------------------------------------------------------
  const { idsPorClave: idsMetodoPago } = await crearSeccion(
    formulario.id,
    seccionesExistentes + 1,
    "Método de pago",
    null,
    [
      {
        clave: "metodoPagoPreferido",
        etiqueta: "¿Cómo vas a realizar el pago de la matrícula?",
        tipo: "OPCION_UNICA",
        requerida: true,
        rolSistema: "METODO_PAGO",
        opciones: [
          { valor: "EFECTIVO_OFICINA", etiqueta: "Efectivo en oficina" },
          { valor: "TRANSFERENCIA", etiqueta: "Transferencia bancaria" },
        ],
      },
    ]
  );

  const { seccionId: seccionTransferencia, idsPorClave: idsTransferencia } = await crearSeccion(
    formulario.id,
    seccionesExistentes + 2,
    "Datos para transferencia bancaria",
    "CENTRO PEDAGÓGICO JARDÍN DE MI PADRE — DATOS DE PAGO POR TRANSFERENCIA\n" +
      "Banco: Banreservas\n" +
      "Cuenta corriente N°: 9608801782\n" +
      "Nombre de la cuenta: Damaris De Jesús Hernández\n" +
      "Cédula: 001-1015441-6\n" +
      "Por favor, envía tu comprobante de pago al número 809-283-4176.",
    [
      {
        clave: "comprobantePago",
        etiqueta: "Adjunta tu comprobante de pago (foto o PDF)",
        tipo: "ARCHIVO",
        rolSistema: "COMPROBANTE_PAGO",
      },
    ]
  );
  await prisma.formCondicion.create({
    data: {
      preguntaOrigenId: idsMetodoPago.metodoPagoPreferido,
      valorEsperado: "TRANSFERENCIA",
      seccionObjetivoId: seccionTransferencia,
    },
  });
  console.log("Sección 'Método de pago' + 'Datos para transferencia bancaria' creadas.");

  console.log("\nListo. Revisa /admin/formulario-inscripcion para confirmar cómo quedó.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
