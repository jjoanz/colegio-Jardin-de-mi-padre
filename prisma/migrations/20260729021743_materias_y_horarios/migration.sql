-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO');

-- CreateTable
CREATE TABLE "Materia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivelId" TEXT,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Materia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueHorario" (
    "id" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "docenteId" TEXT,
    "anioEscolarId" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horaInicioMin" INTEGER NOT NULL,
    "horaFinMin" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BloqueHorario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BloqueHorario_aulaId_diaSemana_idx" ON "BloqueHorario"("aulaId", "diaSemana");

-- CreateIndex
CREATE INDEX "BloqueHorario_docenteId_diaSemana_idx" ON "BloqueHorario"("docenteId", "diaSemana");

-- CreateIndex
CREATE INDEX "BloqueHorario_anioEscolarId_idx" ON "BloqueHorario"("anioEscolarId");

-- AddForeignKey
ALTER TABLE "Materia" ADD CONSTRAINT "Materia_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueHorario" ADD CONSTRAINT "BloqueHorario_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueHorario" ADD CONSTRAINT "BloqueHorario_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueHorario" ADD CONSTRAINT "BloqueHorario_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueHorario" ADD CONSTRAINT "BloqueHorario_anioEscolarId_fkey" FOREIGN KEY ("anioEscolarId") REFERENCES "AnioEscolar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
