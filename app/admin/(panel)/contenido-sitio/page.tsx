import { prisma } from "@/lib/prisma";
import {
  actualizarQuienesSomos,
  subirImagenSitio,
  eliminarImagenSitio,
} from "@/lib/actions-contenido-sitio";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function ContenidoSitioPage() {
  const [quienesSomos, imagenesHero, imagenesQuienesSomos, imagenesGaleria, niveles] = await Promise.all([
    prisma.contenidoQuienesSomos.findFirst(),
    prisma.imagenSitio.findMany({ where: { seccion: "HERO" }, orderBy: { orden: "asc" } }),
    prisma.imagenSitio.findMany({ where: { seccion: "QUIENES_SOMOS" }, orderBy: { orden: "asc" } }),
    prisma.imagenSitio.findMany({ where: { seccion: "GALERIA" }, orderBy: { orden: "asc" } }),
    prisma.nivel.findMany({
      where: { activo: true },
      orderBy: { ordenVisual: "asc" },
      include: { imagenes: { orderBy: { orden: "asc" } } },
    }),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Contenido del sitio
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Los textos e imágenes que se muestran en la página principal del colegio.
      </p>

      {/* QUIÉNES SOMOS */}
      <section className="mt-8 rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Quiénes somos
        </h2>
        <form action={actualizarQuienesSomos} className="mt-3 space-y-3">
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Misión
            <textarea name="mision" rows={4} defaultValue={quienesSomos?.mision ?? ""} className={inputClass} />
          </label>
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Visión
            <textarea name="vision" rows={4} defaultValue={quienesSomos?.vision ?? ""} className={inputClass} />
          </label>
          <label className="block text-xs text-[var(--color-ink-soft)]">
            Valores (uno por línea)
            <textarea
              name="valores"
              rows={6}
              defaultValue={(quienesSomos?.valores ?? []).join("\n")}
              className={inputClass}
            />
          </label>
          <BotonGuardar className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            Guardar textos
          </BotonGuardar>
        </form>
      </section>

      {/* IMÁGENES DEL HERO */}
      <GaleriaSeccion
        titulo="Imágenes del hero (carrusel principal)"
        descripcion="La primera imagen que ve el visitante, arriba de todo."
        imagenes={imagenesHero}
        seccion="HERO"
      />

      {/* IMAGEN DE INFRAESTRUCTURA (Quiénes somos) */}
      <GaleriaSeccion
        titulo="Infraestructura del colegio (sección Quiénes somos)"
        descripcion="Foto(s) de la fachada, patio o instalaciones."
        imagenes={imagenesQuienesSomos}
        seccion="QUIENES_SOMOS"
      />

      {/* GALERÍA "UN VISTAZO POR DENTRO" */}
      <GaleriaSeccion
        titulo='Galería "Un vistazo por dentro"'
        descripcion="Podés subir tantas fotos como quieras — todas se muestran en esa sección."
        imagenes={imagenesGaleria}
        seccion="GALERIA"
      />

      {/* IMÁGENES POR NIVEL */}
      <section className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Fotos de los salones por nivel
        </h2>
        <div className="mt-3 space-y-4">
          {niveles.map((nivel) => (
            <div key={nivel.id} className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
              <p className="font-semibold text-[var(--color-ink)]">{nivel.nombre}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {nivel.imagenes.map((img) => (
                  <div key={img.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt ?? ""} className="h-24 w-24 rounded-lg object-cover" />
                    <form action={eliminarImagenSitio} className="absolute -right-2 -top-2">
                      <input type="hidden" name="imagenId" value={img.id} />
                      <button className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                        ×
                      </button>
                    </form>
                  </div>
                ))}
              </div>
              <form action={subirImagenSitio} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="nivelId" value={nivel.id} />
                <input type="file" name="archivo" accept="image/*" required className="text-xs" />
                <BotonGuardar textoGuardado="✓ Subida" className="rounded-lg bg-[var(--color-green)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                  Subir foto
                </BotonGuardar>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function GaleriaSeccion({
  titulo,
  descripcion,
  imagenes,
  seccion,
}: {
  titulo: string;
  descripcion: string;
  imagenes: { id: string; url: string; alt: string | null }[];
  seccion: string;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">{titulo}</h2>
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{descripcion}</p>

      <div className="mt-3 flex flex-wrap gap-3">
        {imagenes.map((img) => (
          <div key={img.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt ?? ""} className="h-24 w-24 rounded-lg object-cover" />
            <form action={eliminarImagenSitio} className="absolute -right-2 -top-2">
              <input type="hidden" name="imagenId" value={img.id} />
              <button className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                ×
              </button>
            </form>
          </div>
        ))}
        {imagenes.length === 0 && (
          <p className="text-xs text-[var(--color-ink-soft)]">Aún no hay fotos aquí.</p>
        )}
      </div>

      <form action={subirImagenSitio} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="seccion" value={seccion} />
        <input type="file" name="archivo" accept="image/*" required className="text-xs" />
        <input name="alt" placeholder="Descripción (opcional)" className="rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-xs" />
        <BotonGuardar textoGuardado="✓ Subida" className="rounded-lg bg-[var(--color-green)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
          Subir foto
        </BotonGuardar>
      </form>
    </section>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
