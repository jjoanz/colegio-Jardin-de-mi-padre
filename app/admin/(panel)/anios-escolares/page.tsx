import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { crearAnioEscolar, actualizarAnioEscolar } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function AniosEscolaresPage() {
  const session = await auth();
  const usuario = session?.user as { permisos?: string[] } | undefined;
  const permisos = usuario?.permisos ?? [];
  const puedeCrear = permisos.includes("oferta_academica:crear");
  const puedeEditar = permisos.includes("oferta_academica:editar");

  const aniosEscolares = await prisma.anioEscolar.findMany({ orderBy: { fechaInicio: "desc" } });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Años escolares
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Cada año escolar agrupa las aulas y matrículas de ese periodo.
      </p>

      <div className="mt-8 space-y-2">
        {aniosEscolares.map((a) => (
          <details
            key={a.id}
            className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
              <p className="font-semibold text-[var(--color-ink)]">{a.nombre}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  a.activo
                    ? "bg-[var(--color-paper-dark)] text-[var(--color-green)]"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {a.activo ? "Activo" : "Inactivo"}
              </span>
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
        ))}
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
