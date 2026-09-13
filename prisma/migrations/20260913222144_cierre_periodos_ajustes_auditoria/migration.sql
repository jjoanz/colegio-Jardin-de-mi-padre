-- CreateEnum
CREATE TYPE "EstadoCierrePeriodo" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "TipoEventoCierre" AS ENUM ('CIERRE', 'REAPERTURA');

-- CreateEnum
CREATE TYPE "TipoAjuste" AS ENUM ('DESCUENTO', 'RECARGO', 'CORRECCION');

-- AlterTable
ALTER TABLE "AnioEscolar" ADD COLUMN     "estadoCierre" "EstadoCierrePeriodo" NOT NULL DEFAULT 'ABIERTO';

-- CreateTable
CREATE TABLE "CierrePeriodo" (
    "id" TEXT NOT NULL,
    "anioEscolarId" TEXT NOT NULL,
    "tipo" "TipoEventoCierre" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "totalCargos" DECIMAL(12,2) NOT NULL,
    "totalPagado" DECIMAL(12,2) NOT NULL,
    "totalPendiente" DECIMAL(12,2) NOT NULL,
    "totalEstudiantes" INTEGER NOT NULL,
    "estudiantesPagados" INTEGER NOT NULL,
    "estudiantesParcial" INTEGER NOT NULL,
    "estudiantesConDeuda" INTEGER NOT NULL,
    "motivo" TEXT,

    CONSTRAINT "CierrePeriodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjusteCargo" (
    "id" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "tipo" "TipoAjuste" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "referencia" TEXT,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AjusteCargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroAuditoria" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "usuarioId" TEXT,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "motivo" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CierrePeriodo_anioEscolarId_fecha_idx" ON "CierrePeriodo"("anioEscolarId", "fecha");

-- CreateIndex
CREATE INDEX "AjusteCargo_cargoId_idx" ON "AjusteCargo"("cargoId");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_entidad_entidadId_idx" ON "RegistroAuditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_creadoEn_idx" ON "RegistroAuditoria"("creadoEn");

-- CreateIndex
CREATE INDEX "AnioEscolar_estadoCierre_idx" ON "AnioEscolar"("estadoCierre");

-- AddForeignKey
ALTER TABLE "CierrePeriodo" ADD CONSTRAINT "CierrePeriodo_anioEscolarId_fkey" FOREIGN KEY ("anioEscolarId") REFERENCES "AnioEscolar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CierrePeriodo" ADD CONSTRAINT "CierrePeriodo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteCargo" ADD CONSTRAINT "AjusteCargo_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteCargo" ADD CONSTRAINT "AjusteCargo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAuditoria" ADD CONSTRAINT "RegistroAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

