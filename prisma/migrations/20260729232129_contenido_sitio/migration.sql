-- CreateEnum
CREATE TYPE "SeccionImagen" AS ENUM ('HERO', 'QUIENES_SOMOS', 'GALERIA');

-- CreateTable
CREATE TABLE "ContenidoQuienesSomos" (
    "id" TEXT NOT NULL,
    "mision" TEXT NOT NULL,
    "vision" TEXT NOT NULL,
    "valores" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContenidoQuienesSomos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagenSitio" (
    "id" TEXT NOT NULL,
    "seccion" "SeccionImagen",
    "nivelId" TEXT,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImagenSitio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImagenSitio_seccion_orden_idx" ON "ImagenSitio"("seccion", "orden");

-- CreateIndex
CREATE INDEX "ImagenSitio_nivelId_idx" ON "ImagenSitio"("nivelId");

-- AddForeignKey
ALTER TABLE "ImagenSitio" ADD CONSTRAINT "ImagenSitio_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
