// agregar-rol-director-academico.js
//
// Crea el rol DIRECTOR_ACADEMICO con los mismos permisos que
// COORDINADOR_DOCENTE (revisar planificaciones, ver panel/estudiantes) —
// ambos reciben notificación cuando un docente envía una planificación.
//
// USO: node agregar-rol-director-academico.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rol = await prisma.role.upsert({
    where: { nombre: "DIRECTOR_ACADEMICO" },
    update: {},
    create: {
      nombre: "DIRECTOR_ACADEMICO",
      descripcion: "Supervisa y revisa las planificaciones docentes junto al coordinador",
      esSistema: true,
    },
  });
  console.log(`Rol listo: ${rol.nombre}`);

  const permisosNecesarios = [
    { modulo: "panel", accion: "ver" },
    { modulo: "academico", accion: "ver" },
    { modulo: "academico", accion: "editar" },
    { modulo: "estudiantes", accion: "ver" },
  ];

  for (const p of permisosNecesarios) {
    const permiso = await prisma.permission.upsert({
      where: { modulo_accion: { modulo: p.modulo, accion: p.accion } },
      update: {},
      create: p,
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: rol.id, permissionId: permiso.id } },
      update: {},
      create: { roleId: rol.id, permissionId: permiso.id },
    });
  }

  console.log("Permisos asignados a DIRECTOR_ACADEMICO: panel:ver, academico:ver, academico:editar, estudiantes:ver");
  console.log("Ya puedes crear un usuario con este rol en /admin/usuarios");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
