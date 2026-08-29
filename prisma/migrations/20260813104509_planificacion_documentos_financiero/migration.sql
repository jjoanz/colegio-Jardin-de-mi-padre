-- CreateEnum
CREATE TYPE "TipoDocumentoInstitucional" AS ENUM ('POA', 'PROYECTO_EDUCATIVO');

-- AlterTable
ALTER TABLE "Cargo" ADD COLUMN     "anioEscolarId" TEXT,
ADD COLUMN     "becaId" TEXT,
ADD COLUMN     "numeroCuota" INTEGER,
ADD COLUMN     "totalCuotas" INTEGER;

-- AlterTable
ALTER TABLE "Estudiante" ADD COLUMN     "numeroMatriculaMinerd" TEXT;

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "planPago" "PlanPago";

-- AlterTable
ALTER TABLE "Nivel" ADD COLUMN     "colegiaturaAnual" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "diaPago" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "PlanificacionDocente" ADD COLUMN     "metacognicion" TEXT,
ADD COLUMN     "tiempoCierre" TEXT,
ADD COLUMN     "tiempoDesarrollo" TEXT,
ADD COLUMN     "tiempoInicio" TEXT;

-- CreateTable
CREATE TABLE "DocumentoInstitucional" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoDocumentoInstitucional" NOT NULL,
    "descripcion" TEXT,
    "archivoUrl" TEXT NOT NULL,
    "anioEscolarId" TEXT,
    "subidoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoInstitucional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beca" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "motivo" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadaPorId" TEXT,

    CONSTRAINT "Beca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentoInstitucional_tipo_idx" ON "DocumentoInstitucional"("tipo");

-- CreateIndex
CREATE INDEX "DocumentoInstitucional_anioEscolarId_idx" ON "DocumentoInstitucional"("anioEscolarId");

-- CreateIndex
CREATE INDEX "Beca_estudianteId_activa_idx" ON "Beca"("estudianteId", "activa");

-- CreateIndex
CREATE INDEX "Cargo_anioEscolarId_idx" ON "Cargo"("anioEscolarId");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_numeroMatriculaMinerd_key" ON "Estudiante"("numeroMatriculaMinerd");

-- AddForeignKey
ALTER TABLE "DocumentoInstitucional" ADD CONSTRAINT "DocumentoInstitucional_anioEscolarId_fkey" FOREIGN KEY ("anioEscolarId") REFERENCES "AnioEscolar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoInstitucional" ADD CONSTRAINT "DocumentoInstitucional_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_anioEscolarId_fkey" FOREIGN KEY ("anioEscolarId") REFERENCES "AnioEscolar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_becaId_fkey" FOREIGN KEY ("becaId") REFERENCES "Beca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beca" ADD CONSTRAINT "Beca_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beca" ADD CONSTRAINT "Beca_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

