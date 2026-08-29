import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BotonImprimir } from "@/components/BotonImprimir";

export const dynamic = "force-dynamic";

export default async function ImprimirPlanificacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/admin/login");

  const usuario = session.user as { id?: string; role?: string } | undefined;
  const esRevisor = usuario?.role === "ADMIN" || usuario?.role === "COORDINADOR_DOCENTE";

  const p = await prisma.planificacionDocente.findUnique({
    where: { id },
    include: { docente: true, aula: { include: { nivel: true } } },
  });

  if (!p) notFound();
  if (p.docenteId !== usuario?.id && !esRevisor) notFound();

  const esPrimaria = p.tipo === "PRIMARIA";

  return (
    <div className="mx-auto max-w-3xl px-8 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-gray-500">Vista previa — usa el botón para guardarlo como PDF</p>
        <BotonImprimir />
      </div>

      <div className="border border-gray-300 p-8 text-sm text-gray-900">
        <h1 className="text-center text-lg font-bold uppercase">
          Planificación {esPrimaria ? "de Primaria" : "de Nivel Inicial"}
        </h1>
        <p className="mt-1 text-center text-gray-600">
          {esPrimaria ? "Unidad de Aprendizaje" : "Formato de planificación por proyectos"}
        </p>

        <SeccionImpresa titulo="Datos generales">
          <Fila label="Centro educativo" valor={p.centroEducativo} />
          <Fila label="Docente" valor={p.docente.nombre} />
          <Fila label={esPrimaria ? "Grado" : "Grado y sección"} valor={p.grado} />
          {esPrimaria ? (
            <Fila label="Área curricular" valor={p.areaCurricular} />
          ) : (
            <Fila label="Dominios" valor={p.dominios} />
          )}
          <Fila label={esPrimaria ? "Tiempo de duración" : "Duración"} valor={p.duracion} />
          {!esPrimaria && <Fila label="Fecha" valor={p.fecha ? p.fecha.toLocaleDateString("es-DO") : null} />}
          <Fila label="Aula" valor={p.aula ? `${p.aula.nombre} — ${p.aula.nivel.nombre}` : null} />
        </SeccionImpresa>

        <SeccionImpresa titulo={esPrimaria ? "Título de la Unidad de Aprendizaje" : "Título del proyecto"}>
          <p>{p.titulo}</p>
        </SeccionImpresa>

        <SeccionImpresa
          titulo={esPrimaria ? "Situación de aprendizaje" : "Situación o problema del contexto"}
        >
          <TextoLargo valor={p.situacionContexto} />
        </SeccionImpresa>

        <SeccionImpresa titulo="Eje transversal">
          <TextoLargo valor={p.ejeTransversal} />
        </SeccionImpresa>

        <SeccionImpresa titulo="Competencias fundamentales">
          <TextoLargo valor={p.competenciasFundamentales} />
        </SeccionImpresa>

        <SeccionImpresa titulo="Competencias específicas">
          <TextoLargo valor={p.competenciasEspecificas} />
        </SeccionImpresa>

        <SeccionImpresa titulo="Indicadores de logro">
          <TextoLargo valor={p.indicadoresLogro} />
        </SeccionImpresa>

        <SeccionImpresa titulo="Contenidos">
          <Fila label="Conceptuales" valor={p.contenidoConceptual} />
          <Fila label="Procedimentales" valor={p.contenidoProcedimental} />
          <Fila label="Actitudes y valores" valor={p.contenidoActitudinal} />
        </SeccionImpresa>

        <SeccionImpresa titulo={esPrimaria ? "Secuencia didáctica" : "Secuencia de actividades"}>
          <Fila label="Intención pedagógica" valor={p.propositoAprendizaje} />
          <Fila label="Inicio" valor={p.secuenciaInicio} />
          <Fila label="Tiempo (Inicio)" valor={p.tiempoInicio} />
          <Fila label="Desarrollo" valor={p.secuenciaDesarrollo} />
          <Fila label="Tiempo (Desarrollo)" valor={p.tiempoDesarrollo} />
          <Fila label="Cierre (Cierre y retroalimentación)" valor={p.secuenciaCierre} />
          <Fila label="Tiempo (Cierre)" valor={p.tiempoCierre} />
        </SeccionImpresa>

        {esPrimaria && (
          <SeccionImpresa titulo="Estrategias de enseñanza y aprendizaje">
            <TextoLargo valor={p.estrategiasEnsenanza} />
          </SeccionImpresa>
        )}

        <SeccionImpresa titulo="Recursos y materiales">
          <TextoLargo valor={p.recursosMateriales} />
        </SeccionImpresa>

        <SeccionImpresa titulo="Evaluación">
          <Fila label="Criterios de evaluación" valor={p.criteriosEvaluacion} />
          <Fila label="Evidencias de aprendizaje" valor={p.evidenciasAprendizaje} />
          <Fila label="Instrumentos de evaluación" valor={p.instrumentosEvaluacion} />
        </SeccionImpresa>

        <SeccionImpresa titulo="Producto o evidencia final">
          <TextoLargo valor={p.productoEvidenciaFinal} />
        </SeccionImpresa>

        {!esPrimaria && (
          <SeccionImpresa titulo="Teorías">
            <TextoLargo valor={p.teorias} />
          </SeccionImpresa>
        )}

        <SeccionImpresa titulo="Metacognición">
          <TextoLargo valor={p.metacognicion} />
        </SeccionImpresa>

        <SeccionImpresa titulo="Autores">
          <p>{p.autores || "—"}</p>
        </SeccionImpresa>

        <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs text-gray-500">
          <div className="border-t border-gray-400 pt-2">Firma del docente</div>
          <div className="border-t border-gray-400 pt-2">Firma del coordinador docente</div>
        </div>
      </div>
    </div>
  );
}

function SeccionImpresa({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 break-inside-avoid">
      <p className="border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
        {titulo}
      </p>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <p>
      <span className="font-semibold">{label}: </span>
      {valor || "—"}
    </p>
  );
}

function TextoLargo({ valor }: { valor: string | null | undefined }) {
  return <p className="whitespace-pre-line">{valor || "—"}</p>;
}
