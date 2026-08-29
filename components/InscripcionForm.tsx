"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  // Estudiante
  nombreEstudiante: z.string().min(1, "Requerido"),
  apellidoEstudiante: z.string().min(1, "Requerido"),
  fechaNacimiento: z.string().min(1, "Requerido"),
  sexo: z.enum(["MASCULINO", "FEMENINO"]).optional(),
  nacionalidad: z.string().optional(),
  lugarNacimiento: z.string().optional(),
  oficialiaActa: z.string().optional(),
  libroActa: z.string().optional(),
  folioActa: z.string().optional(),
  numeroActa: z.string().optional(),
  anioActa: z.string().optional(),
  direccionEstudiante: z.string().optional(),
  telefonoEstudiante: z.string().optional(),
  celularEstudiante: z.string().optional(),
  viveCon: z.enum(["AMBOS_PADRES", "MADRE", "PADRE", "TUTOR", "OTRO"]).optional(),
  tieneHermanosEnColegio: z.boolean().optional(),
  numeroHermanos: z.string().optional(),
  religion: z.string().optional(),
  nivelInteresId: z.string().optional(),

  // Salud
  padeceEnfermedad: z.boolean().optional(),
  especifiqueEnfermedad: z.string().optional(),
  siguiendoProcedimientoMedico: z.boolean().optional(),
  especifiqueProcedimiento: z.string().optional(),
  seguroMedico: z.string().optional(),
  tipoSangre: z.string().optional(),
  alergias: z.string().optional(),
  medicamentos: z.string().optional(),

  // Contacto principal
  relacionContacto: z.enum(["PADRE", "MADRE", "TUTOR_LEGAL", "OTRO"]).optional(),
  nombreTutor: z.string().min(1, "Requerido"),
  cedulaTutor: z.string().optional(),
  telefonoTutor: z.string().min(6, "Teléfono inválido"),
  emailTutor: z.string().email("Correo inválido"),

  // Padre
  nombrePadre: z.string().optional(),
  apellidoPadre: z.string().optional(),
  cedulaPadre: z.string().optional(),
  profesionPadre: z.string().optional(),
  telefonoPadre: z.string().optional(),
  celularPadre: z.string().optional(),
  telefonoTrabajoPadre: z.string().optional(),

  // Madre
  nombreMadre: z.string().optional(),
  apellidoMadre: z.string().optional(),
  cedulaMadre: z.string().optional(),
  profesionMadre: z.string().optional(),
  telefonoMadre: z.string().optional(),
  celularMadre: z.string().optional(),
  telefonoTrabajoMadre: z.string().optional(),

  // Tutor legal
  tutorLegalNombre: z.string().optional(),
  tutorLegalApellido: z.string().optional(),
  tutorLegalParentesco: z.string().optional(),
  tutorLegalCedula: z.string().optional(),
  tutorLegalTelefono: z.string().optional(),

  // Emergencia
  emergenciaNombre: z.string().optional(),
  emergenciaApellido: z.string().optional(),
  emergenciaParentesco: z.string().optional(),
  emergenciaCedula: z.string().optional(),
  emergenciaTelefono: z.string().optional(),
  emergenciaCelular: z.string().optional(),

  personasAutorizadasRetirar: z.string().optional(),

  // Académico
  esNuevoIngreso: z.boolean().optional(),
  colegioProcedencia: z.string().optional(),
  motivoCambioColegio: z.string().optional(),
  ultimoGradoCursado: z.string().optional(),
  tieneDificultad: z.boolean().optional(),
  dificultadConducta: z.boolean().optional(),
  dificultadAprendizaje: z.boolean().optional(),
  dificultadDiscapacidad: z.boolean().optional(),
  especifiqueDificultad: z.string().optional(),
  fechaEvaluacion: z.string().optional(),

  // Referencias
  referencia1Nombre: z.string().optional(),
  referencia1Telefono: z.string().optional(),
  referencia2Nombre: z.string().optional(),
  referencia2Telefono: z.string().optional(),

  // Plan de pago
  planPago: z.enum(["PAGO_UNICO", "DOS_PAGOS", "DIEZ_CUOTAS"]).optional(),
  tipoEscolaridad: z
    .enum(["SOLO_ESCOLARIDAD", "ESCOLARIDAD_ALMUERZO", "ESCOLARIDAD_ALMUERZO_HORARIO_EXTENDIDO"])
    .optional(),

  // Autorizaciones
  autorizaAtencionMedica: z.boolean().refine((v) => v === true, {
    message: "Debes autorizar la atención médica de emergencia para continuar",
  }),
  autorizaUsoImagenes: z.boolean().optional(),
  aceptaReglamento: z.boolean().refine((v) => v === true, {
    message: "Debes aceptar el reglamento interno para continuar",
  }),

  // Programas de interés
  interesCuidoId: z.string().optional(),
  comentarios: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Opcion = { id: string; nombre: string };

