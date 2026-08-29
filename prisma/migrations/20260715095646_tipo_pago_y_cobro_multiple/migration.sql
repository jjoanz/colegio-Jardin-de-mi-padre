/*
  Warnings:

  - Added the required column `tipoPago` to the `Pago` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('ABONO', 'PAGO_TOTAL');

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN "tipoPago" "TipoPago";
UPDATE "Pago" SET "tipoPago" = 'PAGO_TOTAL';
ALTER TABLE "Pago" ALTER COLUMN "tipoPago" SET NOT NULL;
