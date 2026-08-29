import { prisma } from "@/lib/prisma";
import {
  asegurarBorrador,
  crearSeccion,
  actualizarSeccion,
  eliminarSeccion,
  moverSeccion,
  crearPregunta,
  actualizarPregunta,
  eliminarPregunta,
  moverPregunta,
  crearCondicion,
  eliminarCondicion,
  publicarFormulario,
} from "@/lib/actions-formulario";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

const TIPOS_PREGUNTA = [
  { value: "TEXTO_CORTO", label: "Texto corto" },
  { value: "TEXTO_LARGO", label: "Texto largo" },
  { value: "NUMERO", label: "Número" },
  { value: "FECHA", label: "Fecha" },
  { value: "OPCION_UNICA", label: "Opción única (radio)" },
  { value: "OPCION_MULTIPLE", label: "Opción múltiple (checkboxes)" },
  { value: "CASILLA", label: "Casilla (sí/no)" },
  { value: "SELECT_NIVEL", label: "Selector de Nivel (automático)" },
  { value: "SELECT_CUIDO", label: "Selector de Programa de cuido (automático)" },
];

const ROLES_SISTEMA = [
  { value: "", label: "Ninguno (campo personalizado)" },
  { value: "NOMBRE_ESTUDIANTE", label: "Nombre del estudiante" },
  { value: "APELLIDO_ESTUDIANTE", label: "Apellido del estudiante" },
  { value: "FECHA_NACIMIENTO_ESTUDIANTE", label: "Fecha de nacimiento del estudiante" },
  { value: "NIVEL_INTERES", label: "Nivel de interés" },
  { value: "NOMBRE_CONTACTO", label: "Nombre del contacto principal" },
  { value: "TELEFONO_CONTACTO", label: "Teléfono del contacto principal" },
  { value: "EMAIL_CONTACTO", label: "Correo del contacto principal" },
  { value: "CEDULA_CONTACTO", label: "Cédula del contacto principal" },
];

