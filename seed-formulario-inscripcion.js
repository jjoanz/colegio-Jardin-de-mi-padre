// seed-formulario-inscripcion.js
//
// Crea la "versión 1" del formulario de inscripción dentro del nuevo sistema
// de constructor de formularios, replicando exactamente las secciones y
// preguntas que ya tenías, y la marca como PUBLICADA.
//
// USO: node seed-formulario-inscripcion.js

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
          data: {
            preguntaId: pregunta.id,
            valor: o.valor,
            etiqueta: o.etiqueta,
            orden: ordenOpcion++,
          },
        });
      }
    }
  }

  return { seccionId: seccion.id, idsPorClave };
}

async function main() {
  const existente = await prisma.formularioVersion.findFirst({ where: { numero: 1 } });
  if (existente) {
    console.log("La versión 1 ya existe, no se vuelve a crear. Borra la fila en FormularioVersion si quieres regenerarla.");
    return;
  }

  const formulario = await prisma.formularioVersion.create({
    data: { numero: 1, estado: "PUBLICADO", publicadoEn: new Date() },
  });

  // 1. Datos del niño/a
  await crearSeccion(formulario.id, 0, "Datos del niño/a", null, [
    { clave: "nombreEstudiante", etiqueta: "Nombre/s", tipo: "TEXTO_CORTO", requerida: true, rolSistema: "NOMBRE_ESTUDIANTE" },
    { clave: "apellidoEstudiante", etiqueta: "Apellido/s", tipo: "TEXTO_CORTO", requerida: true, rolSistema: "APELLIDO_ESTUDIANTE" },
    { clave: "fechaNacimiento", etiqueta: "Fecha de nacimiento", tipo: "FECHA", requerida: true, rolSistema: "FECHA_NACIMIENTO_ESTUDIANTE" },
    { clave: "sexo", etiqueta: "Sexo", tipo: "OPCION_UNICA", opciones: [{ valor: "MASCULINO", etiqueta: "Masculino" }, { valor: "FEMENINO", etiqueta: "Femenino" }] },
    { clave: "nacionalidad", etiqueta: "Nacionalidad", tipo: "TEXTO_CORTO" },
    { clave: "lugarNacimiento", etiqueta: "Lugar de nacimiento", tipo: "TEXTO_CORTO" },
    { clave: "nivelInteresId", etiqueta: "Nivel para el que solicita", tipo: "SELECT_NIVEL", rolSistema: "NIVEL_INTERES" },
  ]);

  // 2. Acta de nacimiento
  await crearSeccion(formulario.id, 1, "Acta de nacimiento", null, [
    { clave: "oficialiaActa", etiqueta: "Oficialía", tipo: "TEXTO_CORTO" },
    { clave: "libroActa", etiqueta: "Libro", tipo: "TEXTO_CORTO" },
    { clave: "folioActa", etiqueta: "Folio", tipo: "TEXTO_CORTO" },
    { clave: "numeroActa", etiqueta: "Número de acta", tipo: "TEXTO_CORTO" },
    { clave: "anioActa", etiqueta: "Año", tipo: "TEXTO_CORTO" },
  ]);

  // 3. Dirección y hogar
  await crearSeccion(formulario.id, 2, "Dirección y hogar", null, [
    { clave: "direccionEstudiante", etiqueta: "Dirección", tipo: "TEXTO_CORTO" },
    { clave: "telefonoEstudiante", etiqueta: "Teléfono", tipo: "TEXTO_CORTO" },
    { clave: "celularEstudiante", etiqueta: "Celular", tipo: "TEXTO_CORTO" },
    {
      clave: "viveCon",
      etiqueta: "Vive con",
      tipo: "OPCION_UNICA",
      opciones: [
        { valor: "AMBOS_PADRES", etiqueta: "Ambos padres" },
        { valor: "MADRE", etiqueta: "Madre" },
        { valor: "PADRE", etiqueta: "Padre" },
        { valor: "TUTOR", etiqueta: "Tutor" },
        { valor: "OTRO", etiqueta: "Otro" },
      ],
    },
    { clave: "religion", etiqueta: "Religión que profesa", tipo: "TEXTO_CORTO" },
    { clave: "tieneHermanosEnColegio", etiqueta: "Tiene hermanos actualmente en el colegio", tipo: "CASILLA" },
    { clave: "numeroHermanos", etiqueta: "Número de hermanos en el colegio", tipo: "TEXTO_CORTO" },
  ]);

  // 4. Salud
  const s4 = await crearSeccion(formulario.id, 3, "Datos de salud", null, [
    { clave: "seguroMedico", etiqueta: "Seguro médico", tipo: "TEXTO_CORTO" },
    { clave: "tipoSangre", etiqueta: "Tipo de sangre", tipo: "TEXTO_CORTO" },
    { clave: "alergias", etiqueta: "Alergias", tipo: "TEXTO_LARGO" },
    { clave: "medicamentos", etiqueta: "Medicamentos que utiliza", tipo: "TEXTO_LARGO" },
    { clave: "padeceEnfermedad", etiqueta: "¿Padece alguna enfermedad?", tipo: "CASILLA" },
    { clave: "especifiqueEnfermedad", etiqueta: "Especifique (enfermedad)", tipo: "TEXTO_CORTO" },
    { clave: "siguiendoProcedimientoMedico", etiqueta: "¿Está siguiendo algún procedimiento médico?", tipo: "CASILLA" },
    { clave: "especifiqueProcedimiento", etiqueta: "Especifique (procedimiento)", tipo: "TEXTO_CORTO" },
  ]);
  await prisma.formCondicion.create({
    data: { preguntaOrigenId: s4.idsPorClave.padeceEnfermedad, valorEsperado: "true", preguntaObjetivoId: s4.idsPorClave.especifiqueEnfermedad },
  });
  await prisma.formCondicion.create({
    data: { preguntaOrigenId: s4.idsPorClave.siguiendoProcedimientoMedico, valorEsperado: "true", preguntaObjetivoId: s4.idsPorClave.especifiqueProcedimiento },
  });

  // 5. Contacto principal
  await crearSeccion(formulario.id, 4, "Persona que llena esta solicitud", null, [
    {
      clave: "relacionContacto",
      etiqueta: "Parentesco con el estudiante",
      tipo: "OPCION_UNICA",
      opciones: [
        { valor: "PADRE", etiqueta: "Padre" },
        { valor: "MADRE", etiqueta: "Madre" },
        { valor: "TUTOR_LEGAL", etiqueta: "Tutor legal" },
        { valor: "OTRO", etiqueta: "Otro" },
      ],
    },
    { clave: "nombreTutor", etiqueta: "Nombre completo", tipo: "TEXTO_CORTO", requerida: true, rolSistema: "NOMBRE_CONTACTO" },
    { clave: "cedulaTutor", etiqueta: "Cédula", tipo: "TEXTO_CORTO", rolSistema: "CEDULA_CONTACTO" },
    { clave: "telefonoTutor", etiqueta: "Teléfono", tipo: "TEXTO_CORTO", requerida: true, rolSistema: "TELEFONO_CONTACTO" },
    { clave: "emailTutor", etiqueta: "Correo electrónico", tipo: "TEXTO_CORTO", requerida: true, rolSistema: "EMAIL_CONTACTO" },
  ]);

  // 6. Padre
  await crearSeccion(formulario.id, 5, "Datos del padre (si aplica)", null, [
    { clave: "nombrePadre", etiqueta: "Nombre/s", tipo: "TEXTO_CORTO" },
    { clave: "apellidoPadre", etiqueta: "Apellido/s", tipo: "TEXTO_CORTO" },
    { clave: "cedulaPadre", etiqueta: "Cédula", tipo: "TEXTO_CORTO" },
    { clave: "profesionPadre", etiqueta: "Profesión", tipo: "TEXTO_CORTO" },
    { clave: "telefonoPadre", etiqueta: "Teléfono", tipo: "TEXTO_CORTO" },
    { clave: "celularPadre", etiqueta: "Celular", tipo: "TEXTO_CORTO" },
    { clave: "telefonoTrabajoPadre", etiqueta: "Teléfono de trabajo", tipo: "TEXTO_CORTO" },
  ]);

  // 7. Madre
  await crearSeccion(formulario.id, 6, "Datos de la madre (si aplica)", null, [
    { clave: "nombreMadre", etiqueta: "Nombre/s", tipo: "TEXTO_CORTO" },
    { clave: "apellidoMadre", etiqueta: "Apellido/s", tipo: "TEXTO_CORTO" },
    { clave: "cedulaMadre", etiqueta: "Cédula", tipo: "TEXTO_CORTO" },
    { clave: "profesionMadre", etiqueta: "Profesión", tipo: "TEXTO_CORTO" },
    { clave: "telefonoMadre", etiqueta: "Teléfono", tipo: "TEXTO_CORTO" },
    { clave: "celularMadre", etiqueta: "Celular", tipo: "TEXTO_CORTO" },
    { clave: "telefonoTrabajoMadre", etiqueta: "Teléfono de trabajo", tipo: "TEXTO_CORTO" },
  ]);

  // 8. Tutor legal (condicional a viveCon = TUTOR u OTRO)
  const seccionTutor = await prisma.formSeccion.create({
    data: { formularioId: formulario.id, orden: 7, titulo: "Datos del tutor (el niño/a no vive con sus padres)" },
  });
  const preguntasTutor = [
    { clave: "tutorLegalNombre", etiqueta: "Nombre/s", tipo: "TEXTO_CORTO" },
    { clave: "tutorLegalApellido", etiqueta: "Apellido/s", tipo: "TEXTO_CORTO" },
    { clave: "tutorLegalParentesco", etiqueta: "Parentesco", tipo: "TEXTO_CORTO" },
    { clave: "tutorLegalCedula", etiqueta: "Cédula", tipo: "TEXTO_CORTO" },
    { clave: "tutorLegalTelefono", etiqueta: "Teléfono", tipo: "TEXTO_CORTO" },
  ];
  let ordenT = 0;
  for (const p of preguntasTutor) {
    await prisma.formPregunta.create({
      data: { seccionId: seccionTutor.id, clave: p.clave, etiqueta: p.etiqueta, tipo: p.tipo, orden: ordenT++ },
    });
  }
  const preguntaViveCon = await prisma.formPregunta.findFirst({ where: { clave: "viveCon" } });
  if (preguntaViveCon) {
    await prisma.formCondicion.create({
      data: { preguntaOrigenId: preguntaViveCon.id, valorEsperado: "TUTOR", seccionObjetivoId: seccionTutor.id },
    });
    await prisma.formCondicion.create({
      data: { preguntaOrigenId: preguntaViveCon.id, valorEsperado: "OTRO", seccionObjetivoId: seccionTutor.id },
    });
  }

  // 9. Emergencia
  await crearSeccion(formulario.id, 8, "Autorización en caso de emergencia", null, [
    { clave: "emergenciaNombre", etiqueta: "Nombre/s", tipo: "TEXTO_CORTO" },
    { clave: "emergenciaApellido", etiqueta: "Apellido/s", tipo: "TEXTO_CORTO" },
    { clave: "emergenciaParentesco", etiqueta: "Parentesco", tipo: "TEXTO_CORTO" },
    { clave: "emergenciaCedula", etiqueta: "Cédula", tipo: "TEXTO_CORTO" },
    { clave: "emergenciaTelefono", etiqueta: "Teléfono", tipo: "TEXTO_CORTO" },
    { clave: "emergenciaCelular", etiqueta: "Celular", tipo: "TEXTO_CORTO" },
    { clave: "personasAutorizadasRetirar", etiqueta: "Personas autorizadas a retirar al estudiante", tipo: "TEXTO_LARGO" },
  ]);

  // 10. Académico (con condicionales)
  const s10 = await crearSeccion(formulario.id, 9, "Información académica", null, [
    { clave: "esNuevoIngreso", etiqueta: "Es un estudiante de nuevo ingreso", tipo: "CASILLA" },
    { clave: "colegioProcedencia", etiqueta: "Colegio de procedencia", tipo: "TEXTO_CORTO" },
    { clave: "ultimoGradoCursado", etiqueta: "Último grado cursado", tipo: "TEXTO_CORTO" },
    { clave: "motivoCambioColegio", etiqueta: "¿Por qué cambio de colegio?", tipo: "TEXTO_LARGO" },
    { clave: "tieneDificultad", etiqueta: "¿Tiene el niño/a alguna dificultad?", tipo: "CASILLA" },
    { clave: "dificultadConducta", etiqueta: "Dificultad de conducta", tipo: "CASILLA" },
    { clave: "dificultadAprendizaje", etiqueta: "Dificultad de aprendizaje", tipo: "CASILLA" },
    { clave: "dificultadDiscapacidad", etiqueta: "Discapacidad", tipo: "CASILLA" },
    { clave: "especifiqueDificultad", etiqueta: "Especifique la dificultad", tipo: "TEXTO_LARGO" },
    { clave: "fechaEvaluacion", etiqueta: "Fecha de evaluación (si aplica)", tipo: "FECHA" },
  ]);
  for (const clave of ["colegioProcedencia", "ultimoGradoCursado", "motivoCambioColegio"]) {
    await prisma.formCondicion.create({
      data: { preguntaOrigenId: s10.idsPorClave.esNuevoIngreso, valorEsperado: "true", preguntaObjetivoId: s10.idsPorClave[clave] },
    });
  }
  for (const clave of ["dificultadConducta", "dificultadAprendizaje", "dificultadDiscapacidad", "especifiqueDificultad", "fechaEvaluacion"]) {
    await prisma.formCondicion.create({
      data: { preguntaOrigenId: s10.idsPorClave.tieneDificultad, valorEsperado: "true", preguntaObjetivoId: s10.idsPorClave[clave] },
    });
  }

  // 11. Referencias
  await crearSeccion(formulario.id, 10, "Referencias personales", null, [
    { clave: "referencia1Nombre", etiqueta: "Nombre (referencia 1)", tipo: "TEXTO_CORTO" },
    { clave: "referencia1Telefono", etiqueta: "Teléfono (referencia 1)", tipo: "TEXTO_CORTO" },
    { clave: "referencia2Nombre", etiqueta: "Nombre (referencia 2)", tipo: "TEXTO_CORTO" },
    { clave: "referencia2Telefono", etiqueta: "Teléfono (referencia 2)", tipo: "TEXTO_CORTO" },
  ]);

  // 12. Plan de pago
  await crearSeccion(formulario.id, 11, "Responsable económico", null, [
    {
      clave: "planPago",
      etiqueta: "Plan de pago",
      tipo: "OPCION_UNICA",
      opciones: [
        { valor: "PAGO_UNICO", etiqueta: "Plan A — 1 único pago" },
        { valor: "DOS_PAGOS", etiqueta: "Plan B — 2 pagos" },
        { valor: "DIEZ_CUOTAS", etiqueta: "Plan C — 10 cuotas mensuales" },
      ],
    },
    {
      clave: "tipoEscolaridad",
      etiqueta: "Tipo de escolaridad",
      tipo: "OPCION_UNICA",
      opciones: [
        { valor: "SOLO_ESCOLARIDAD", etiqueta: "Solo escolaridad" },
        { valor: "ESCOLARIDAD_ALMUERZO", etiqueta: "Escolaridad y almuerzo" },
        { valor: "ESCOLARIDAD_ALMUERZO_HORARIO_EXTENDIDO", etiqueta: "Escolaridad, almuerzo y horario extendido" },
      ],
    },
  ]);

  // 13. Programas adicionales
  await crearSeccion(formulario.id, 12, "Programas adicionales (opcional)", null, [
    { clave: "interesCuidoId", etiqueta: "Programa de cuido", tipo: "SELECT_CUIDO" },
    { clave: "comentarios", etiqueta: "Comentarios adicionales", tipo: "TEXTO_LARGO" },
  ]);

  // 14. Autorizaciones
  await crearSeccion(formulario.id, 13, "Autorizaciones", null, [
    { clave: "autorizaAtencionMedica", etiqueta: "Autorizo la atención médica de emergencia para mi hijo/a en caso de ser necesario", tipo: "CASILLA", requerida: true },
    { clave: "autorizaUsoImagenes", etiqueta: "Autorizo el uso de fotografías o videos institucionales de mi hijo/a", tipo: "CASILLA" },
    { clave: "aceptaReglamento", etiqueta: "Acepto el reglamento interno del centro", tipo: "CASILLA", requerida: true },
  ]);

  console.log(`Formulario versión 1 creado y publicado (id: ${formulario.id}).`);
  console.log("Ya puedes ir a /admin/formulario-inscripcion para editarlo.");
}

main()
  .catch((e) => {
    console.error("Error sembrando el formulario:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
