// agregar-permiso-panel.js
//
// Agrega los 4 permisos del nuevo módulo "panel" (Panel general / dashboard)
// y le da "panel:ver" a todos los roles existentes por defecto, para que
// nadie quede bloqueado del dashboard justo después de esta actualización.
// Una vez corrido, entra a /admin/roles/[id]/permisos y ajusta a quién
// se lo quieres quitar.
//
// USO: node agregar-permiso-panel.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ACCIONES = ["ver", "crear", "editar", "eliminar"];

async function main() {
  // 1. Crear los 4 permisos del módulo "panel"
  const permisosCreados = {};
  for (const accion of ACCIONES) {
    const permiso = await prisma.permission.upsert({
      where: { modulo_accion: { modulo: "panel", accion } },
      update: {},
      create: { modulo: "panel", accion },
    });
    permisosCreados[accion] = permiso;
  }
  console.log("Permisos del módulo 'panel' creados.");

  // 2. Dar "panel:ver" a todos los roles existentes (incluyendo los que
  //    hayas creado manualmente desde la UI)
  const roles = await prisma.role.findMany();
  for (const rol of roles) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: rol.id, permissionId: permisosCreados.ver.id },
      },
      update: {},
      create: { roleId: rol.id, permissionId: permisosCreados.ver.id },
    });
    console.log(`Rol ${rol.nombre}: panel:ver asignado`);
  }

  console.log("\nListo. Ahora ve a /admin/roles/[id]/permisos para ajustar");
  console.log("a qué roles quieres quitarles el acceso al Panel general.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
