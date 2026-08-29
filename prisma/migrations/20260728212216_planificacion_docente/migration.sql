-- CreateEnum
CREATE TYPE "TipoPlanificacion" AS ENUM ('PRIMARIA', 'INICIAL');

-- CreateEnum
CREATE TYPE "EstadoPlanificacion" AS ENUM ('BORRADOR', 'FINALIZADA');

-- CreateTable
CREATE TABLE "PlanificacionDocente" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "aulaId" TEXT,
    "tipo" "TipoPlanificacion" NOT NULL,
    "estado" "EstadoPlanificacion" NOT NULL DEFAULT 'BORRADOR',
    "centroEducativo" TEXT,
    "grado" TEXT,
    "areaCurricular" TEXT,
    "dominios" TEXT,
    "duracion" TEXT,
    "fecha" TIMESTAMP(3),
    "titulo" TEXT NOT NULL,
    "situacionContexto" TEXT,
    "propositoAprendizaje" TEXT,
    "competenciasFundamentales" TEXT,
    "competenciasEspecificas" TEXT,
    "indicadoresLogro" TEXT,
    "contenidoConceptual" TEXT,
    "contenidoProcedimental" TEXT,
    "contenidoActitudinal" TEXT,
    "ejeTransversal" TEXT,
    "secuenciaInicio" TEXT,
    "secuenciaDesarrollo" TEXT,
    "secuenciaCierre" TEXT,
    "estrategiasEnsenanza" TEXT,
    "recursosMateriales" TEXT,
    "criteriosEvaluacion" TEXT,
    "evidenciasAprendizaje" TEXT,
    "instrumentosEvaluacion" TEXT,
    "productoEvidenciaFinal" TEXT,
    "teorias" TEXT,
    "autores" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanificacionDocente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanificacionDocente_docenteId_idx" ON "PlanificacionDocente"("docenteId");

-- CreateIndex
CREATE INDEX "PlanificacionDocente_aulaId_idx" ON "PlanificacionDocente"("aulaId");

-- AddForeignKey
ALTER TABLE "PlanificacionDocente" ADD CONSTRAINT "PlanificacionDocente_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanificacionDocente" ADD CONSTRAINT "PlanificacionDocente_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
