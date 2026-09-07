
-- CreateEnum
CREATE TYPE "EstadoPagoReportado" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "PagoReportado" (
    "id" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "comprobanteUrl" TEXT,
    "notasTutor" TEXT,
    "estado" "EstadoPagoReportado" NOT NULL DEFAULT 'PENDIENTE',
    "notasRevision" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisadoEn" TIMESTAMP(3),
    "revisadoPorId" TEXT,
    "pagoId" TEXT,

    CONSTRAINT "PagoReportado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PagoReportado_pagoId_key" ON "PagoReportado"("pagoId");

-- CreateIndex
CREATE INDEX "PagoReportado_cargoId_idx" ON "PagoReportado"("cargoId");

-- CreateIndex
CREATE INDEX "PagoReportado_estado_idx" ON "PagoReportado"("estado");

-- AddForeignKey
ALTER TABLE "PagoReportado" ADD CONSTRAINT "PagoReportado_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoReportado" ADD CONSTRAINT "PagoReportado_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoReportado" ADD CONSTRAINT "PagoReportado_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoReportado" ADD CONSTRAINT "PagoReportado_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

