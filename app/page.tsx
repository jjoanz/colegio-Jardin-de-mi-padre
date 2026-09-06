import Link from "next/link";
import { PhotoSlot } from "@/components/PhotoSlot";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Faq } from "@/components/Faq";
import { ImageCarouselSimple } from "@/components/ImageCarouselSimple";
import { IconArrowRight } from "@/components/Icons";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Colegio Ejemplo";

const NIVELES_FALLBACK = [
  { id: "inicial", nombre: "Maternal", nota: "1 a 2 años" },
  { id: "primaria", nombre: "Pre-Kínder", nota: "3 a 4 años" },
  { id: "secundaria", nombre: "Kínder", nota: "5 años" },
];

async function getNiveles() {
  try {
    const niveles = await prisma.nivel.findMany({
      where: { activo: true },
      orderBy: { ordenVisual: "asc" },
    });
    if (niveles.length === 0) return null;
    return niveles.map((n) => ({ id: n.id, nombre: n.nombre }));
  } catch {
    return null;
  }
}

async function getActividadesDestacadas() {
  try {
    const actividades = await prisma.actividad.findMany({
      where: { activa: true, fechaFin: { gte: new Date() } },
      orderBy: { fechaInicio: "asc" },
      take: 3,
    });
    return actividades.map((a) => ({ id: a.id, nombre: a.nombre, fechaInicio: a.fechaInicio, imagenUrl: a.imagenUrl }));
  } catch {
    return [];
  }
}

async function getProgramaCuidoDestacado() {
  try {
    const programa = await prisma.programaCuido.findFirst({
      where: { activo: true, imagenUrl: { not: null } },
      orderBy: { nombre: "asc" },
    });
    return programa ? { imagenUrl: programa.imagenUrl } : null;
  } catch {
    return null;
  }
}

async function getPublicaciones() {
  try {
    const publicaciones = await prisma.publicacion.findMany({
      where: { publicada: true },
      orderBy: { fecha: "desc" },
      take: 3,
    });
    return publicaciones;
  } catch {
    return [];
  }
}

async function getContenidoQuienesSomos() {
  try {
    return await prisma.contenidoQuienesSomos.findFirst();
  } catch {
    return null;
  }
}

async function getImagenesPorSeccion(seccion: "HERO" | "QUIENES_SOMOS" | "GALERIA") {
  try {
    const imagenes = await prisma.imagenSitio.findMany({
      where: { seccion, activa: true },
      orderBy: { orden: "asc" },
    });
    return imagenes.map((i) => ({ url: i.url, alt: i.alt }));
  } catch {
    return [];
  }
}

