
-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "cedula" TEXT,
ADD COLUMN     "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tutor" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "passwordHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_cedula_key" ON "AdminUser"("cedula");

