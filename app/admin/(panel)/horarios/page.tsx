import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { crearBloqueHorario, actualizarBloqueHorario, eliminarBloqueHorario } from "@/lib/actions-horarios";
import { BotonGuardar } from "@/components/BotonGuardar";
import type { Prisma } from "@prisma/client";

type AulaConNivel = Prisma.AulaGetPayload<{ include: { nivel: true } }>;
type MateriaConNivel = Prisma.MateriaGetPayload<{ include: { nivel: true } }>;

export const dynamic = "force-dynamic";

const DIAS = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
];
const DIA_ORDEN: Record<string, number> = { LUNES: 0, MARTES: 1, MIERCOLES: 2, JUEVES: 3, VIERNES: 4, SABADO: 5 };

const INICIO_GRID = 7 * 60;
const FIN_GRID = 18 * 60;
const TOTAL_GRID = FIN_GRID - INICIO_GRID;

function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = (minutos % 60).toString().padStart(2, "0");
  const ampm = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}
function minutosAHora24(minutos: number): string {
  const h = Math.floor(minutos / 60).toString().padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

const PALETA = [
  { bg: "bg-sky-100", border: "border-sky-300", text: "text-sky-900" },
  { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-900" },
  { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-900" },
  { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-900" },
  { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-900" },
  { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-900" },
  { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-900" },
  { bg: "bg-fuchsia-100", border: "border-fuchsia-300", text: "text-fuchsia-900" },
];
function colorPorMateria(materiaId: string) {
  let hash = 0;
  for (let i = 0; i < materiaId.length; i++) hash = (hash * 31 + materiaId.charCodeAt(i)) >>> 0;
  return PALETA[hash % PALETA.length];
}

type SearchParams = {
  vista?: string;
  anioEscolarId?: string;
  aulaId?: string;
  docenteId?: string;
  materiaId?: string;
  diaSemana?: string;
};

export default async function HorariosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const vista = sp.vista === "grid" ? "grid" : "tabla";

  const [aulas, materias, docentes, aniosEscolares] = await Promise.all([
    prisma.aula.findMany({
      where: { activa: true },
      include: { nivel: true },
      orderBy: [{ nivel: { ordenVisual: "asc" } }, { nombre: "asc" }],
    }),
    prisma.materia.findMany({
      where: { activa: true },
      include: { nivel: true },
      orderBy: [{ nivel: { ordenVisual: "asc" } }, { nombre: "asc" }],
    }),
    prisma.adminUser.findMany({
      where: { activo: true, role: { nombre: "PROFESOR" } },
      orderBy: { nombre: "asc" },
    }),
    prisma.anioEscolar.findMany({ orderBy: { fechaInicio: "desc" } }),
  ]);

  const anioSeleccionado =
    sp.anioEscolarId || aniosEscolares.find((a) => a.activo)?.id || aniosEscolares[0]?.id || "";

  const nivelesDeAulas = Array.from(new Set(aulas.map((a) => a.nivel.nombre)));
  const nivelesDeMaterias = Array.from(new Set(materias.map((m) => m.nivel?.nombre ?? "Todos los niveles")));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            Horarios
          </h1>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            El horario se arma por aula completa. El sistema bloquea automáticamente cualquier choque
            de aula o de profesor.
          </p>
        </div>
        <a
          href="/api/oferta-academica/exportar"
          className="rounded-lg bg-[var(--color-green)] px-4 py-2.5 text-sm font-bold text-white"
        >
          Exportar oferta académica completa
        </a>
      </div>

      <div className="mt-6 flex gap-2 border-b border-[var(--color-line)]">
        <Link
          href={`/admin/horarios?vista=tabla&anioEscolarId=${anioSeleccionado}`}
          className={`rounded-t-lg px-4 py-2 text-sm font-bold ${
            vista === "tabla"
              ? "border-b-2 border-[var(--color-green)] text-[var(--color-green)]"
              : "text-[var(--color-ink-soft)]"
          }`}
        >
          Gestionar (tabla)
        </Link>
        <Link
          href={`/admin/horarios?vista=grid&anioEscolarId=${anioSeleccionado}&aulaId=${sp.aulaId || aulas[0]?.id || ""}`}
          className={`rounded-t-lg px-4 py-2 text-sm font-bold ${
            vista === "grid"
              ? "border-b-2 border-[var(--color-green)] text-[var(--color-green)]"
              : "text-[var(--color-ink-soft)]"
          }`}
        >
          Vista de horario
        </Link>
      </div>

      {aulas.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
          Aún no hay aulas activas. Creá una primero en Aulas.
        </p>
      ) : vista === "tabla" ? (
        <VistaTabla
          sp={sp}
          anioSeleccionado={anioSeleccionado}
          aulas={aulas}
          materias={materias}
          docentes={docentes}
          aniosEscolares={aniosEscolares}
          nivelesDeAulas={nivelesDeAulas}
          nivelesDeMaterias={nivelesDeMaterias}
        />
      ) : (
        <VistaGrid
          sp={sp}
          anioSeleccionado={anioSeleccionado}
          aulas={aulas}
          materias={materias}
          docentes={docentes}
          aniosEscolares={aniosEscolares}
          nivelesDeAulas={nivelesDeAulas}
          nivelesDeMaterias={nivelesDeMaterias}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VISTA DE TABLA — para gestionar mucho volumen: filtros + edición en línea
// ---------------------------------------------------------------------------

async function VistaTabla({
  sp,
  anioSeleccionado,
  aulas,
  materias,
  docentes,
  aniosEscolares,
  nivelesDeAulas,
  nivelesDeMaterias,
}: {
  sp: SearchParams;
  anioSeleccionado: string;
  aulas: AulaConNivel[];
  materias: MateriaConNivel[];
  docentes: Awaited<ReturnType<typeof prisma.adminUser.findMany>>;
  aniosEscolares: Awaited<ReturnType<typeof prisma.anioEscolar.findMany>>;
  nivelesDeAulas: string[];
  nivelesDeMaterias: string[];
}) {
  const bloques = await prisma.bloqueHorario.findMany({
    where: {
      anioEscolarId: anioSeleccionado || undefined,
      aulaId: sp.aulaId || undefined,
      docenteId: sp.docenteId || undefined,
      materiaId: sp.materiaId || undefined,
      diaSemana: (sp.diaSemana as never) || undefined,
    },
    include: { materia: true, docente: true, aula: { include: { nivel: true } } },
  });
  bloques.sort((a, b) => {
    if (a.aula.nombre !== b.aula.nombre) return a.aula.nombre.localeCompare(b.aula.nombre);
    if (DIA_ORDEN[a.diaSemana] !== DIA_ORDEN[b.diaSemana]) return DIA_ORDEN[a.diaSemana] - DIA_ORDEN[b.diaSemana];
    return a.horaInicioMin - b.horaInicioMin;
  });

  return (
    <>
      <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <input type="hidden" name="vista" value="tabla" />
        <label className="text-xs text-[var(--color-ink-soft)]">
          Año escolar
          <select name="anioEscolarId" defaultValue={anioSeleccionado} className={inputClass}>
            {aniosEscolares.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Aula
          <select name="aulaId" defaultValue={sp.aulaId ?? ""} className={inputClass}>
            <option value="">Todas</option>
            {nivelesDeAulas.map((nivelNombre) => (
              <optgroup key={nivelNombre} label={nivelNombre}>
                {aulas.filter((a) => a.nivel.nombre === nivelNombre).map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Profesor
          <select name="docenteId" defaultValue={sp.docenteId ?? ""} className={inputClass}>
            <option value="">Todos</option>
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Materia
          <select name="materiaId" defaultValue={sp.materiaId ?? ""} className={inputClass}>
            <option value="">Todas</option>
            {nivelesDeMaterias.map((nivelNombre) => (
              <optgroup key={nivelNombre} label={nivelNombre}>
                {materias.filter((m) => (m.nivel?.nombre ?? "Todos los niveles") === nivelNombre).map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Día
          <select name="diaSemana" defaultValue={sp.diaSemana ?? ""} className={inputClass}>
            <option value="">Todos</option>
            {DIAS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>
        <button className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-dark)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]">
          Filtrar
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-[var(--color-paper-dark)] text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-3 py-2">Aula</th>
              <th className="px-3 py-2">Materia</th>
              <th className="px-3 py-2">Profesor</th>
              <th className="px-3 py-2">Día</th>
              <th className="px-3 py-2">Inicio</th>
              <th className="px-3 py-2">Fin</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {bloques.map((b) => {
              const formId = `form-bloque-${b.id}`;
              return (
                <tr key={b.id} className="border-t border-[var(--color-line)]">
                  <td className="px-2 py-1.5 text-xs text-[var(--color-ink-soft)]">
                    {b.aula.nombre} <span className="opacity-70">· {b.aula.nivel.nombre}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <select form={formId} name="materiaId" defaultValue={b.materiaId} className={cellInput}>
                      {materias.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select form={formId} name="docenteId" defaultValue={b.docenteId ?? ""} className={cellInput}>
                      <option value="">Sin asignar</option>
                      {docentes.map((d) => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select form={formId} name="diaSemana" defaultValue={b.diaSemana} className={cellInput}>
                      {DIAS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      form={formId}
                      type="time"
                      name="horaInicio"
                      defaultValue={minutosAHora24(b.horaInicioMin)}
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      form={formId}
                      type="time"
                      name="horaFin"
                      defaultValue={minutosAHora24(b.horaFinMin)}
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <button form={formId} className="rounded-lg bg-[var(--color-green)] px-2.5 py-1.5 text-xs font-bold text-white">
                      Guardar
                    </button>
                    <form id={formId} action={actualizarBloqueHorario} className="hidden">
                      <input type="hidden" name="bloqueId" value={b.id} />
                    </form>
                    <form action={eliminarBloqueHorario} className="mt-1">
                      <input type="hidden" name="bloqueId" value={b.id} />
                      <BotonGuardar textoGuardado="✓ Quitado" className="text-xs font-bold text-red-600 disabled:opacity-60">
                        Quitar
                      </BotonGuardar>
                    </form>
                  </td>
                </tr>
              );
            })}
            {bloques.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  Ningún bloque coincide con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
          + Agregar bloque nuevo
        </p>
        <form action={crearBloqueHorario} className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <input type="hidden" name="anioEscolarId" value={anioSeleccionado} />
          <select name="aulaId" required className={cellInput}>
            <option value="">Aula…</option>
            {nivelesDeAulas.map((nivelNombre) => (
              <optgroup key={nivelNombre} label={nivelNombre}>
                {aulas.filter((a) => a.nivel.nombre === nivelNombre).map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select name="materiaId" required className={cellInput}>
            <option value="">Materia…</option>
            {nivelesDeMaterias.map((nivelNombre) => (
              <optgroup key={nivelNombre} label={nivelNombre}>
                {materias.filter((m) => (m.nivel?.nombre ?? "Todos los niveles") === nivelNombre).map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select name="docenteId" className={cellInput}>
            <option value="">Sin asignar</option>
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
          <select name="diaSemana" required className={cellInput}>
            {DIAS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <input type="time" name="horaInicio" required className={cellInput} />
          <input type="time" name="horaFin" required className={cellInput} />
          <BotonGuardar
            textoGuardado="✓ Agregado"
            className="col-span-2 rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60 md:col-span-6"
          >
            Agregar bloque
          </BotonGuardar>
        </form>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// VISTA DE CUADRÍCULA — visual, por aula, para mirar/imprimir de un vistazo
// ---------------------------------------------------------------------------

async function VistaGrid({
  sp,
  anioSeleccionado,
  aulas,
  aniosEscolares,
  nivelesDeAulas,
}: {
  sp: SearchParams;
  anioSeleccionado: string;
  aulas: AulaConNivel[];
  materias: MateriaConNivel[];
  docentes: Awaited<ReturnType<typeof prisma.adminUser.findMany>>;
  aniosEscolares: Awaited<ReturnType<typeof prisma.anioEscolar.findMany>>;
  nivelesDeAulas: string[];
  nivelesDeMaterias: string[];
}) {
  const aulaSeleccionada = sp.aulaId || aulas[0]?.id || "";

  const bloques =
    aulaSeleccionada && anioSeleccionado
      ? await prisma.bloqueHorario.findMany({
          where: { aulaId: aulaSeleccionada, anioEscolarId: anioSeleccionado },
          include: { materia: true, docente: true },
          orderBy: [{ diaSemana: "asc" }, { horaInicioMin: "asc" }],
        })
      : [];

  const horasDeReferencia: number[] = [];
  for (let m = INICIO_GRID; m <= FIN_GRID; m += 60) horasDeReferencia.push(m);

  return (
    <>
      <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <input type="hidden" name="vista" value="grid" />
        <label className="text-xs text-[var(--color-ink-soft)]">
          Aula
          <select name="aulaId" defaultValue={aulaSeleccionada} className={inputClass}>
            {nivelesDeAulas.map((nivelNombre) => (
              <optgroup key={nivelNombre} label={nivelNombre}>
                {aulas.filter((a) => a.nivel.nombre === nivelNombre).map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--color-ink-soft)]">
          Año escolar
          <select name="anioEscolarId" defaultValue={anioSeleccionado} className={inputClass}>
            {aniosEscolares.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </label>
        <button className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-dark)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]">
          Ver
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
        <div className="grid min-w-[720px] grid-cols-[56px_repeat(6,1fr)]">
          <div className="border-b border-r border-[var(--color-line)] bg-[var(--color-paper-dark)]" />
          {DIAS.map((d) => (
            <div key={d.value} className="border-b border-r border-[var(--color-line)] bg-[var(--color-paper-dark)] px-2 py-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)] last:border-r-0">
              {d.label}
            </div>
          ))}

          <div className="relative border-r border-[var(--color-line)]" style={{ height: `${TOTAL_GRID}px` }}>
            {horasDeReferencia.map((m) => (
              <div key={m} className="absolute left-0 right-0 -translate-y-1/2 px-1 text-right text-[10px] text-[var(--color-ink-soft)]" style={{ top: `${((m - INICIO_GRID) / TOTAL_GRID) * 100}%` }}>
                {minutosAHora(m)}
              </div>
            ))}
          </div>

          {DIAS.map((d) => {
            const bloquesDelDia = bloques.filter((b) => b.diaSemana === d.value);
            return (
              <div key={d.value} className="relative border-r border-[var(--color-line)] last:border-r-0" style={{ height: `${TOTAL_GRID}px` }}>
                {horasDeReferencia.map((m) => (
                  <div key={m} className="absolute left-0 right-0 border-t border-dashed border-[var(--color-line)]" style={{ top: `${((m - INICIO_GRID) / TOTAL_GRID) * 100}%` }} />
                ))}
                {bloquesDelDia.map((b) => {
                  const color = colorPorMateria(b.materiaId);
                  const top = ((b.horaInicioMin - INICIO_GRID) / TOTAL_GRID) * 100;
                  const alto = ((b.horaFinMin - b.horaInicioMin) / TOTAL_GRID) * 100;
                  return (
                    <div key={b.id} className={`absolute left-0.5 right-0.5 overflow-hidden rounded-md border px-1.5 py-1 text-[11px] leading-tight ${color.bg} ${color.border} ${color.text}`} style={{ top: `${top}%`, height: `${alto}%` }}>
                      <p className="font-bold">{b.materia.nombre}</p>
                      <p className="opacity-80">{minutosAHora(b.horaInicioMin)}–{minutosAHora(b.horaFinMin)}</p>
                      {b.docente && <p className="truncate opacity-80">{b.docente.nombre}</p>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
        Para editar o quitar bloques, usá la pestaña &quot;Gestionar (tabla)&quot;.
      </p>
    </>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
const cellInput =
  "w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm outline-none focus:border-[var(--color-green)]";
