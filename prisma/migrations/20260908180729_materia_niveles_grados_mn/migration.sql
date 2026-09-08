
-- DropForeignKey
ALTER TABLE "Materia" DROP CONSTRAINT "Materia_nivelId_fkey";

-- AlterTable
ALTER TABLE "Materia" DROP COLUMN "nivelId";

-- CreateTable
CREATE TABLE "_MateriaToNivel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MateriaToNivel_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GradoToMateria" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GradoToMateria_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MateriaToNivel_B_index" ON "_MateriaToNivel"("B");

-- CreateIndex
CREATE INDEX "_GradoToMateria_B_index" ON "_GradoToMateria"("B");

-- AddForeignKey
ALTER TABLE "_MateriaToNivel" ADD CONSTRAINT "_MateriaToNivel_A_fkey" FOREIGN KEY ("A") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MateriaToNivel" ADD CONSTRAINT "_MateriaToNivel_B_fkey" FOREIGN KEY ("B") REFERENCES "Nivel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GradoToMateria" ADD CONSTRAINT "_GradoToMateria_A_fkey" FOREIGN KEY ("A") REFERENCES "Grado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GradoToMateria" ADD CONSTRAINT "_GradoToMateria_B_fkey" FOREIGN KEY ("B") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

