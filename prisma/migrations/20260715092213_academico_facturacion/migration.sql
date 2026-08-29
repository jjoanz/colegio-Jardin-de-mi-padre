/*
  Warnings:

  - A unique constraint covering the columns `[numeroExpediente]` on the table `Estudiante` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numeroExpediente]` on the table `Tutor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numeroExpediente` to the `Estudiante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numeroExpediente` to the `Tutor` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Tanda" AS ENUM ('MATUTINA', 'VESPERTINA', 'EXTENDIDA');

-- CreateEnum
CREATE TYPE "EstadoMatricula" AS ENUM ('ACTIVA', 'RETIRADA', 'PROMOVIDA', 'REPROBADA');

-- AlterTable
ALTER TABLE "Estudiante" ADD COLUMN     "numeroExpediente" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tutor" ADD COLUMN     "numeroExpediente" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AnioEscolar" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AnioEscolar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aula" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivelId" TEXT NOT NULL,
    "tanda" "Tanda" NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "anioEscolarId" TEXT NOT NULL,
    "docente" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Aula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matricula" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "anioEscolarId" TEXT NOT NULL,
    "fechaMatricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoMatricula" NOT NULL DEFAULT 'ACTIVA',
    "observaciones" TEXT,

    CONSTRAINT "Matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "numeroFactura" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "montoSubtotal" DECIMAL(10,2) NOT NULL,
    "itbis" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnioEscolar_nombre_key" ON "AnioEscolar"("nombre");

-- CreateIndex
CREATE INDEX "Aula_nivelId_anioEscolarId_idx" ON "Aula"("nivelId", "anioEscolarId");

-- CreateIndex
CREATE INDEX "Matricula_aulaId_idx" ON "Matricula"("aulaId");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_estudianteId_anioEscolarId_key" ON "Matricula"("estudianteId", "anioEscolarId");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numeroFactura_key" ON "Factura"("numeroFactura");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_pagoId_key" ON "Factura"("pagoId");

-- CreateIndex
CREATE INDEX "Factura_estudianteId_idx" ON "Factura"("estudianteId");

-- CreateIndex
CREATE INDEX "Factura_fechaEmision_idx" ON "Factura"("fechaEmision");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_numeroExpediente_key" ON "Estudiante"("numeroExpediente");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_numeroExpediente_key" ON "Tutor"("numeroExpediente");

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_anioEscolarId_fkey" FOREIGN KEY ("anioEscolarId") REFERENCES "AnioEscolar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_anioEscolarId_fkey" FOREIGN KEY ("anioEscolarId") REFERENCES "AnioEscolar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
