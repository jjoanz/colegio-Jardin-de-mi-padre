import { prisma } from "@/lib/prisma";
import { crearPublicacion, actualizarPublicacion, eliminarPublicacion } from "@/lib/actions-publicaciones";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function PublicacionesPage() {
  const publicaciones = await prisma.publicacion.findMany({
    orderBy: { fecha: "desc" },
    include: { autor: true },
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Publicaciones
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Noticias y anuncios que aparecen en la página principal del colegio. Solo las marcadas
        como &quot;Publicada&quot; se muestran al público.
      </p>

      <div className="mt-8 space-y-3">
        {publicaciones.map((p) => (
          <details key={p.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{p.titulo}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  {p.fecha.toLocaleDateString("es-DO")}
                  {p.autor && ` · ${p.autor.nombre}`}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  p.publicada
                    ? "bg-[var(--color-paper-dark)] text-[var(--color-green)]"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {p.publicada ? "Publicada" : "Borrador"}
              </span>
            </summary>

            <form
              action={actualizarPublicacion}
              className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4"
            >
              <input type="hidden" name="publicacionId" value={p.id} />
              <label className="text-xs text-[var(--color-ink-soft)]">
                Título
                <input name="titulo" defaultValue={p.titulo} required className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Resumen (aparece en la tarjeta de la página principal)
                <textarea name="resumen" defaultValue={p.resumen} rows={2} required className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Contenido completo
                <textarea name="contenido" defaultValue={p.contenido} rows={5} required className={inputClass} />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Foto
                  {p.imagenUrl && <img src={p.imagenUrl} alt="" className="mt-1 mb-2 h-20 w-full rounded-lg object-cover" />}
                  <input type="file" name="foto" accept="image/*" className={inputClass} />
                </label>
                <label className="text-xs text-[var(--color-ink-soft)]">
                  Fecha
                  <input type="date" name="fecha" defaultValue={p.fecha.toISOString().slice(0, 10)} className={inputClass} />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
                <input type="checkbox" name="publicada" defaultChecked={p.publicada} />
                Publicada (visible en la página principal)
              </label>
              <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60">
                Guardar cambios
              </BotonGuardar>
            </form>

            <form action={eliminarPublicacion} className="border-t border-[var(--color-line)] p-4">
              <input type="hidden" name="publicacionId" value={p.id} />
              <BotonGuardar
                textoGuardado="✓ Eliminada"
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Eliminar publicación
              </BotonGuardar>
            </form>
          </details>
        ))}
        {publicaciones.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay publicaciones creadas.
          </p>
        )}
      </div>

      <details className="mt-8 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-5">
        <summary className="cursor-pointer text-sm font-bold text-[var(--color-green)]">
          + Nueva publicación
        </summary>
        <form action={crearPublicacion} className="mt-4 grid gap-3">
          <label className="text-xs text-[var(--color-ink-soft)]">
            Título
            <input name="titulo" required className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Resumen (aparece en la tarjeta de la página principal)
            <textarea name="resumen" rows={2} required className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Contenido completo
            <textarea name="contenido" rows={5} required className={inputClass} />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-[var(--color-ink-soft)]">
              Foto
              <input type="file" name="foto" accept="image/*" className={inputClass} />
            </label>
            <label className="text-xs text-[var(--color-ink-soft)]">
              Fecha
              <input type="date" name="fecha" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
            <input type="checkbox" name="publicada" />
            Publicada (visible en la página principal)
          </label>
          <BotonGuardar
            textoGuardado="✓ Creada"
            className="rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            Crear publicación
          </BotonGuardar>
        </form>
      </details>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
