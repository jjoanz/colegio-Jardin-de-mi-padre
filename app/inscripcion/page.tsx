import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { InscripcionFormDinamico } from "@/components/InscripcionFormDinamico";

export const dynamic = "force-dynamic";

export default async function InscripcionPage() {
  const [formulario, niveles, programasCuido] = await Promise.all([
    prisma.formularioVersion.findFirst({
      where: { estado: "PUBLICADO" },
      include: {
        secciones: {
          orderBy: { orden: "asc" },
          include: {
            preguntas: {
              orderBy: { orden: "asc" },
              include: { opciones: { orderBy: { orden: "asc" } } },
            },
          },
        },
      },
    }),
    prisma.nivel.findMany({ where: { activo: true }, orderBy: { ordenVisual: "asc" } }),
    prisma.programaCuido.findMany({ where: { activo: true } }),
  ]);

  const condiciones = formulario
    ? await prisma.formCondicion.findMany({
        where: { preguntaOrigen: { seccion: { formularioId: formulario.id } } },
      })
    : [];

  return (
    <main className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-[var(--color-ink-soft)]"
        >
          ← Volver al inicio
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-medium text-[var(--color-ink)]">
          Ficha de inscripción
        </h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">
          Completa los datos del estudiante y del padre, madre o tutor. Nuestro equipo de
          admisiones revisará la solicitud y te contactará para coordinar el pago y los
          documentos finales.
        </p>

        <div className="mt-10">
          {formulario ? (
            <InscripcionFormDinamico
              formulario={formulario}
              condiciones={condiciones}
              niveles={niveles.map((n) => ({ id: n.id, nombre: n.nombre }))}
              programasCuido={programasCuido.map((p) => ({ id: p.id, nombre: p.nombre }))}
            />
          ) : (
            <p className="rounded-sm border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
              El formulario de inscripción no está disponible en este momento. Por favor contáctanos
              directamente.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
