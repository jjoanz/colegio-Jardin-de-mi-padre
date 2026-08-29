/*
  Warnings:

  - The values [FINALIZADA] on the enum `EstadoPlanificacion` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoPlanificacion_new" AS ENUM ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA');
ALTER TABLE "public"."PlanificacionDocente" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "PlanificacionDocente" ALTER COLUMN "estado" TYPE "EstadoPlanificacion_new" USING ("estado"::text::"EstadoPlanificacion_new");
ALTER TYPE "EstadoPlanificacion" RENAME TO "EstadoPlanificacion_old";
ALTER TYPE "EstadoPlanificacion_new" RENAME TO "EstadoPlanificacion";
DROP TYPE "public"."EstadoPlanificacion_old";
ALTER TABLE "PlanificacionDocente" ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';
COMMIT;

-- AlterTable
ALTER TABLE "PlanificacionDocente" ADD COLUMN     "comentarioCoordinador" TEXT,
ADD COLUMN     "revisadoEn" TIMESTAMP(3),
ADD COLUMN     "revisadoPorId" TEXT;

-- AddForeignKey
ALTER TABLE "PlanificacionDocente" ADD CONSTRAINT "PlanificacionDocente_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
