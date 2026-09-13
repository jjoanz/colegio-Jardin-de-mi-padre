// agregar-permiso-cierres-periodo.js
//
// Crea el módulo de permisos "cierres_periodo" (ver=consultar/exportar,
// crear=cerrar período, editar=crear ajustes contables, eliminar=reabrir
// período) y se lo otorga a ADMIN y CONTABILIDAD, igual que se hizo con
// "horarios" en separar-permiso-horarios.js.
//
// USO: node agregar-permiso-cierres-periodo.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ACCIONES = ["ver", "crear", "editar", "eliminar"];

async function permiso(modulo, accion) {
  return prisma.permission.upsert({
    where: { modulo_accion: { modulo, accion } },
    update: {},
    create: { modulo, accion },
  });
}

async function otorgar(nombreRol, permisos) {
  const rol = await prisma.role.findUnique({ where: { nombre: nombreRol } });
  if (!rol) {
    console.log(`Rol ${nombreRol} no existe, se omite.`);
    return;
  }
  for (const p of permisos) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: rol.id, permissionId: p.id } },
      update: {},
      create: { roleId: rol.id, permissionId: p.id },
    });
  }
  console.log(`Rol ${nombreRol}: ${permisos.length} permisos de cierres_periodo otorgados.`);
}

async function main() {
  const permisosCierre = {};
  for (const accion of ACCIONES) {
    permisosCierre[accion] = await permiso("cierres_periodo", accion);
  }
  console.log("Permisos del módulo 'cierres_periodo' creados/verificados.");

  await otorgar("ADMIN", Object.values(permisosCierre));
  await otorgar("CONTABILIDAD", Object.values(permisosCierre));

  console.log("\nListo. Revisa /admin/roles/[id]/permisos si quieres ajustar algún rol más.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
