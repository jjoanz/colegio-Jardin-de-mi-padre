import { prisma } from "@/lib/prisma";
import { crearDocumentoInstitucional, eliminarDocumentoInstitucional } from "@/lib/actions-documentos-institucionales";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

const ETIQUETA_TIPO: Record<string, string> = {
  POA: "POA (Plan Operativo Anual)",
  PROYECTO_EDUCATIVO: "Proyecto educativo",
};

export default async function PoaProyectosPage() {
  const [documentos, aniosEscolares] = await Promise.all([
    prisma.documentoInstitucional.findMany({
      orderBy: { creadoEn: "desc" },
      include: { anioEscolar: true, subidoPor: true },
    }),
    prisma.anioEscolar.findMany({ orderBy: { nombre: "desc" } }),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        POA y proyectos educativos
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Espacio para cargar el Plan Operativo Anual y los proyectos educativos del centro.
      </p>

      <div className="mt-8 space-y-3">
        {documentos.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3.5">
            <div>
              <p className="font-semibold text-[var(--color-ink)]">{d.titulo}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {ETIQUETA_TIPO[d.tipo]}
                {d.anioEscolar && ` · ${d.anioEscolar.nombre}`}
                {d.subidoPor && ` · Subido por ${d.subidoPor.nombre}`}
              </p>
              {d.descripcion && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{d.descripcion}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={d.archivoUrl}
                target="_blank"
                className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
              >
                Ver archivo
              </a>
              <form action={eliminarDocumentoInstitucional}>
                <input type="hidden" name="documentoId" value={d.id} />
                <BotonGuardar
                  textoGuardado="✓ Eliminado"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  Eliminar
                </BotonGuardar>
              </form>
            </div>
          </div>
        ))}
        {documentos.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay documentos cargados.
          </p>
        )}
      </div>

      <details className="mt-8 rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-5">
        <summary className="cursor-pointer text-sm font-bold text-[var(--color-green)]">
          + Cargar documento
        </summary>
        <form action={crearDocumentoInstitucional} className="mt-4 grid gap-3">
          <label className="text-xs text-[var(--color-ink-soft)]">
            Título
            <input name="titulo" required className={inputClass} />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-[var(--color-ink-soft)]">
              Tipo
              <select name="tipo" required defaultValue="POA" className={inputClass}>
                <option value="POA">POA (Plan Operativo Anual)</option>
                <option value="PROYECTO_EDUCATIVO">Proyecto educativo</option>
              </select>
            </label>
            <label className="text-xs text-[var(--color-ink-soft)]">
              Año escolar
              <select name="anioEscolarId" className={inputClass}>
                <option value="">Sin año específico</option>
                {aniosEscolares.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Descripción (opcional)
            <textarea name="descripcion" rows={2} className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Archivo (PDF u otro documento)
            <input type="file" name="archivo" required className={inputClass} />
          </label>
          <BotonGuardar textoGuardado="✓ Cargado" className="rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60">
            Cargar documento
          </BotonGuardar>
        </form>
      </details>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
