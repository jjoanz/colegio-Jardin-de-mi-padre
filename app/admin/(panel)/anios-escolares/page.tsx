import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { crearAnioEscolar, actualizarAnioEscolar } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";
import { obtenerDatosPeriodo } from "@/lib/periodos";

export const dynamic = "force-dynamic";

export default async function AniosEscolaresPage() {
  const session = await auth();
  const usuario = session?.user as { permisos?: string[] } | undefined;
  const permisos = usuario?.permisos ?? [];
  const puedeCrear = permisos.includes("oferta_academica:crear");
  const puedeEditar = permisos.includes("oferta_academica:editar");

  const aniosEscolares = await prisma.anioEscolar.findMany({ orderBy: { fechaInicio: "desc" } });
  const resumenes = await Promise.all(aniosEscolares.map((a) => obtenerDatosPeriodo(a.id)));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            Períodos académicos
          </h1>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            Cada año escolar agrupa las aulas, matrículas y cuentas por cobrar de ese período.
          </p>
        </div>
        <Link
          href="/admin/cierres-periodo"
          className="rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
        >
          Ver cierres de períodos
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {aniosEscolares.map((a, i) => {
          const { resumen } = resumenes[i];
          return (
          <details
            key={a.id}
            className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-[var(--color-ink)]">{a.nombre}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    a.estadoCierre === "CERRADO"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-[var(--color-paper-dark)] text-[var(--color-green)]"
                  }`}
                >
                  {a.estadoCierre === "CERRADO" ? "Cerrado" : "Abierto"}
                </span>
                {!a.activo && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                    Inactivo
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-right text-xs">
                <div>
                  <p className="text-[var(--color-ink-soft)]">Facturado</p>
                  <p className="font-mono font-semibold text-[var(--color-ink)]">
                    RD$ {resumen.totalCargos.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-ink-soft)]">Cobrado</p>
                  <p className="font-mono font-semibold text-[var(--color-green)]">
                    RD$ {resumen.totalPagado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-ink-soft)]">Por cobrar</p>
                  <p
                    className={`font-mono font-semibold ${
                      resumen.totalPendiente > 0 ? "text-red-600" : "text-[var(--color-green)]"
                    }`}
                  >
                    RD$ {resumen.totalPendiente.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-ink-soft)]">Estudiantes</p>
                  <p className="font-mono font-semibold text-[var(--color-ink)]">{resumen.totalEstudiantes}</p>
                </div>
                <Link
                  href={`/admin/anios-escolares/${a.id}`}
                  className="rounded-lg bg-[var(--color-green)] px-3 py-1.5 text-xs font-bold text-white"
                >
                  Ver período
                </Link>
              </div>
            </summary>
            {puedeEditar ? (
              <form
                action={actualizarAnioEscolar}
                className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2"
              >
                <input type="hidden" name="anioEscolarId" value={a.id} />
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Nombre
                  <input name="nombre" defaultValue={a.nombre} required className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Fecha inicio
                  <input
                    name="fechaInicio"
                    type="date"
                    defaultValue={a.fechaInicio.toISOString().slice(0, 10)}
                    required
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Fecha fin
                  <input
                    name="fechaFin"
                    type="date"
                    defaultValue={a.fechaFin.toISOString().slice(0, 10)}
                    required
                    className={inputClass}
                  />
                </label>
                <label className="flex items-center gap-2 self-end text-xs text-[var(--color-ink-soft)]">
                  <input type="checkbox" name="activo" defaultChecked={a.activo} />
                  Año escolar activo
                </label>
                <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60 md:col-span-2">
                  Guardar cambios
                </BotonGuardar>
              </form>
            ) : (
              <div className="border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 text-xs text-[var(--color-ink-soft)]">
                {a.fechaInicio.toLocaleDateString("es-DO")} — {a.fechaFin.toLocaleDateString("es-DO")}
              </div>
            )}
          </details>
          );
        })}
        {aniosEscolares.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-6 text-center text-sm text-[var(--color-ink-soft)]">
            Aún no hay años escolares creados. Crea el primero abajo.
          </p>
        )}
      </div>

      {puedeCrear && (
        <form
          action={crearAnioEscolar}
          className="mt-6 space-y-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-5"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
            Nuevo año escolar
          </p>
          <input name="nombre" placeholder="Nombre (ej. 2026-2027)" required className={inputClass} />
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Fecha inicio
            <input name="fechaInicio" type="date" required className={inputClass} />
          </label>
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Fecha fin
            <input name="fechaFin" type="date" required className={inputClass} />
          </label>
          <BotonGuardar
            textoGuardado="✓ Creado"
            className="w-full rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            Crear año escolar
          </BotonGuardar>
        </form>
      )}
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