export default async function FormularioInscripcionPage() {
  let borrador = await prisma.formularioVersion.findFirst({ where: { estado: "BORRADOR" } });
  if (!borrador) {
    await asegurarBorrador();
    borrador = await prisma.formularioVersion.findFirst({ where: { estado: "BORRADOR" } });
  }

  const publicado = await prisma.formularioVersion.findFirst({ where: { estado: "PUBLICADO" } });

  const secciones = await prisma.formSeccion.findMany({
    where: { formularioId: borrador!.id },
    orderBy: { orden: "asc" },
    include: {
      preguntas: {
        orderBy: { orden: "asc" },
        include: { opciones: { orderBy: { orden: "asc" } } },
      },
    },
  });

  const todasLasPreguntas = secciones.flatMap((s) =>
    s.preguntas.map((p) => ({ ...p, seccionTitulo: s.titulo }))
  );

  const condiciones = await prisma.formCondicion.findMany({
    where: { preguntaOrigen: { seccion: { formularioId: borrador!.id } } },
    include: { preguntaOrigen: true, preguntaObjetivo: true, seccionObjetivo: true },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            Constructor del formulario de inscripción
          </h1>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            Editá aquí tranquilo — el público sigue viendo la versión publicada (v{publicado?.numero ?? "—"}) hasta
            que le des a &quot;Publicar cambios&quot;.
          </p>
        </div>
        <form action={publicarFormulario}>
          <BotonGuardar textoGuardado="✓ Publicado" className="rounded-lg bg-[var(--color-green)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            Publicar cambios (v{borrador!.numero})
          </BotonGuardar>
        </form>
      </div>

      <div className="mt-8 space-y-4">
        {secciones.map((seccion, idx) => (
          <details
            key={seccion.id}
            className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white"
            open
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">
                  {idx + 1}. {seccion.titulo}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">{seccion.preguntas.length} pregunta(s)</p>
              </div>
              <div className="flex gap-1">
                <form action={moverSeccion}>
                  <input type="hidden" name="seccionId" value={seccion.id} />
                  <input type="hidden" name="direccion" value="arriba" />
                  <button className="rounded px-2 py-1 text-xs hover:bg-[var(--color-paper-dark)]">↑</button>
                </form>
                <form action={moverSeccion}>
                  <input type="hidden" name="seccionId" value={seccion.id} />
                  <input type="hidden" name="direccion" value="abajo" />
                  <button className="rounded px-2 py-1 text-xs hover:bg-[var(--color-paper-dark)]">↓</button>
                </form>
              </div>
            </summary>

            <div className="space-y-4 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4">
              <form action={actualizarSeccion} className="grid gap-2 md:grid-cols-2">
                <input type="hidden" name="seccionId" value={seccion.id} />
                <input name="titulo" defaultValue={seccion.titulo} className={inputClass} />
                <input
                  name="descripcion"
                  defaultValue={seccion.descripcion ?? ""}
                  placeholder="Descripción (opcional)"
                  className={inputClass}
                />
                <BotonGuardar className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-bold disabled:opacity-60 md:col-span-2">
                  Guardar título
                </BotonGuardar>
              </form>

              <form action={eliminarSeccion}>
                <input type="hidden" name="seccionId" value={seccion.id} />
                <BotonGuardar
                  textoGuardado="✓ Eliminada"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  Eliminar sección completa
                </BotonGuardar>
              </form>

              <div className="space-y-3">
                {seccion.preguntas.map((pregunta) => {
                  const condicionesDePregunta = condiciones.filter(
                    (c) => c.preguntaObjetivoId === pregunta.id
                  );
                  return (
                    <details key={pregunta.id} className="rounded-xl border border-[var(--color-line)] bg-white p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-[var(--color-ink)]">
                        {pregunta.etiqueta}{" "}
                        <span className="text-xs font-normal text-[var(--color-ink-soft)]">
                          ({pregunta.clave})
                        </span>
                        {pregunta.requerida && <span className="ml-1 text-xs text-red-600">*</span>}
                      </summary>

                      <form action={actualizarPregunta} className="mt-3 grid gap-2 md:grid-cols-2">
                        <input type="hidden" name="preguntaId" value={pregunta.id} />
                        <label className="text-xs text-[var(--color-ink-soft)]">
                          Etiqueta
                          <input name="etiqueta" defaultValue={pregunta.etiqueta} className={inputClass} />
                        </label>
                        <label className="text-xs text-[var(--color-ink-soft)]">
                          Tipo
                          <select name="tipo" defaultValue={pregunta.tipo} className={inputClass}>
                            {TIPOS_PREGUNTA.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-[var(--color-ink-soft)]">
                          Rol en el sistema
                          <select name="rolSistema" defaultValue={pregunta.rolSistema ?? ""} className={inputClass}>
                            {ROLES_SISTEMA.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex items-center gap-2 self-end text-xs text-[var(--color-ink-soft)]">
                          <input type="checkbox" name="requerida" defaultChecked={pregunta.requerida} />
                          Obligatoria
                        </label>
                        <label className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
                          Opciones (solo Opción única/múltiple) — una por línea, formato{" "}
                          <code>valor|Etiqueta</code>
                          <textarea
                            name="opcionesTexto"
                            defaultValue={pregunta.opciones.map((o) => `${o.valor}|${o.etiqueta}`).join("\n")}
                            rows={3}
                            className={inputClass}
                          />
                        </label>
                        <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-xs font-bold text-white disabled:opacity-60 md:col-span-2">
                          Guardar pregunta
                        </BotonGuardar>
                      </form>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <form action={moverPregunta}>
                          <input type="hidden" name="preguntaId" value={pregunta.id} />
                          <input type="hidden" name="direccion" value="arriba" />
                          <BotonGuardar textoGuardado="✓ Movido" className="rounded border border-[var(--color-line)] px-2 py-1 text-xs disabled:opacity-60">
                            ↑ Mover
                          </BotonGuardar>
                        </form>
                        <form action={moverPregunta}>
                          <input type="hidden" name="preguntaId" value={pregunta.id} />
                          <input type="hidden" name="direccion" value="abajo" />
                          <BotonGuardar textoGuardado="✓ Movido" className="rounded border border-[var(--color-line)] px-2 py-1 text-xs disabled:opacity-60">
                            ↓ Mover
                          </BotonGuardar>
                        </form>
                        <form action={eliminarPregunta}>
                          <input type="hidden" name="preguntaId" value={pregunta.id} />
                          <BotonGuardar textoGuardado="✓ Eliminado" className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 disabled:opacity-60">
                            Eliminar
                          </BotonGuardar>
                        </form>
                      </div>

                      <div className="mt-3 rounded-lg bg-[var(--color-paper-dark)] p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                          Ramificación: mostrar esta pregunta solo si…
                        </p>
                        {condicionesDePregunta.map((c) => (
                          <div key={c.id} className="mt-1 flex items-center justify-between text-xs">
                            <span>
                              &quot;{c.preguntaOrigen.etiqueta}&quot; = <strong>{c.valorEsperado}</strong>
                            </span>
                            <form action={eliminarCondicion}>
                              <input type="hidden" name="condicionId" value={c.id} />
                              <BotonGuardar textoGuardado="✓ Quitado" className="text-red-600 disabled:opacity-60">Quitar</BotonGuardar>
                            </form>
                          </div>
                        ))}
                        <form action={crearCondicion} className="mt-2 flex flex-wrap items-center gap-2">
                          <input type="hidden" name="tipoObjetivo" value="pregunta" />
                          <input type="hidden" name="objetivoId" value={pregunta.id} />
                          <select name="preguntaOrigenId" required className={`${inputClass} !mt-0 w-auto`}>
                            <option value="">Pregunta…</option>
                            {todasLasPreguntas
                              .filter((p) => p.id !== pregunta.id)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.seccionTitulo} — {p.etiqueta}
                                </option>
                              ))}
                          </select>
                          <input
                            name="valorEsperado"
                            placeholder="valor (ej. true, TUTOR)"
                            required
                            className={`${inputClass} !mt-0 w-40`}
                          />
                          <BotonGuardar textoGuardado="✓ Agregada" className="rounded border border-[var(--color-line)] bg-white px-2 py-1.5 text-xs font-bold disabled:opacity-60">
                            + Agregar condición
                          </BotonGuardar>
                        </form>
                      </div>
                    </details>
                  );
                })}
              </div>

              <details className="rounded-xl border border-dashed border-[var(--color-line)] bg-white p-3">
                <summary className="cursor-pointer text-sm font-bold text-[var(--color-green)]">
                  + Agregar pregunta
                </summary>
                <form action={crearPregunta} className="mt-3 grid gap-2 md:grid-cols-2">
                  <input type="hidden" name="seccionId" value={seccion.id} />
                  <label className="text-xs text-[var(--color-ink-soft)]">
                    Clave (única, sin espacios)
                    <input name="clave" placeholder="ej. colorFavorito" required className={inputClass} />
                  </label>
                  <label className="text-xs text-[var(--color-ink-soft)]">
                    Etiqueta (lo que ve el usuario)
                    <input name="etiqueta" required className={inputClass} />
                  </label>
                  <label className="text-xs text-[var(--color-ink-soft)]">
                    Tipo
                    <select name="tipo" required className={inputClass}>
                      {TIPOS_PREGUNTA.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-[var(--color-ink-soft)]">
                    Rol en el sistema (opcional)
                    <select name="rolSistema" className={inputClass}>
                      {ROLES_SISTEMA.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 self-end text-xs text-[var(--color-ink-soft)]">
                    <input type="checkbox" name="requerida" />
                    Obligatoria
                  </label>
                  <label className="text-xs text-[var(--color-ink-soft)] md:col-span-2">
                    Opciones (solo Opción única/múltiple) — una por línea, formato <code>valor|Etiqueta</code>
                    <textarea name="opcionesTexto" rows={3} className={inputClass} />
                  </label>
                  <BotonGuardar
                    textoGuardado="✓ Creada"
                    className="rounded-lg bg-[var(--color-green)] py-2 text-xs font-bold text-white disabled:opacity-60 md:col-span-2"
                  >
                    Crear pregunta
                  </BotonGuardar>
                </form>
              </details>

              <div className="rounded-lg bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  Ramificación: mostrar TODA esta sección solo si…
                </p>
                {condiciones
                  .filter((c) => c.seccionObjetivoId === seccion.id)
                  .map((c) => (
                    <div key={c.id} className="mt-1 flex items-center justify-between text-xs">
                      <span>
                        &quot;{c.preguntaOrigen.etiqueta}&quot; = <strong>{c.valorEsperado}</strong>
                      </span>
                      <form action={eliminarCondicion}>
                        <input type="hidden" name="condicionId" value={c.id} />
                        <BotonGuardar textoGuardado="✓ Quitado" className="text-red-600 disabled:opacity-60">Quitar</BotonGuardar>
                      </form>
                    </div>
                  ))}
                <form action={crearCondicion} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="tipoObjetivo" value="seccion" />
                  <input type="hidden" name="objetivoId" value={seccion.id} />
                  <select name="preguntaOrigenId" required className={`${inputClass} !mt-0 w-auto`}>
                    <option value="">Pregunta…</option>
                    {todasLasPreguntas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.seccionTitulo} — {p.etiqueta}
                      </option>
                    ))}
                  </select>
                  <input
                    name="valorEsperado"
                    placeholder="valor (ej. true, TUTOR)"
                    required
                    className={`${inputClass} !mt-0 w-40`}
                  />
                  <BotonGuardar textoGuardado="✓ Agregada" className="rounded border border-[var(--color-line)] px-2 py-1.5 text-xs font-bold disabled:opacity-60">
                    + Agregar condición
                  </BotonGuardar>
                </form>
              </div>
            </div>
          </details>
        ))}
      </div>

      <form
        action={crearSeccion}
        className="mt-6 grid gap-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-5 md:grid-cols-2"
      >
        <input name="titulo" placeholder="Título de la nueva sección" required className={inputClass} />
        <input name="descripcion" placeholder="Descripción (opcional)" className={inputClass} />
        <BotonGuardar
          textoGuardado="✓ Agregada"
          className="rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60 md:col-span-2"
        >
          + Agregar sección
        </BotonGuardar>
      </form>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
