// agregar-rol-coordinador.js
//
// Crea el rol COORDINADOR_DOCENTE con permisos para ver/editar el módulo
// académico (revisar planificaciones) y ver el panel general y estudiantes.
//
// USO: node agregar-rol-coordinador.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rol = await prisma.role.upsert({
    where: { nombre: "COORDINADOR_DOCENTE" },
    update: {},
    create: {
      nombre: "COORDINADOR_DOCENTE",
      descripcion: "Valida y da seguimiento a las planificaciones de los docentes",
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

  console.log("Permisos asignados a COORDINADOR_DOCENTE: panel:ver, academico:ver, academico:editar, estudiantes:ver");
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
