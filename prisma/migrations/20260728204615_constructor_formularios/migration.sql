-- CreateEnum
CREATE TYPE "EstadoFormulario" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "TipoPregunta" AS ENUM ('TEXTO_CORTO', 'TEXTO_LARGO', 'NUMERO', 'FECHA', 'OPCION_UNICA', 'OPCION_MULTIPLE', 'CASILLA', 'SELECT_NIVEL', 'SELECT_CUIDO');

-- CreateEnum
CREATE TYPE "RolSistemaPregunta" AS ENUM ('NOMBRE_ESTUDIANTE', 'APELLIDO_ESTUDIANTE', 'FECHA_NACIMIENTO_ESTUDIANTE', 'NIVEL_INTERES', 'NOMBRE_CONTACTO', 'TELEFONO_CONTACTO', 'EMAIL_CONTACTO', 'CEDULA_CONTACTO');

-- AlterTable
ALTER TABLE "SolicitudInscripcion" ADD COLUMN     "formularioVersionId" TEXT,
ADD COLUMN     "respuestas" JSONB,
ALTER COLUMN "nombreEstudiante" DROP NOT NULL,
ALTER COLUMN "apellidoEstudiante" DROP NOT NULL,
ALTER COLUMN "fechaNacimiento" DROP NOT NULL,
ALTER COLUMN "nombreTutor" DROP NOT NULL,
ALTER COLUMN "telefonoTutor" DROP NOT NULL,
ALTER COLUMN "emailTutor" DROP NOT NULL;

-- CreateTable
CREATE TABLE "FormularioVersion" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "estado" "EstadoFormulario" NOT NULL DEFAULT 'BORRADOR',
    "publicadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormularioVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSeccion" (
    "id" TEXT NOT NULL,
    "formularioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FormSeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormPregunta" (
    "id" TEXT NOT NULL,
    "seccionId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "tipo" "TipoPregunta" NOT NULL,
    "requerida" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "placeholder" TEXT,
    "rolSistema" "RolSistemaPregunta",

    CONSTRAINT "FormPregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormOpcion" (
    "id" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FormOpcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormCondicion" (
    "id" TEXT NOT NULL,
    "preguntaOrigenId" TEXT NOT NULL,
    "valorEsperado" TEXT NOT NULL,
    "preguntaObjetivoId" TEXT,
    "seccionObjetivoId" TEXT,

    CONSTRAINT "FormCondicion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormularioVersion_numero_key" ON "FormularioVersion"("numero");

-- CreateIndex
CREATE INDEX "FormSeccion_formularioId_idx" ON "FormSeccion"("formularioId");

-- CreateIndex
CREATE UNIQUE INDEX "FormPregunta_seccionId_clave_key" ON "FormPregunta"("seccionId", "clave");

-- AddForeignKey
ALTER TABLE "FormSeccion" ADD CONSTRAINT "FormSeccion_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "FormularioVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormPregunta" ADD CONSTRAINT "FormPregunta_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "FormSeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormOpcion" ADD CONSTRAINT "FormOpcion_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "FormPregunta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormCondicion" ADD CONSTRAINT "FormCondicion_preguntaOrigenId_fkey" FOREIGN KEY ("preguntaOrigenId") REFERENCES "FormPregunta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormCondicion" ADD CONSTRAINT "FormCondicion_preguntaObjetivoId_fkey" FOREIGN KEY ("preguntaObjetivoId") REFERENCES "FormPregunta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormCondicion" ADD CONSTRAINT "FormCondicion_seccionObjetivoId_fkey" FOREIGN KEY ("seccionObjetivoId") REFERENCES "FormSeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudInscripcion" ADD CONSTRAINT "SolicitudInscripcion_formularioVersionId_fkey" FOREIGN KEY ("formularioVersionId") REFERENCES "FormularioVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
