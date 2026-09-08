
-- DropForeignKey
ALTER TABLE "CargoAdicional" DROP CONSTRAINT "CargoAdicional_nivelId_fkey";

-- DropIndex
DROP INDEX "CargoAdicional_nivelId_idx";

-- AlterTable
ALTER TABLE "CargoAdicional" DROP COLUMN "nivelId",
ADD COLUMN     "gradoId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "CargoAdicional_gradoId_idx" ON "CargoAdicional"("gradoId");

-- AddForeignKey
ALTER TABLE "CargoAdicional" ADD CONSTRAINT "CargoAdicional_gradoId_fkey" FOREIGN KEY ("gradoId") REFERENCES "Grado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

