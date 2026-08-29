/*
  Warnings:

  - Added the required column `cuentaId` to the `Gasto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoIngreso" AS ENUM ('RECIBIDO', 'ANULADO');

-- AlterTable
ALTER TABLE "Gasto" ADD COLUMN     "cuentaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MovimientoBancario" ADD COLUMN     "gastoId" TEXT,
ADD COLUMN     "ingresoId" TEXT,
ADD COLUMN     "pagoId" TEXT;

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "cuentaId" TEXT;

-- CreateTable
CREATE TABLE "CategoriaIngreso" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CategoriaIngreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" "MetodoPagoGasto" NOT NULL,
    "estado" "EstadoIngreso" NOT NULL DEFAULT 'RECIBIDO',
    "fuente" TEXT,
    "numeroComprobante" TEXT,
    "registradoPorId" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaIngreso_nombre_key" ON "CategoriaIngreso"("nombre");

-- CreateIndex
CREATE INDEX "Ingreso_categoriaId_idx" ON "Ingreso"("categoriaId");

-- CreateIndex
CREATE INDEX "Ingreso_cuentaId_idx" ON "Ingreso"("cuentaId");

-- CreateIndex
CREATE INDEX "Ingreso_fecha_idx" ON "Ingreso"("fecha");

-- CreateIndex
CREATE INDEX "Ingreso_estado_idx" ON "Ingreso"("estado");

-- CreateIndex
CREATE INDEX "Gasto_cuentaId_idx" ON "Gasto"("cuentaId");

-- CreateIndex
CREATE INDEX "MovimientoBancario_gastoId_idx" ON "MovimientoBancario"("gastoId");

-- CreateIndex
CREATE INDEX "MovimientoBancario_ingresoId_idx" ON "MovimientoBancario"("ingresoId");

-- CreateIndex
CREATE INDEX "MovimientoBancario_pagoId_idx" ON "MovimientoBancario"("pagoId");

-- CreateIndex
CREATE INDEX "Pago_cuentaId_idx" ON "Pago"("cuentaId");

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_ingresoId_fkey" FOREIGN KEY ("ingresoId") REFERENCES "Ingreso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaIngreso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaBancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
