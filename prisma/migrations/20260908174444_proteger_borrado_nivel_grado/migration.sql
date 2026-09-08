
-- DropForeignKey
ALTER TABLE "Estudiante" DROP CONSTRAINT "Estudiante_gradoId_fkey";

-- DropForeignKey
ALTER TABLE "Estudiante" DROP CONSTRAINT "Estudiante_nivelId_fkey";

-- DropForeignKey
ALTER TABLE "Grado" DROP CONSTRAINT "Grado_nivelId_fkey";

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_gradoId_fkey" FOREIGN KEY ("gradoId") REFERENCES "Grado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grado" ADD CONSTRAINT "Grado_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