export function InscripcionForm({
  niveles,
  programasCuido,
}: {
  niveles: Opcion[];
  programasCuido: Opcion[];
}) {
  const [estado, setEstado] = useState<"idle" | "enviando" | "exito" | "error">("idle");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { esNuevoIngreso: true },
  });

  const viveCon = watch("viveCon");
  const padeceEnfermedad = watch("padeceEnfermedad");
  const siguiendoProcedimiento = watch("siguiendoProcedimientoMedico");
  const esNuevoIngreso = watch("esNuevoIngreso");
  const tieneDificultad = watch("tieneDificultad");

  async function onSubmit(values: FormValues) {
    setEstado("enviando");
    try {
      const res = await fetch("/api/inscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
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
      {/* --- DATOS DEL ESTUDIANTE --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Datos del niño/a
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre/s" error={errors.nombreEstudiante?.message}>
            <input {...register("nombreEstudiante")} className={inputClass} />
          </Field>
          <Field label="Apellido/s" error={errors.apellidoEstudiante?.message}>
            <input {...register("apellidoEstudiante")} className={inputClass} />
          </Field>
          <Field label="Fecha de nacimiento" error={errors.fechaNacimiento?.message}>
            <input type="date" {...register("fechaNacimiento")} className={inputClass} />
          </Field>
          <Field label="Sexo">
            <select {...register("sexo")} className={inputClass}>
              <option value="">Seleccionar…</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
            </select>
          </Field>
          <Field label="Nacionalidad">
            <input {...register("nacionalidad")} className={inputClass} />
          </Field>
          <Field label="Lugar de nacimiento">
            <input {...register("lugarNacimiento")} className={inputClass} />
          </Field>
          <Field label="Nivel para el que solicita">
            <select {...register("nivelInteresId")} className={inputClass}>
              <option value="">Seleccionar…</option>
              {niveles.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      {/* --- ACTA DE NACIMIENTO --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Acta de nacimiento
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Oficialía">
            <input {...register("oficialiaActa")} className={inputClass} />
          </Field>
          <Field label="Libro">
            <input {...register("libroActa")} className={inputClass} />
          </Field>
          <Field label="Folio">
            <input {...register("folioActa")} className={inputClass} />
          </Field>
          <Field label="Número de acta">
            <input {...register("numeroActa")} className={inputClass} />
          </Field>
          <Field label="Año">
            <input {...register("anioActa")} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      {/* --- DIRECCIÓN Y FAMILIA --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Dirección y hogar
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Dirección">
            <input {...register("direccionEstudiante")} className={inputClass} />
          </Field>
          <Field label="Teléfono">
            <input {...register("telefonoEstudiante")} className={inputClass} />
          </Field>
          <Field label="Celular">
            <input {...register("celularEstudiante")} className={inputClass} />
          </Field>
          <Field label="Vive con">
            <select {...register("viveCon")} className={inputClass}>
              <option value="">Seleccionar…</option>
              <option value="AMBOS_PADRES">Ambos padres</option>
              <option value="MADRE">Madre</option>
              <option value="PADRE">Padre</option>
              <option value="TUTOR">Tutor</option>
              <option value="OTRO">Otro</option>
            </select>
          </Field>
          <Field label="Religión que profesa">
            <input {...register("religion")} className={inputClass} />
          </Field>
          <Field label="Número de hermanos en el colegio">
            <input {...register("numeroHermanos")} className={inputClass} />
          </Field>
        </div>
        <CheckboxField label="Tiene hermanos actualmente en el colegio" {...register("tieneHermanosEnColegio")} />
      </fieldset>

      {/* --- SALUD --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Datos de salud
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Seguro médico">
            <input {...register("seguroMedico")} className={inputClass} />
          </Field>
          <Field label="Tipo de sangre">
            <input {...register("tipoSangre")} className={inputClass} />
          </Field>
        </div>
        <Field label="Alergias">
          <textarea {...register("alergias")} rows={2} className={inputClass} />
        </Field>
        <Field label="Medicamentos que utiliza">
          <textarea {...register("medicamentos")} rows={2} className={inputClass} />
        </Field>
        <CheckboxField label="¿Padece alguna enfermedad?" {...register("padeceEnfermedad")} />
        {padeceEnfermedad && (
          <Field label="Especifique (enfermedad)">
            <input {...register("especifiqueEnfermedad")} className={inputClass} />
          </Field>
        )}
        <CheckboxField
          label="¿Está siguiendo algún procedimiento médico?"
          {...register("siguiendoProcedimientoMedico")}
        />
        {siguiendoProcedimiento && (
          <Field label="Especifique (procedimiento)">
            <input {...register("especifiqueProcedimiento")} className={inputClass} />
          </Field>
        )}
      </fieldset>

      {/* --- CONTACTO PRINCIPAL --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Persona que llena esta solicitud
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Parentesco con el estudiante">
            <select {...register("relacionContacto")} className={inputClass}>
              <option value="">Seleccionar…</option>
              <option value="PADRE">Padre</option>
              <option value="MADRE">Madre</option>
              <option value="TUTOR_LEGAL">Tutor legal</option>
              <option value="OTRO">Otro</option>
            </select>
          </Field>
          <Field label="Nombre completo" error={errors.nombreTutor?.message}>
            <input {...register("nombreTutor")} className={inputClass} />
          </Field>
          <Field label="Cédula">
            <input {...register("cedulaTutor")} className={inputClass} />
          </Field>
          <Field label="Teléfono" error={errors.telefonoTutor?.message}>
            <input {...register("telefonoTutor")} className={inputClass} />
          </Field>
          <Field label="Correo electrónico" error={errors.emailTutor?.message}>
            <input type="email" {...register("emailTutor")} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      {/* --- DATOS DEL PADRE --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Datos del padre (si aplica)
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre/s">
            <input {...register("nombrePadre")} className={inputClass} />
          </Field>
          <Field label="Apellido/s">
            <input {...register("apellidoPadre")} className={inputClass} />
          </Field>
          <Field label="Cédula">
            <input {...register("cedulaPadre")} className={inputClass} />
          </Field>
          <Field label="Profesión">
            <input {...register("profesionPadre")} className={inputClass} />
          </Field>
          <Field label="Teléfono">
            <input {...register("telefonoPadre")} className={inputClass} />
          </Field>
          <Field label="Celular">
            <input {...register("celularPadre")} className={inputClass} />
          </Field>
          <Field label="Teléfono de trabajo">
            <input {...register("telefonoTrabajoPadre")} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      {/* --- DATOS DE LA MADRE --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Datos de la madre (si aplica)
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre/s">
            <input {...register("nombreMadre")} className={inputClass} />
          </Field>
          <Field label="Apellido/s">
            <input {...register("apellidoMadre")} className={inputClass} />
          </Field>
          <Field label="Cédula">
            <input {...register("cedulaMadre")} className={inputClass} />
          </Field>
          <Field label="Profesión">
            <input {...register("profesionMadre")} className={inputClass} />
          </Field>
          <Field label="Teléfono">
            <input {...register("telefonoMadre")} className={inputClass} />
          </Field>
          <Field label="Celular">
            <input {...register("celularMadre")} className={inputClass} />
          </Field>
          <Field label="Teléfono de trabajo">
            <input {...register("telefonoTrabajoMadre")} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      {/* --- TUTOR LEGAL --- */}
      {(viveCon === "TUTOR" || viveCon === "OTRO") && (
        <fieldset className="space-y-4">
          <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
            Datos del tutor (el niño/a no vive con sus padres)
          </legend>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre/s">
              <input {...register("tutorLegalNombre")} className={inputClass} />
            </Field>
            <Field label="Apellido/s">
              <input {...register("tutorLegalApellido")} className={inputClass} />
            </Field>
            <Field label="Parentesco">
              <input {...register("tutorLegalParentesco")} className={inputClass} />
            </Field>
            <Field label="Cédula">
              <input {...register("tutorLegalCedula")} className={inputClass} />
            </Field>
            <Field label="Teléfono">
              <input {...register("tutorLegalTelefono")} className={inputClass} />
            </Field>
          </div>
        </fieldset>
      )}

      {/* --- EMERGENCIA --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Autorización en caso de emergencia
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre/s">
            <input {...register("emergenciaNombre")} className={inputClass} />
          </Field>
          <Field label="Apellido/s">
            <input {...register("emergenciaApellido")} className={inputClass} />
          </Field>
          <Field label="Parentesco">
            <input {...register("emergenciaParentesco")} className={inputClass} />
          </Field>
          <Field label="Cédula">
            <input {...register("emergenciaCedula")} className={inputClass} />
          </Field>
          <Field label="Teléfono">
            <input {...register("emergenciaTelefono")} className={inputClass} />
          </Field>
          <Field label="Celular">
            <input {...register("emergenciaCelular")} className={inputClass} />
          </Field>
        </div>
        <Field label="Personas autorizadas a retirar al estudiante (nombre y teléfono, una por línea)">
          <textarea {...register("personasAutorizadasRetirar")} rows={3} className={inputClass} />
        </Field>
      </fieldset>

      {/* --- ACADÉMICO / NUEVO INGRESO --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Información académica
        </legend>
        <CheckboxField label="Es un estudiante de nuevo ingreso" {...register("esNuevoIngreso")} />
        {esNuevoIngreso && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Colegio de procedencia">
                <input {...register("colegioProcedencia")} className={inputClass} />
              </Field>
              <Field label="Último grado cursado">
                <input {...register("ultimoGradoCursado")} className={inputClass} />
              </Field>
            </div>
            <Field label="¿Por qué cambio de colegio? (especificar)">
              <textarea {...register("motivoCambioColegio")} rows={2} className={inputClass} />
            </Field>
          </>
        )}
        <CheckboxField label="¿Tiene el niño/a alguna dificultad?" {...register("tieneDificultad")} />
        {tieneDificultad && (
          <>
            <div className="flex flex-wrap gap-6">
              <CheckboxField label="Dificultad de conducta" {...register("dificultadConducta")} />
              <CheckboxField label="Dificultad de aprendizaje" {...register("dificultadAprendizaje")} />
              <CheckboxField label="Discapacidad" {...register("dificultadDiscapacidad")} />
            </div>
            <Field label="Especifique la dificultad">
              <textarea {...register("especifiqueDificultad")} rows={2} className={inputClass} />
            </Field>
            <Field label="Fecha de evaluación (si aplica)">
              <input type="date" {...register("fechaEvaluacion")} className={inputClass} />
            </Field>
          </>
        )}
      </fieldset>

      {/* --- REFERENCIAS --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Referencias personales
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre (referencia 1)">
            <input {...register("referencia1Nombre")} className={inputClass} />
          </Field>
          <Field label="Teléfono (referencia 1)">
            <input {...register("referencia1Telefono")} className={inputClass} />
          </Field>
          <Field label="Nombre (referencia 2)">
            <input {...register("referencia2Nombre")} className={inputClass} />
          </Field>
          <Field label="Teléfono (referencia 2)">
            <input {...register("referencia2Telefono")} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      {/* --- PLAN DE PAGO --- */}
      <fieldset className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Responsable económico
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Plan de pago">
            <select {...register("planPago")} className={inputClass}>
              <option value="">Seleccionar…</option>
              <option value="PAGO_UNICO">Plan A — 1 único pago</option>
              <option value="DOS_PAGOS">Plan B — 2 pagos</option>
              <option value="DIEZ_CUOTAS">Plan C — 10 cuotas mensuales</option>
            </select>
          </Field>
          <Field label="Tipo de escolaridad">
            <select {...register("tipoEscolaridad")} className={inputClass}>
              <option value="">Seleccionar…</option>
              <option value="SOLO_ESCOLARIDAD">Solo escolaridad</option>
              <option value="ESCOLARIDAD_ALMUERZO">Escolaridad y almuerzo</option>
              <option value="ESCOLARIDAD_ALMUERZO_HORARIO_EXTENDIDO">
                Escolaridad, almuerzo y horario extendido
              </option>
            </select>
          </Field>
        </div>
      </fieldset>

      {/* --- PROGRAMAS ADICIONALES --- */}
      <fieldset id="cuido" className="space-y-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Programas adicionales (opcional)
        </legend>
        <Field label="Programa de cuido">
          <select {...register("interesCuidoId")} className={inputClass}>
            <option value="">No necesito cuido</option>
            {programasCuido.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Comentarios adicionales">
          <textarea {...register("comentarios")} rows={3} className={inputClass} />
        </Field>
      </fieldset>

      {/* --- AUTORIZACIONES --- */}
      <fieldset className="space-y-3 rounded-sm border border-[var(--color-line)] bg-[#fffdf6] p-5">
        <legend className="font-mono text-xs uppercase tracking-widest text-[var(--color-green)]">
          Autorizaciones
        </legend>
        <CheckboxField
          label="Autorizo la atención médica de emergencia para mi hijo/a en caso de ser necesario"
          {...register("autorizaAtencionMedica")}
        />
        {errors.autorizaAtencionMedica && (
          <p className="text-xs text-red-600">{errors.autorizaAtencionMedica.message}</p>
        )}
        <CheckboxField
          label="Autorizo el uso de fotografías o videos institucionales de mi hijo/a"
          {...register("autorizaUsoImagenes")}
        />
        <CheckboxField
          label="Acepto el reglamento interno del centro"
          {...register("aceptaReglamento")}
        />
        {errors.aceptaReglamento && (
          <p className="text-xs text-red-600">{errors.aceptaReglamento.message}</p>
        )}
      </fieldset>

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

const inputClass =
  "mt-1 w-full rounded-sm border border-[var(--color-line)] bg-[#fffdf6] px-3 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-green)] focus:ring-2 focus:ring-[var(--color-green)]/20";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-[var(--color-ink)]">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const CheckboxField = React.forwardRef<
  HTMLInputElement,
  { label: string } & React.InputHTMLAttributes<HTMLInputElement>
>(function CheckboxField({ label, ...props }, ref) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
      <input type="checkbox" ref={ref} {...props} className="h-4 w-4" />
      {label}
    </label>
  );
});
