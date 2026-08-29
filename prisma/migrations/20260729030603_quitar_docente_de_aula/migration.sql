/*
  Warnings:

  - You are about to drop the column `docente` on the `Aula` table. All the data in the column will be lost.
  - You are about to drop the column `docenteId` on the `Aula` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Aula" DROP CONSTRAINT "Aula_docenteId_fkey";

-- DropIndex
DROP INDEX "Aula_docenteId_idx";

-- AlterTable
ALTER TABLE "Aula" DROP COLUMN "docente",
DROP COLUMN "docenteId";
