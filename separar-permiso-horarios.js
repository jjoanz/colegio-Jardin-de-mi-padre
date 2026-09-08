// separar-permiso-horarios.js
//
// Separa "Horarios" de "oferta_academica" en su propio módulo de permisos,
// para poder darle a PROFESOR acceso de solo lectura (ver su horario) sin
// darle acceso a Aulas/Materias/Años escolares.
//
// USO: node separar-permiso-horarios.js

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
  console.log(`Rol ${nombreRol}: ${permisos.length} permisos de horarios otorgados.`);
}

async function main() {
  const permisosHorarios = {};
  for (const accion of ACCIONES) {
    permisosHorarios[accion] = await permiso("horarios", accion);
  }
  console.log("Permisos del módulo 'horarios' creados/verificados.");

  // ADMIN y CONTABILIDAD ya tenían acceso a horarios vía oferta_academica —
  // se les otorga explícito el módulo nuevo para no perder acceso.
  await otorgar("ADMIN", Object.values(permisosHorarios));
  await otorgar("CONTABILIDAD", Object.values(permisosHorarios));

  // PROFESOR: solo puede VER su horario, nada de crear/editar/eliminar.
  await otorgar("PROFESOR", [permisosHorarios.ver]);

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
