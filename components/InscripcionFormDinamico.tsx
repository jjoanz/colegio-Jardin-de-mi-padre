"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

type Opcion = { id: string; nombre: string };

type FormOpcionData = { id: string; valor: string; etiqueta: string };
type FormPreguntaData = {
  id: string;
  clave: string;
  etiqueta: string;
  tipo: string;
  requerida: boolean;
  placeholder: string | null;
  opciones: FormOpcionData[];
  rolSistema?: string | null;
};
type FormSeccionData = {
  id: string;
  titulo: string;
  descripcion: string | null;
  preguntas: FormPreguntaData[];
};
type FormularioData = {
  id: string;
  secciones: FormSeccionData[];
};
type CondicionData = {
  preguntaOrigenId: string;
  valorEsperado: string;
  preguntaObjetivoId: string | null;
  seccionObjetivoId: string | null;
};

type GradoOpcion = { id: string; nombre: string; nivelId: string };

export function InscripcionFormDinamico({
  formulario,
  condiciones,
  niveles,
  grados,
  programasCuido,
}: {
  formulario: FormularioData;
  condiciones: CondicionData[];
  niveles: Opcion[];
  grados: GradoOpcion[];
  programasCuido: Opcion[];
}) {
  const [estado, setEstado] = useState<"idle" | "enviando" | "exito" | "error">("idle");
  const [erroresFaltantes, setErroresFaltantes] = useState<string[]>([]);

  const { register, handleSubmit, watch } = useForm<Record<string, unknown>>();

  // Mapear id de pregunta -> clave (para resolver a qué campo watchear)
  const claveDePregunta: Record<string, string> = {};
  let claveNivelInteres: string | undefined;
  for (const seccion of formulario.secciones) {
    for (const pregunta of seccion.preguntas) {
      claveDePregunta[pregunta.id] = pregunta.clave;
      if (pregunta.rolSistema === "NIVEL_INTERES") claveNivelInteres = pregunta.clave;
    }
  }
  const nivelElegidoId = claveNivelInteres ? (watch(claveNivelInteres) as string | undefined) : undefined;
  const gradosDelNivelElegido = grados.filter((g) => g.nivelId === nivelElegidoId);

  const condicionesPorPregunta: Record<string, { origenClave: string; valorEsperado: string }[]> = {};
  const condicionesPorSeccion: Record<string, { origenClave: string; valorEsperado: string }[]> = {};
  for (const c of condiciones) {
    const origenClave = claveDePregunta[c.preguntaOrigenId];
    if (!origenClave) continue;
    if (c.preguntaObjetivoId) {
      (condicionesPorPregunta[c.preguntaObjetivoId] ??= []).push({ origenClave, valorEsperado: c.valorEsperado });
    }
    if (c.seccionObjetivoId) {
      (condicionesPorSeccion[c.seccionObjetivoId] ??= []).push({ origenClave, valorEsperado: c.valorEsperado });
    }
  }

  function coincide(cond: { origenClave: string; valorEsperado: string }) {
    const valor = watch(cond.origenClave);
    if (typeof valor === "boolean") return String(valor) === cond.valorEsperado;
    if (Array.isArray(valor)) return valor.includes(cond.valorEsperado);
    return String(valor ?? "") === cond.valorEsperado;
  }

  function seccionVisible(seccionId: string) {
    const lista = condicionesPorSeccion[seccionId];
    if (!lista || lista.length === 0) return true;
    return lista.some(coincide);
  }

  function preguntaVisible(preguntaId: string) {
    const lista = condicionesPorPregunta[preguntaId];
    if (!lista || lista.length === 0) return true;
    return lista.some(coincide);
  }

  async function onSubmit(values: Record<string, unknown>) {
    const faltantes: string[] = [];
    for (const seccion of formulario.secciones) {
      if (!seccionVisible(seccion.id)) continue;
      for (const pregunta of seccion.preguntas) {
        if (!preguntaVisible(pregunta.id)) continue;
        if (!pregunta.requerida) continue;
        const val = values[pregunta.clave];
        const esArchivoVacio =
          pregunta.tipo === "ARCHIVO" && (!(val instanceof FileList) || val.length === 0);
        const vacio =
          val === undefined ||
          val === null ||
          val === "" ||
          (pregunta.tipo === "CASILLA" && val !== true) ||
          (Array.isArray(val) && val.length === 0) ||
          esArchivoVacio;
        if (vacio) faltantes.push(pregunta.etiqueta);
      }
    }

    // El comprobante de transferencia no es "requerido" a nivel de pregunta
    // (porque solo aplica si se eligió transferencia), así que se valida aparte.
    const comprobante = values.comprobantePago;
    if (
      values.metodoPagoPreferido === "TRANSFERENCIA" &&
      (!(comprobante instanceof FileList) || comprobante.length === 0)
    ) {
      faltantes.push("Comprobante de pago (transferencia bancaria)");
    }

    if (faltantes.length > 0) {
      setErroresFaltantes(faltantes);
      return;
    }
    setErroresFaltantes([]);
    setEstado("enviando");

    try {
      const formData = new FormData();
      formData.append("formularioVersionId", formulario.id);

      const respuestasPlano: Record<string, unknown> = {};
      for (const [clave, val] of Object.entries(values)) {
        if (val instanceof FileList) {
          if (val.length > 0) formData.append(`archivo_${clave}`, val[0]);
        } else {
          respuestasPlano[clave] = val;
        }
      }
      formData.append("respuestas", JSON.stringify(respuestasPlano));

      const res = await fetch("/api/inscripcion", { method: "POST", body: formData });
      if (!res.ok) throw new Error("fallo");
      setEstado("exito");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "exito") {
    return (
      <div className="rounded-sm border border-[var(--color-green)] bg-[var(--color-green)]/5 p-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-green)]">
          ¡Solicitud recibida!
        </p>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Nuestro equipo de admisiones se pondrá en contacto contigo en los próximos días
          para confirmar el cupo y los siguientes pasos de pago.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {formulario.secciones.map((seccion) => {
        if (!seccionVisible(seccion.id)) return null;
        return (
          <fieldset key={seccion.id} className="space-y-4">
            <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
              {seccion.titulo}
            </legend>
            {seccion.descripcion && (
              <p className="whitespace-pre-line text-sm text-[var(--color-ink-soft)]">{seccion.descripcion}</p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {seccion.preguntas.map((pregunta) => {
                if (!preguntaVisible(pregunta.id)) return null;
                return (
                  <div
                    key={pregunta.id}
                    className={
                      pregunta.tipo === "TEXTO_LARGO" ||
                      pregunta.tipo === "OPCION_MULTIPLE" ||
                      pregunta.tipo === "ARCHIVO"
                        ? "md:col-span-2"
                        : ""
                    }
                  >
                    <PreguntaCampo
                      pregunta={pregunta}
                      register={register}
                      niveles={niveles}
                      gradosDelNivelElegido={gradosDelNivelElegido}
                      nivelElegidoId={nivelElegidoId}
                      programasCuido={programasCuido}
                    />
                  </div>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {erroresFaltantes.length > 0 && (
        <div className="rounded-sm bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Falta completar:</p>
          <ul className="mt-1 list-inside list-disc">
            {erroresFaltantes.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {estado === "error" && (
        <p className="rounded-sm bg-red-50 p-3 text-sm text-red-700">
          Ocurrió un error al enviar tu solicitud. Intenta de nuevo o contáctanos por teléfono.
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="w-full rounded-sm bg-[var(--color-green)] py-3.5 font-medium text-[var(--color-paper)] disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando…" : "Enviar solicitud de inscripción"}
      </button>
    </form>
  );
}

function PreguntaCampo({
  pregunta,
  register,
  niveles,
  gradosDelNivelElegido,
  nivelElegidoId,
  programasCuido,
}: {
  pregunta: FormPreguntaData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  niveles: Opcion[];
  gradosDelNivelElegido: GradoOpcion[];
  nivelElegidoId: string | undefined;
  programasCuido: Opcion[];
}) {
  const label = (
    <span className="block text-sm font-medium text-[var(--color-ink)]">
      {pregunta.etiqueta}
      {pregunta.requerida && <span className="text-red-600"> *</span>}
    </span>
  );

  switch (pregunta.tipo) {
    case "TEXTO_LARGO":
      return (
        <label className="block">
          {label}
          <textarea
            {...register(pregunta.clave)}
            rows={3}
            placeholder={pregunta.placeholder ?? ""}
            className={inputClass}
          />
        </label>
      );
    case "NUMERO":
      return (
        <label className="block">
          {label}
          <input
            type="number"
            {...register(pregunta.clave)}
            placeholder={pregunta.placeholder ?? ""}
            className={inputClass}
          />
        </label>
      );
    case "FECHA":
      return (
        <label className="block">
          {label}
          <input type="date" {...register(pregunta.clave)} className={inputClass} />
        </label>
      );
    case "CASILLA":
      return (
        <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
          <input type="checkbox" {...register(pregunta.clave)} className="h-4 w-4" />
          {pregunta.etiqueta}
          {pregunta.requerida && <span className="text-red-600"> *</span>}
        </label>
      );
    case "OPCION_UNICA":
      return (
        <div>
          {label}
          <div className="mt-1 space-y-1">
            {pregunta.opciones.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                <input type="radio" value={o.valor} {...register(pregunta.clave)} />
                {o.etiqueta}
              </label>
            ))}
          </div>
        </div>
      );
    case "OPCION_MULTIPLE":
      return (
        <div>
          {label}
          <div className="mt-1 flex flex-wrap gap-4">
            {pregunta.opciones.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                <input type="checkbox" value={o.valor} {...register(pregunta.clave)} />
                {o.etiqueta}
              </label>
            ))}
          </div>
        </div>
      );
    case "SELECT_NIVEL":
      return (
        <label className="block">
          {label}
          <select {...register(pregunta.clave)} className={inputClass}>
            <option value="">Seleccionar…</option>
            {niveles.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nombre}
              </option>
            ))}
          </select>
        </label>
      );
    case "SELECT_GRADO":
      return (
        <label className="block">
          {label}
          <select {...register(pregunta.clave)} className={inputClass} disabled={!nivelElegidoId}>
            <option value="">
              {!nivelElegidoId
                ? "Primero elige el nivel"
                : gradosDelNivelElegido.length === 0
                ? "Este nivel no tiene grados específicos"
                : "Seleccionar…"}
            </option>
            {gradosDelNivelElegido.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </label>
      );
    case "SELECT_CUIDO":
      return (
        <label className="block">
          {label}
          <select {...register(pregunta.clave)} className={inputClass}>
            <option value="">No necesito cuido</option>
            {programasCuido.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
      );
    case "ARCHIVO":
      return (
        <label className="block">
          {label}
          <input
            type="file"
            accept="image/*,.pdf"
            {...register(pregunta.clave)}
            className={inputClass}
          />
        </label>
      );
    case "TEXTO_CORTO":
    default:
      return (
        <label className="block">
          {label}
          <input
            type="text"
            {...register(pregunta.clave)}
            placeholder={pregunta.placeholder ?? ""}
            className={inputClass}
          />
        </label>
      );
  }
}

const inputClass =
  "mt-1 w-full rounded-sm border border-[var(--color-line)] bg-[#fffdf6] px-3 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-green)] focus:ring-2 focus:ring-[var(--color-green)]/20";
