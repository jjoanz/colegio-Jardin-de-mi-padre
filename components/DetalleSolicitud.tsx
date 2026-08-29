import type { SolicitudInscripcion, FormularioVersion, FormSeccion, FormPregunta, FormOpcion } from "@prisma/client";

type FormularioCompleto = FormularioVersion & {
  secciones: (FormSeccion & {
    preguntas: (FormPregunta & { opciones: FormOpcion[] })[];
  })[];
};

type Props = {
  solicitud: SolicitudInscripcion & { formularioVersion: FormularioCompleto | null };
};

// Muestra toda la información capturada en la solicitud, antes de aprobarla.
// Si la solicitud viene de un formulario dinámico personalizado, recorre sus
// secciones/preguntas y traduce las respuestas guardadas en `respuestas`
// (JSON keyed por la clave de cada pregunta). Si es una solicitud vieja sin
// formulario dinámico asociado, muestra los campos fijos agrupados a mano.
export function DetalleSolicitud({ solicitud: s }: Props) {
  if (s.formularioVersion) {
    const respuestas = (s.respuestas as Record<string, unknown> | null) ?? {};
    return (
      <div className="space-y-4">
        {s.formularioVersion.secciones.map((seccion) => {
          const filas = seccion.preguntas
            .map((p) => ({ pregunta: p, valor: formatearRespuesta(p, respuestas[p.clave]) }))
            .filter((f) => f.valor !== null);
          if (filas.length === 0) return null;
          return (
            <div key={seccion.id}>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                {seccion.titulo}
              </p>
              <dl className="mt-1 grid gap-x-4 gap-y-1 text-sm md:grid-cols-2">
                {filas.map(({ pregunta, valor }) => (
                  <div key={pregunta.id} className="flex gap-1">
                    <dt className="text-[var(--color-ink-soft)]">{pregunta.etiqueta}:</dt>
                    <dd className="font-medium text-[var(--color-ink)]">{valor}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    );
  }

  return <CamposFijos s={s} />;
}

function formatearRespuesta(pregunta: FormPregunta & { opciones: FormOpcion[] }, valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (pregunta.tipo === "CASILLA") return valor ? "Sí" : null;
  if (pregunta.tipo === "OPCION_MULTIPLE" && Array.isArray(valor)) {
    const etiquetas = valor.map((v) => pregunta.opciones.find((o) => o.valor === v)?.etiqueta ?? String(v));
    return etiquetas.length > 0 ? etiquetas.join(", ") : null;
  }
  if (pregunta.tipo === "OPCION_UNICA" || pregunta.tipo === "SELECT_NIVEL" || pregunta.tipo === "SELECT_CUIDO") {
    const etiqueta = pregunta.opciones.find((o) => o.valor === valor)?.etiqueta;
    return etiqueta ?? String(valor);
  }
  return String(valor);
}

function CamposFijos({ s }: { s: SolicitudInscripcion }) {
  return (
    <div className="space-y-4 text-sm">
      <Grupo titulo="Estudiante">
        <Dato label="Nombre" valor={`${s.nombreEstudiante ?? ""} ${s.apellidoEstudiante ?? ""}`.trim()} />
        <Dato label="Fecha de nacimiento" valor={s.fechaNacimiento?.toLocaleDateString("es-DO")} />
        <Dato label="Sexo" valor={s.sexo} />
        <Dato label="Nacionalidad" valor={s.nacionalidad} />
        <Dato label="Lugar de nacimiento" valor={s.lugarNacimiento} />
        <Dato label="Acta" valor={[s.oficialiaActa, s.libroActa, s.folioActa, s.numeroActa, s.anioActa].filter(Boolean).join(" / ")} />
        <Dato label="Dirección" valor={s.direccionEstudiante} />
        <Dato label="Teléfono" valor={s.telefonoEstudiante} />
        <Dato label="Celular" valor={s.celularEstudiante} />
        <Dato label="Vive con" valor={s.viveCon} />
        <Dato label="Religión" valor={s.religion} />
        <Dato label="Hermanos en el colegio" valor={s.tieneHermanosEnColegio ? s.numeroHermanos ?? "Sí" : null} />
      </Grupo>

      <Grupo titulo="Información médica">
        <Dato label="Enfermedad" valor={s.padeceEnfermedad ? s.especifiqueEnfermedad ?? "Sí (sin detalle)" : null} />
        <Dato label="Procedimiento médico en curso" valor={s.siguiendoProcedimientoMedico ? s.especifiqueProcedimiento ?? "Sí" : null} />
        <Dato label="Tipo de sangre" valor={s.tipoSangre} />
        <Dato label="Alergias" valor={s.alergias} />
        <Dato label="Medicamentos" valor={s.medicamentos} />
        <Dato label="Seguro médico" valor={s.seguroMedico} />
      </Grupo>

      <Grupo titulo="Padre">
        <Dato label="Nombre" valor={s.nombrePadre ? `${s.nombrePadre} ${s.apellidoPadre ?? ""}`.trim() : null} />
        <Dato label="Cédula" valor={s.cedulaPadre} />
        <Dato label="Profesión" valor={s.profesionPadre} />
        <Dato label="Teléfono" valor={s.telefonoPadre} />
        <Dato label="Celular" valor={s.celularPadre} />
        <Dato label="Tel. trabajo" valor={s.telefonoTrabajoPadre} />
      </Grupo>

      <Grupo titulo="Madre">
        <Dato label="Nombre" valor={s.nombreMadre ? `${s.nombreMadre} ${s.apellidoMadre ?? ""}`.trim() : null} />
        <Dato label="Cédula" valor={s.cedulaMadre} />
        <Dato label="Profesión" valor={s.profesionMadre} />
        <Dato label="Teléfono" valor={s.telefonoMadre} />
        <Dato label="Celular" valor={s.celularMadre} />
        <Dato label="Tel. trabajo" valor={s.telefonoTrabajoMadre} />
      </Grupo>

      {s.tutorLegalNombre && (
        <Grupo titulo="Tutor legal (el niño no vive con sus padres)">
          <Dato label="Nombre" valor={`${s.tutorLegalNombre} ${s.tutorLegalApellido ?? ""}`.trim()} />
          <Dato label="Parentesco" valor={s.tutorLegalParentesco} />
          <Dato label="Cédula" valor={s.tutorLegalCedula} />
          <Dato label="Teléfono" valor={s.tutorLegalTelefono} />
        </Grupo>
      )}

      <Grupo titulo="Contacto de emergencia">
        <Dato label="Nombre" valor={s.emergenciaNombre ? `${s.emergenciaNombre} ${s.emergenciaApellido ?? ""}`.trim() : null} />
        <Dato label="Parentesco" valor={s.emergenciaParentesco} />
        <Dato label="Cédula" valor={s.emergenciaCedula} />
        <Dato label="Teléfono" valor={s.emergenciaTelefono} />
        <Dato label="Celular" valor={s.emergenciaCelular} />
        <Dato label="Autorizados a retirar" valor={s.personasAutorizadasRetirar} />
      </Grupo>

      <Grupo titulo="Académico">
        <Dato label="Nuevo ingreso" valor={s.esNuevoIngreso ? "Sí" : "No"} />
        <Dato label="Colegio de procedencia" valor={s.colegioProcedencia} />
        <Dato label="Motivo de cambio" valor={s.motivoCambioColegio} />
        <Dato label="Último grado cursado" valor={s.ultimoGradoCursado} />
        {s.tieneDificultad && (
          <Dato
            label="Dificultad reportada"
            valor={`${[s.dificultadConducta && "conducta", s.dificultadAprendizaje && "aprendizaje", s.dificultadDiscapacidad && "discapacidad"].filter(Boolean).join(", ")} — ${s.especifiqueDificultad ?? "sin detalle"}`}
          />
        )}
      </Grupo>

      <Grupo titulo="Referencias">
        <Dato label="Referencia 1" valor={s.referencia1Nombre ? `${s.referencia1Nombre} · ${s.referencia1Telefono ?? "-"}` : null} />
        <Dato label="Referencia 2" valor={s.referencia2Nombre ? `${s.referencia2Nombre} · ${s.referencia2Telefono ?? "-"}` : null} />
      </Grupo>

      <Grupo titulo="Plan de pago y documentos">
        <Dato label="Plan de pago" valor={s.planPago} />
        <Dato label="Tipo de escolaridad" valor={s.tipoEscolaridad} />
        <Dato
          label="Documentos entregados"
          valor={
            [
              s.docActaNacimiento && "Acta de nacimiento",
              s.docCedulaPadres && "Cédula de padres",
              s.docCertificadoMedico && "Certificado médico",
              s.docRecordNotas && "Récord de notas",
              s.docTarjetaVacunacion && "Tarjeta de vacunación",
            ]
              .filter(Boolean)
              .join(", ") || "Ninguno marcado"
          }
        />
        <Dato label="Comentarios" valor={s.comentarios} />
      </Grupo>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">{titulo}</p>
      <dl className="mt-1 grid gap-x-4 gap-y-1 md:grid-cols-2">{children}</dl>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex gap-1">
      <dt className="text-[var(--color-ink-soft)]">{label}:</dt>
      <dd className="font-medium text-[var(--color-ink)]">{valor}</dd>
    </div>
  );
}
