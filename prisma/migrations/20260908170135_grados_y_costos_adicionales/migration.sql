
-- AlterEnum
ALTER TYPE "RolSistemaPregunta" ADD VALUE 'GRADO_INTERES';

-- AlterEnum
ALTER TYPE "TipoPregunta" ADD VALUE 'SELECT_GRADO';

-- AlterTable
ALTER TABLE "Aula" ADD COLUMN     "gradoId" TEXT;

-- AlterTable
ALTER TABLE "Estudiante" ADD COLUMN     "gradoId" TEXT;

-- AlterTable
ALTER TABLE "SolicitudInscripcion" ADD COLUMN     "gradoInteresId" TEXT;

-- CreateTable
CREATE TABLE "Grado" (
    "id" TEXT NOT NULL,
    "nivelId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tarifaInscripcion" DECIMAL(10,2) NOT NULL,
    "colegiaturaAnual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "diaPago" INTEGER NOT NULL DEFAULT 5,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ordenVisual" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Grado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargoAdicional" (
    "id" TEXT NOT NULL,
    "nivelId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CargoAdicional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Grado_nivelId_idx" ON "Grado"("nivelId");

-- CreateIndex
CREATE INDEX "CargoAdicional_nivelId_idx" ON "CargoAdicional"("nivelId");

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_gradoId_fkey" FOREIGN KEY ("gradoId") REFERENCES "Grado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grado" ADD CONSTRAINT "Grado_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoAdicional" ADD CONSTRAINT "CargoAdicional_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_gradoId_fkey" FOREIGN KEY ("gradoId") REFERENCES "Grado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