async function getNivelesConImagenes() {
  try {
    const niveles = await prisma.nivel.findMany({
      where: { activo: true },
      orderBy: { ordenVisual: "asc" },
      include: { imagenes: { where: { activa: true }, orderBy: { orden: "asc" }, take: 1 } },
    });
    return niveles.map((n) => ({ id: n.id, nombre: n.nombre, imagen: n.imagenes[0] ?? null }));
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const niveles = await getNiveles();
  const actividades = await getActividadesDestacadas();
  const programaCuido = await getProgramaCuidoDestacado();
  const publicaciones = await getPublicaciones();
  const quienesSomos = await getContenidoQuienesSomos();
  const imagenesHero = await getImagenesPorSeccion("HERO");
  const imagenesQuienesSomos = await getImagenesPorSeccion("QUIENES_SOMOS");
  const imagenesGaleria = await getImagenesPorSeccion("GALERIA");
  const nivelesConImagenes = await getNivelesConImagenes();

  return (
    <div className="bg-white">
      <SiteHeader />
      <Hero imagenes={imagenesHero} />
      <TrustBar />

      <QuienesSomos contenido={quienesSomos} imagenes={imagenesQuienesSomos} />
      <PorQueElegirnos />
      <Niveles niveles={niveles} nivelesConImagenes={nivelesConImagenes} />
      <TimelineInscripcion />
      <Galeria imagenes={imagenesGaleria} />
      <CuidoYActividades actividades={actividades} imagenCuido={programaCuido?.imagenUrl ?? null} />
      <Testimonios />
      <Ubicacion />
      <FaqSection />
      {publicaciones.length > 0 && <Publicaciones publicaciones={publicaciones} />}
      <CtaFinal />
      <SiteFooter />
    </div>
  );
}

/* ============================================================================
   HERO — pieza única, de alto impacto. Sin auto-rotación: un solo mensaje,
   máxima claridad, con prueba social flotante y elementos de profundidad.
============================================================================ */
function Hero({ imagenes }: { imagenes: { url: string; alt: string | null }[] }) {
  return (
    <section className="relative overflow-hidden bg-[#05070D] pb-24 pt-10 md:pb-32 md:pt-16">
      {/* Malla de gradientes difusos, estilo Linear/Vercel */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-[var(--color-sky)]/30 blur-[120px]" />
        <div className="absolute right-[-10%] top-[10%] h-[420px] w-[420px] rounded-full bg-[var(--color-coral)]/25 blur-[110px]" />
        <div className="absolute bottom-[-15%] left-[20%] h-[460px] w-[460px] rounded-full bg-[var(--color-leaf)]/20 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-16 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-leaf)]" />
              Admisiones abiertas · 2026-2027
            </span>

            <h1 className="mt-7 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-[3.5rem]">
              Formando Niños 
              <br />
              <span className="bg-gradient-to-r from-[var(--color-sky)] via-white to-[var(--color-coral)] bg-clip-text text-transparent">
                y Niñas Integros. 
              </span>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/60">
              {SCHOOL_NAME} Educación en valores cristianos
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/inscripcion"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-[#05070D] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20px_40px_-12px_rgba(255,255,255,0.25)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Iniciar inscripción
                <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#niveles"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                Ver niveles
              </a>
            </div>

            <div className="mt-12 flex items-center gap-6 border-t border-white/10 pt-6">
              <Stat numero="100%" texto="Docentes certificados" dark />
              <div className="h-8 w-px bg-white/10" />
              <Stat numero="7am–6pm" texto="Cuido extendido" dark />
            </div>
          </div>

          <div className="relative">
            {imagenes.length > 0 ? (
              <ImageCarouselSimple imagenes={imagenes} aspectClass="aspect-[4/5]" className="shadow-2xl" />
            ) : (
              <PhotoSlot label="Foto: estudiantes en el aula" aspect="portrait" tone="sky" className="shadow-2xl" />
            )}

            {/* Tarjeta flotante — glassmorphism */}
            <div className="absolute -left-6 bottom-8 w-52 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-leaf)]/20 text-[var(--color-leaf)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                
              </div>
              
            </div>

            <div className="absolute -right-4 -top-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl">
              <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">3 niveles</p>
              <p className="text-[11px] text-white/50">De Maternal a Kínder</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ numero, texto, dark = false }: { numero: string; texto: string; dark?: boolean }) {
  return (
    <div>
      <p
        className={`font-[family-name:var(--font-display)] text-xl font-semibold ${
          dark ? "text-white" : "text-[var(--color-ink)]"
        }`}
      >
        {numero}
      </p>
      <p className={`text-[11px] font-medium ${dark ? "text-white/45" : "text-[var(--color-ink-soft)]"}`}>
        {texto}
      </p>
    </div>
  );
}

/* ============================================================================
   BARRA DE CONFIANZA
============================================================================ */
function TrustBar() {
  const items = ["Docentes certificados", "Currículo bilingüe", "Seguridad 24/7", "Portal de pagos digital"];
  return (
    <section className="border-b border-[var(--color-ink)]/6 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink-soft)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-leaf)]" />
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================================
   QUIÉNES SOMOS
============================================================================ */
function QuienesSomos({
  contenido,
  imagenes,
}: {
  contenido: { mision: string; vision: string; valores: string[] } | null;
  imagenes: { url: string; alt: string | null }[];
}) {
  const mision =
    contenido?.mision ||
    "Formar niños y niñas íntegros, con valores y principios cristianos, capaces de crear y construir una educación de calidad para desarrollar habilidades, actitudes y valores con el fin de desempeñarse e integrarse eficazmente al nivel familiar, social y ambiental.";
  const vision =
    contenido?.vision ||
    "Ser una institución líder en la formación integral y espiritual, con excelencia académica, formando niños y niñas críticos, éticos y capaces de liderar cambios positivos para la vida a nivel personal, social y ambiental.";
  const valores =
    contenido?.valores && contenido.valores.length > 0
      ? contenido.valores
      : [
          "Amor por sí mismo y los demás",
          "Pensamiento crítico y honestidad",
          "Responsabilidad y compromiso",
          "Empatía y solidaridad",
          "Respeto y tolerancia",
          "Sostenibilidad y conciencia ambiental",
        ];

  return (
    <section className="bg-[var(--color-cream)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <SectionEyebrow color="coral">Quiénes somos</SectionEyebrow>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Formación integral, con propósito claro
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <ScrollReveal>
            {imagenes.length > 0 ? (
              <ImageCarouselSimple imagenes={imagenes} aspectClass="aspect-[4/5]" />
            ) : (
              <PhotoSlot label="Foto: infraestructura del colegio" aspect="portrait" tone="coral" />
            )}
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2">
            <ScrollReveal delay={80}>
              <div className="h-full rounded-3xl border border-[var(--color-ink)]/6 bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_20px_40px_-16px_rgba(0,0,0,0.12)]">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
                  Misión
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-ink-soft)]">{mision}</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <div className="h-full rounded-3xl border border-[var(--color-ink)]/6 bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_20px_40px_-16px_rgba(0,0,0,0.12)]">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
                  Visión
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-ink-soft)]">{vision}</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={240} className="sm:col-span-2">
              <div className="rounded-3xl bg-[var(--color-ink)] p-8 text-white">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">Valores</h3>
                <ul className="mt-4 grid gap-2.5 text-sm text-white/70 sm:grid-cols-2">
                  {valores.map((v) => (
                    <li key={v} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-sun)]" />
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionEyebrow({ children, color = "sky" }: { children: React.ReactNode; color?: "sky" | "coral" | "leaf" | "sun" }) {
  const colors: Record<string, string> = {
    sky: "text-[var(--color-sky-deep)]",
    coral: "text-[var(--color-coral)]",
    leaf: "text-[var(--color-leaf-deep)]",
    sun: "text-[var(--color-sun-deep)]",
  };
  return <span className={`text-xs font-bold uppercase tracking-[0.14em] ${colors[color]}`}>{children}</span>;
}

/* ============================================================================
   POR QUÉ ELEGIRNOS — bento grid
============================================================================ */
function PorQueElegirnos() {
  const items = [
    {
      titulo: "Desarrollo integral",
      texto: "Programas que equilibran lo académico, lo emocional y lo social desde la primera etapa.",
      big: true,
    },
    { titulo: "Docentes certificados", texto: "Formación en primera infancia, acompañando de cerca a cada estudiante." },
    { titulo: "Instalaciones seguras", texto: "Espacios diseñados y supervisados pensando en la seguridad de niños pequeños." },
    { titulo: "Portal digital de familias", texto: "Sigue pagos, actividades y comunicados desde el celular." },
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <SectionEyebrow>Por qué {SCHOOL_NAME}</SectionEyebrow>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Un ambiente pensado para crecer con confianza
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((item, i) => (
            <ScrollReveal
              key={item.titulo}
              delay={i * 90}
              className={item.big ? "md:col-span-2" : ""}
            >
              <div
                className={`group relative h-full overflow-hidden rounded-3xl border border-[var(--color-ink)]/6 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.15)] ${
                  item.big ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-cream)]"
                }`}
              >
                <div
                  className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-80 ${
                    item.big ? "bg-[var(--color-sky)]/40" : "bg-[var(--color-sun)]/25"
                  }`}
                />
                <h3
                  className={`relative font-[family-name:var(--font-display)] text-xl font-semibold ${
                    item.big ? "text-white" : "text-[var(--color-ink)]"
                  }`}
                >
                  {item.titulo}
                </h3>
                <p className={`relative mt-2 text-sm leading-relaxed ${item.big ? "text-white/60" : "text-[var(--color-ink-soft)]"}`}>
                  {item.texto}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   NIVELES
============================================================================ */
function Niveles({
  niveles,
  nivelesConImagenes,
}: {
  niveles: { id: string; nombre: string }[] | null;
  nivelesConImagenes: { id: string; nombre: string; imagen: { url: string; alt: string | null } | null }[] | null;
}) {
  const tonos: Array<"sky" | "coral" | "sun"> = ["sky", "coral", "sun"];
  return (
    <section id="niveles" className="bg-[var(--color-cream)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <SectionEyebrow color="leaf">Servicios</SectionEyebrow>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Un salón para cada edad
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {(niveles ?? NIVELES_FALLBACK).map((nivel, i) => {
            const imagenReal = nivelesConImagenes?.find((n) => n.id === nivel.id)?.imagen;
            return (
              <ScrollReveal key={nivel.id ?? i} delay={i * 100}>
                <div className="group overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_56px_-24px_rgba(0,0,0,0.18)]">
                  <div className="overflow-hidden">
                    <div className="transition-transform duration-500 group-hover:scale-105">
                      {imagenReal ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imagenReal.url} alt={imagenReal.alt ?? nivel.nombre} className="aspect-video w-full object-cover" />
                      ) : (
                        <PhotoSlot label={`Foto: salón de ${nivel.nombre}`} aspect="video" tone={tonos[i % tonos.length]} className="rounded-none" />
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
                      {nivel.nombre}
                    </h3>
                    <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
                      {"nota" in nivel ? (nivel as { nota: string }).nota : "Cupos limitados — consulta disponibilidad"}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   TIMELINE DE INSCRIPCIÓN — sección nueva
============================================================================ */
function TimelineInscripcion() {
  const pasos = [
    { n: "01", titulo: "Completa la ficha", texto: "Llena el formulario digital de inscripción en menos de 10 minutos." },
    { n: "02", titulo: "Revisión de admisiones", texto: "Nuestro equipo revisa la solicitud y te contacta con los siguientes pasos." },
    { n: "03", titulo: "Entrega de documentos", texto: "Acta de nacimiento, cédula de los padres, y certificado médico." },
    { n: "04", titulo: "Confirmación de cupo", texto: "Coordinamos el pago y tu hijo o hija queda matriculado." },
  ];
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <SectionEyebrow color="sun">Proceso de admisión</SectionEyebrow>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            De la inscripción al primer día, en 4 pasos
          </h2>
        </ScrollReveal>

        <div className="mt-14 grid gap-8 md:grid-cols-4">
          {pasos.map((p, i) => (
            <ScrollReveal key={p.n} delay={i * 100}>
              <div className="relative">
                {i < pasos.length - 1 && (
                  <div className="absolute left-6 top-6 hidden h-px w-full bg-gradient-to-r from-[var(--color-ink)]/15 to-transparent md:block" />
                )}
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-ink)] font-[family-name:var(--font-display)] text-sm font-semibold text-white">
                  {p.n}
                </div>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                  {p.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{p.texto}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   GALERÍA
============================================================================ */
function Galeria({ imagenes }: { imagenes: { url: string; alt: string | null }[] }) {
  const tonos: Array<"sky" | "coral" | "leaf" | "sun"> = ["sky", "coral", "leaf", "sun"];
  const labels = ["Actividad grupal", "Hora de lectura", "Área de juegos", "Arte y manualidades"];
  const usarPlaceholders = imagenes.length === 0;

  return (
    <section className="bg-[var(--color-ink)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <SectionEyebrow color="coral">Un vistazo por dentro</SectionEyebrow>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white md:text-4xl">
            La vida diaria en {SCHOOL_NAME}
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {usarPlaceholders
            ? labels.map((label, i) => (
                <ScrollReveal key={label} delay={i * 80}>
                  <div className="overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-[1.03]">
                    <PhotoSlot label={`Foto: ${label.toLowerCase()}`} aspect="square" tone={tonos[i % tonos.length]} />
                  </div>
                </ScrollReveal>
              ))
            : imagenes.map((img, i) => (
                <ScrollReveal key={img.url} delay={i * 80}>
                  <div className="aspect-square overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-[1.03]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                  </div>
                </ScrollReveal>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   CUIDO + ACTIVIDADES
============================================================================ */
function CuidoYActividades({
  actividades,
  imagenCuido,
}: {
  actividades: { id: string; nombre: string; fechaInicio: Date; imagenUrl?: string | null }[];
  imagenCuido: string | null;
}) {
  return (
    <section className="bg-[var(--color-cream)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <ScrollReveal>
            <div className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {imagenCuido ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagenCuido} alt="Programas de cuido" className="aspect-[16/9] w-full object-cover" />
              ) : (
                <PhotoSlot label="Foto: cuido matutino/vespertino" aspect="wide" tone="sky" className="rounded-none" />
              )}
              <div className="p-8">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
                  Programas de cuido
                </h3>
                <p className="mt-3 text-[var(--color-ink-soft)]">
                  Cuido matutino y vespertino para las familias que necesitan horarios extendidos,
                  con cupos limitados por grupo.
                </p>
                <Link
                  href="/inscripcion#cuido"
                  className="group mt-5 inline-flex items-center gap-1.5 font-semibold text-[var(--color-sky-deep)]"
                >
                  Inscribir en cuido
                  <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {actividades[0]?.imagenUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={actividades[0].imagenUrl} alt="Actividades y campamentos" className="aspect-[16/9] w-full object-cover" />
              ) : (
                <PhotoSlot label="Foto: actividad o campamento" aspect="wide" tone="coral" className="rounded-none" />
              )}
              <div className="p-8">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
                  Actividades y campamentos
                </h3>
                <ul className="mt-5 space-y-2.5">
                  {(actividades.length > 0
                    ? actividades
                    : [
                        { id: "a", nombre: "Feria de Primavera", fechaInicio: new Date() },
                        { id: "b", nombre: "Campamento de Verano", fechaInicio: new Date() },
                      ]
                  ).map((act) => (
                    <li
                      key={act.id}
                      className="flex items-center justify-between rounded-xl bg-[var(--color-cream)] px-4 py-2.5"
                    >
                      <span className="font-medium text-[var(--color-ink)]">{act.nombre}</span>
                      <span className="text-xs font-bold text-[var(--color-coral)]">
                        {new Date(act.fechaInicio).toLocaleDateString("es-DO", { day: "2-digit", month: "short" })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   TESTIMONIOS
============================================================================ */
function Testimonios() {
  const testimonios = [
    {
      cita: "El proceso de inscripción fue rapidísimo, y desde el primer día sentimos que nuestra hija estaba en buenas manos.",
      nombre: "Madre de estudiante de Kínder",
    },
    {
      cita: "Nos encanta poder ver los pagos y actividades desde el celular. Todo muy organizado y transparente.",
      nombre: "Padre de estudiante de Pre-Kínder",
    },
  ];
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal>
          <div className="text-center">
            <SectionEyebrow color="leaf">Familias {SCHOOL_NAME}</SectionEyebrow>
            <h2 className="mx-auto mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
              Lo que dicen los padres
            </h2>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonios.map((t, i) => (
            <ScrollReveal key={t.nombre} delay={i * 100}>
              <div className="relative h-full rounded-3xl border border-[var(--color-ink)]/6 bg-[var(--color-cream)] p-8">
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="text-[var(--color-ink)]/10">
                  <path
                    d="M0 24V14.4C0 6.4 5.6 0.8 13.6 0L14.4 3.2C9.6 4.8 6.4 8 6.4 12.8H14.4V24H0ZM17.6 24V14.4C17.6 6.4 23.2 0.8 31.2 0L32 3.2C27.2 4.8 24 8 24 12.8H32V24H17.6Z"
                    fill="currentColor"
                  />
                </svg>
                <p className="mt-3 text-lg leading-relaxed text-[var(--color-ink)]">{t.cita}</p>
                <p className="mt-5 text-sm font-semibold text-[var(--color-ink-soft)]">{t.nombre}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   UBICACIÓN
============================================================================ */
function Ubicacion() {
  const datos = [
    { etiqueta: "Código de centro", valor: "14199" },
    { etiqueta: "Distrito educativo", valor: "1001 · Villa Mella" },
    { etiqueta: "Sector", valor: "Privado" },
    { etiqueta: "Tanda", valor: "Matutina" },
    { etiqueta: "Municipio", valor: "Santo Domingo Norte" },
    { etiqueta: "Provincia", valor: "Santo Domingo" },
  ];

  const query = encodeURIComponent("Penetración 53, Buena Vista 1, Santo Domingo Norte 11206, República Dominicana");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <SectionEyebrow color="sky">Cómo llegar</SectionEyebrow>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Nuestra ubicación
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <ScrollReveal>
            <div className="overflow-hidden rounded-3xl border border-[var(--color-ink)]/6">
              <iframe
                src={`https://www.google.com/maps?q=${query}&output=embed`}
                width="100%"
                height="420"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación del colegio"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="rounded-3xl bg-[var(--color-cream)] p-8">
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                14199 – Jardín de mi Padre
              </p>
              <dl className="mt-5 space-y-3">
                {datos.map((d) => (
                  <div key={d.etiqueta} className="flex items-center justify-between border-b border-[var(--color-ink)]/8 pb-2.5 text-sm">
                    <dt className="text-[var(--color-ink-soft)]">{d.etiqueta}</dt>
                    <dd className="font-semibold text-[var(--color-ink)]">{d.valor}</dd>
                  </div>
                ))}
              </dl>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-[var(--color-sky-deep)]">
                Ver en Google Maps
                <IconArrowRight className="h-4 w-4" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   FAQ
============================================================================ */
function FaqSection() {
  return (
    <section className="bg-[var(--color-cream)] py-24">
      <div className="mx-auto max-w-3xl px-6">
        <ScrollReveal>
          <div className="text-center">
            <SectionEyebrow>Preguntas frecuentes</SectionEyebrow>
            <h2 className="mx-auto mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
              Todo lo que necesitas saber
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100} className="mt-12">
          <Faq
            items={[
              {
                pregunta: "¿Cuánto tiempo toma el proceso de inscripción?",
                respuesta:
                  "La ficha digital toma menos de 10 minutos. Después, nuestro equipo de admisiones te contacta en un plazo de 1 a 3 días hábiles con los siguientes pasos.",
              },
              {
                pregunta: "¿Qué documentos necesito para inscribir a mi hijo o hija?",
                respuesta:
                  "Acta de nacimiento, copia de cédula de los padres o tutores, certificado médico, y récord de notas si aplica (nuevo ingreso).",
              },
              {
                pregunta: "¿Ofrecen cuido matutino y vespertino?",
                respuesta:
                  "Sí, tenemos programas de cuido con cupos limitados por grupo. Podés inscribirte a este servicio en la misma ficha de inscripción.",
              },
              {
                pregunta: "¿Cómo puedo dar seguimiento a los pagos de colegiatura?",
                respuesta:
                  "A través de nuestro portal digital de familias, disponible desde el celular o la computadora, donde ves el historial completo de pagos y facturas.",
              },
            ]}
          />
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================================
   PUBLICACIONES
============================================================================ */
function Publicaciones({
  publicaciones,
}: {
  publicaciones: { id: string; titulo: string; resumen: string; imagenUrl: string | null; fecha: Date }[];
}) {
  return (
    <section id="noticias" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <SectionEyebrow>Noticias</SectionEyebrow>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Publicaciones del colegio
          </h2>
        </ScrollReveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {publicaciones.map((pub, i) => (
            <ScrollReveal key={pub.id} delay={i * 100}>
              <article className="group overflow-hidden rounded-3xl border border-[var(--color-ink)]/6 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.15)]">
                {pub.imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pub.imagenUrl} alt={pub.titulo} className="h-44 w-full object-cover" />
                ) : (
                  <PhotoSlot label="Foto de la publicación" aspect="video" tone="sky" className="rounded-none" />
                )}
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                    {pub.fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                    {pub.titulo}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{pub.resumen}</p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   CTA FINAL — espectacular
============================================================================ */
function CtaFinal() {
  return (
    <section className="relative overflow-hidden bg-[#05070D] py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-sky)]/25 blur-[140px]" />
        <div className="absolute right-[5%] bottom-[-10%] h-[380px] w-[380px] rounded-full bg-[var(--color-coral)]/20 blur-[120px]" />
      </div>
      <ScrollReveal className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-white md:text-5xl">
          La inscripción toma
          <br />
          menos de 10 minutos.
        </h2>
        <p className="mt-5 text-lg text-white/55">
          Llena la ficha, y nuestro equipo de admisiones te contacta con los siguientes pasos.
        </p>
        <Link
          href="/inscripcion"
          className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#05070D] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20px_50px_-12px_rgba(255,255,255,0.3)] transition-transform duration-300 hover:-translate-y-0.5"
        >
          Comenzar inscripción
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </ScrollReveal>
    </section>
  );
}

/* ============================================================================
   HEADER
============================================================================ */
function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-ink)]/6 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt={SCHOOL_NAME} className="h-10 w-10 object-contain" />
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--color-ink)]">
            {SCHOOL_NAME}
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--color-ink-soft)] md:flex">
          <a href="#niveles" className="transition-colors hover:text-[var(--color-ink)]">Niveles</a>
          <a href="#noticias" className="transition-colors hover:text-[var(--color-ink)]">Noticias</a>
          <Link href="/biblioteca-digital" className="transition-colors hover:text-[var(--color-ink)]">Biblioteca digital</Link>
          <Link href="/valores-agregados" className="transition-colors hover:text-[var(--color-ink)]">Valores agregados</Link>
          <Link href="/inscripcion" className="transition-colors hover:text-[var(--color-ink)]">Inscripciones</Link>
          <Link href="/admin/login" className="transition-colors hover:text-[var(--color-ink)]">Acceder</Link>
        </nav>
        <Link
          href="/inscripcion"
          className="rounded-lg bg-[var(--color-ink)] px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
        >
          Inscribirse
        </Link>
      </div>
    </header>
  );
}

/* ============================================================================
   FOOTER
============================================================================ */
function SiteFooter() {
  return (
    <footer className="bg-[#05070D] py-16 text-white/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">{SCHOOL_NAME}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            Formación integral desde la primera etapa, con tecnología moderna al servicio de cada familia.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/30">Enlaces</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="#niveles" className="hover:text-white">Niveles</a></li>
            <li><Link href="/inscripcion" className="hover:text-white">Inscripciones</Link></li>
            <li><Link href="/admin/login" className="hover:text-white">Acceder</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/30">Contacto</p>
          <p className="mt-3 text-sm leading-relaxed">
            {process.env.NEXT_PUBLIC_SCHOOL_PHONE}
            <br />
            {process.env.NEXT_PUBLIC_SCHOOL_EMAIL}
          </p>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 px-6 pt-6 text-xs">
        © {new Date().getFullYear()} {SCHOOL_NAME}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
