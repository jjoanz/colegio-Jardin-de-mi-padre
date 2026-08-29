-- CreateEnum
CREATE TYPE "RolAdmin" AS ENUM ('ADMIN', 'SECRETARIA', 'CONTABILIDAD');

-- CreateEnum
CREATE TYPE "ParentescoTipo" AS ENUM ('PADRE', 'MADRE', 'TUTOR_LEGAL', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoEstudiante" AS ENUM ('PENDIENTE', 'ACTIVO', 'INACTIVO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('PORCENTAJE', 'MONTO_FIJO');

-- CreateEnum
CREATE TYPE "AplicaA" AS ENUM ('NIVEL', 'CUIDO', 'ACTIVIDAD', 'CUALQUIERA');

-- CreateEnum
CREATE TYPE "ConceptoCargo" AS ENUM ('MATRICULA', 'MENSUALIDAD', 'CUIDO', 'ACTIVIDAD', 'CAMPAMENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoCargo" AS ENUM ('PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO', 'ANULADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('ENLACE_PAGO_AZUL', 'TRANSFERENCIA', 'EFECTIVO', 'CHEQUE', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('NUEVA', 'EN_REVISION', 'APROBADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolAdmin" NOT NULL DEFAULT 'SECRETARIA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cedula" TEXT,
    "telefono" TEXT NOT NULL,
    "telefonoAlt" TEXT,
    "email" TEXT NOT NULL,
    "direccion" TEXT,
    "ocupacion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstudianteTutor" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "parentesco" "ParentescoTipo" NOT NULL,
    "esContactoPrincipal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EstudianteTutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estudiante" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "cedulaONum" TEXT,
    "genero" TEXT,
    "foto" TEXT,
    "estado" "EstadoEstudiante" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "nivelId" TEXT,

    CONSTRAINT "Estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "archivoUrl" TEXT NOT NULL,
    "subidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nivel" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tarifaInscripcion" DECIMAL(10,2) NOT NULL,
    "cupoMaximo" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ordenVisual" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Nivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramaCuido" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "horario" TEXT NOT NULL,
    "tarifaMensual" DECIMAL(10,2) NOT NULL,
    "cupoMaximo" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProgramaCuido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscripcionCuido" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "programaCuidoId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InscripcionCuido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "tarifa" DECIMAL(10,2) NOT NULL,
    "cupoMaximo" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscripcionActividad" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "actividadId" TEXT NOT NULL,
    "inscritoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscripcionActividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Especial" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipoDescuento" "TipoDescuento" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "aplicaA" "AplicaA" NOT NULL DEFAULT 'CUALQUIERA',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Especial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "concepto" "ConceptoCargo" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "especialId" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" "EstadoCargo" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "comprobanteUrl" TEXT,
    "notas" TEXT,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registradoPorId" TEXT,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudInscripcion" (
    "id" TEXT NOT NULL,
    "nombreEstudiante" TEXT NOT NULL,
    "apellidoEstudiante" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "nivelInteresId" TEXT,
    "nombreTutor" TEXT NOT NULL,
    "cedulaTutor" TEXT,
    "telefonoTutor" TEXT NOT NULL,
    "emailTutor" TEXT NOT NULL,
    "interesCuidoId" TEXT,
    "actividadesInteresIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "comentarios" TEXT,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'NUEVA',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estudianteCreadoId" TEXT,

    CONSTRAINT "SolicitudInscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_cedula_key" ON "Tutor"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_email_key" ON "Tutor"("email");

-- CreateIndex
CREATE INDEX "Tutor_email_idx" ON "Tutor"("email");

-- CreateIndex
CREATE INDEX "Tutor_cedula_idx" ON "Tutor"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "EstudianteTutor_estudianteId_tutorId_key" ON "EstudianteTutor"("estudianteId", "tutorId");

-- CreateIndex
CREATE INDEX "Estudiante_apellido_nombre_idx" ON "Estudiante"("apellido", "nombre");

-- CreateIndex
CREATE INDEX "Estudiante_estado_idx" ON "Estudiante"("estado");

-- CreateIndex
CREATE INDEX "Nivel_activo_idx" ON "Nivel"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "InscripcionCuido_estudianteId_programaCuidoId_fechaInicio_key" ON "InscripcionCuido"("estudianteId", "programaCuidoId", "fechaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "InscripcionActividad_estudianteId_actividadId_key" ON "InscripcionActividad"("estudianteId", "actividadId");

-- CreateIndex
CREATE INDEX "Cargo_estudianteId_estado_idx" ON "Cargo"("estudianteId", "estado");

-- CreateIndex
CREATE INDEX "Cargo_estado_idx" ON "Cargo"("estado");

-- CreateIndex
CREATE INDEX "Pago_cargoId_idx" ON "Pago"("cargoId");

-- CreateIndex
CREATE INDEX "SolicitudInscripcion_estado_idx" ON "SolicitudInscripcion"("estado");

-- CreateIndex
CREATE INDEX "SolicitudInscripcion_creadaEn_idx" ON "SolicitudInscripcion"("creadaEn");

-- AddForeignKey
ALTER TABLE "EstudianteTutor" ADD CONSTRAINT "EstudianteTutor_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudianteTutor" ADD CONSTRAINT "EstudianteTutor_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionCuido" ADD CONSTRAINT "InscripcionCuido_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionCuido" ADD CONSTRAINT "InscripcionCuido_programaCuidoId_fkey" FOREIGN KEY ("programaCuidoId") REFERENCES "ProgramaCuido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionActividad" ADD CONSTRAINT "InscripcionActividad_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionActividad" ADD CONSTRAINT "InscripcionActividad_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "Actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_especialId_fkey" FOREIGN KEY ("especialId") REFERENCES "Especial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
