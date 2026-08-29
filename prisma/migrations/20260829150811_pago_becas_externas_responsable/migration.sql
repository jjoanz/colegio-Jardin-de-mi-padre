-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RolSistemaPregunta" ADD VALUE 'RESPONSABLE_PAGO_NOMBRE';
ALTER TYPE "RolSistemaPregunta" ADD VALUE 'RESPONSABLE_PAGO_APELLIDO';
ALTER TYPE "RolSistemaPregunta" ADD VALUE 'RESPONSABLE_PAGO_CEDULA';
ALTER TYPE "RolSistemaPregunta" ADD VALUE 'RESPONSABLE_PAGO_TELEFONO';
ALTER TYPE "RolSistemaPregunta" ADD VALUE 'RESPONSABLE_PAGO_PARENTESCO';
ALTER TYPE "RolSistemaPregunta" ADD VALUE 'METODO_PAGO';
ALTER TYPE "RolSistemaPregunta" ADD VALUE 'COMPROBANTE_PAGO';
ALTER TYPE "RolSistemaPregunta" ADD VALUE 'TIENE_BECA_EXTERNA';
ALTER TYPE "RolSistemaPregunta" ADD VALUE 'INSTITUCION_BECA_EXTERNA';
ALTER TYPE "RolSistemaPregunta" ADD VALUE 'CARTA_COMPROMISO_BECA';

-- AlterEnum
ALTER TYPE "TipoPregunta" ADD VALUE 'ARCHIVO';

-- AlterTable
ALTER TABLE "Beca" ADD COLUMN     "cartaCompromisoUrl" TEXT,
ADD COLUMN     "esExterna" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "institucionExterna" TEXT;

-- AlterTable
ALTER TABLE "SolicitudInscripcion" ADD COLUMN     "cartaCompromisoBecaUrl" TEXT,
ADD COLUMN     "comprobantePagoUrl" TEXT,
ADD COLUMN     "institucionBecaExterna" TEXT,
ADD COLUMN     "metodoPagoPreferido" TEXT,
ADD COLUMN     "responsablePagoApellido" TEXT,
ADD COLUMN     "responsablePagoCedula" TEXT,
ADD COLUMN     "responsablePagoNombre" TEXT,
ADD COLUMN     "responsablePagoParentesco" TEXT,
ADD COLUMN     "responsablePagoTelefono" TEXT,
ADD COLUMN     "tieneBecaExterna" BOOLEAN NOT NULL DEFAULT false;
