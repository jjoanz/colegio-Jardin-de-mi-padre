// agregar-permiso-asistencia-coordinador.js
//
// Le da al rol COORDINADOR_DOCENTE el permiso para VER la asistencia
// (para dar seguimiento), sin poder editarla (eso sigue siendo solo
// de cada profesor).
//
// USO: node agregar-permiso-asistencia-coordinador.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rol = await prisma.role.findUnique({ where: { nombre: "COORDINADOR_DOCENTE" } });
  if (!rol) {
    console.error("No se encontró el rol COORDINADOR_DOCENTE. Corre primero agregar-rol-coordinador.js");
    process.exit(1);
  }

  const permiso = await prisma.permission.upsert({
    where: { modulo_accion: { modulo: "asistencia", accion: "ver" } },
    update: {},
    create: { modulo: "asistencia", accion: "ver" },
  });

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: rol.id, permissionId: permiso.id } },
    update: {},
    create: { roleId: rol.id, permissionId: permiso.id },
  });

  console.log("Listo: COORDINADOR_DOCENTE ahora tiene asistencia:ver");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
