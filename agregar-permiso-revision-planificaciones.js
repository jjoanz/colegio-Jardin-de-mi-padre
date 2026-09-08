// agregar-permiso-revision-planificaciones.js
//
// Separa "quién puede revisar/aprobar las planificaciones de TODOS los
// docentes" de "academico:editar" (que solo debe significar "puede crear y
// editar SUS PROPIAS planificaciones"). Antes ambas cosas compartían el
// mismo permiso y un docente con "academico:editar" marcado terminaba
// tratado como revisor: veía las planificaciones de todos los demás y
// perdía su propio botón de crear.
//
// Crea el módulo "revision_planificaciones" (ver/crear/editar/eliminar,
// aunque en el código solo se usan ver/editar) y le da ver+editar a
// COORDINADOR_DOCENTE, DIRECTOR_ACADEMICO y ADMIN. No toca el permiso
// "academico:*" de PROFESOR ni de ningún otro rol.
//
// USO: node agregar-permiso-revision-planificaciones.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ACCIONES = ["ver", "crear", "editar", "eliminar"];
const ROLES_REVISORES = ["COORDINADOR_DOCENTE", "DIRECTOR_ACADEMICO", "ADMIN"];

async function main() {
  const permisosCreados = {};
  for (const accion of ACCIONES) {
    const permiso = await prisma.permission.upsert({
      where: { modulo_accion: { modulo: "revision_planificaciones", accion } },
      update: {},
      create: { modulo: "revision_planificaciones", accion },
    });
    permisosCreados[accion] = permiso;
  }
  console.log("Permisos del módulo 'revision_planificaciones' creados.");

  for (const nombreRol of ROLES_REVISORES) {
    const rol = await prisma.role.findFirst({ where: { nombre: nombreRol } });
    if (!rol) {
      console.log(`Rol ${nombreRol} no existe, se omite.`);
      continue;
    }
    for (const accion of ["ver", "editar"]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: rol.id, permissionId: permisosCreados[accion].id },
        },
        update: {},
        create: { roleId: rol.id, permissionId: permisosCreados[accion].id },
      });
    }
    console.log(`Rol ${nombreRol}: revision_planificaciones:ver + revision_planificaciones:editar asignados`);
  }

  console.log("\nListo. PROFESOR no fue modificado — sigue viendo y editando solo sus propias planificaciones.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
