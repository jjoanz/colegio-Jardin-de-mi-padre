-- AlterTable
ALTER TABLE "Aula" ADD COLUMN     "docenteId" TEXT;

-- CreateIndex
CREATE INDEX "Aula_docenteId_idx" ON "Aula"("docenteId");

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
