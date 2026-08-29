// ajustar-permisos-oferta-academica.js
//
// - PROFESOR: solo VER (para consultar el horario de su aula)
// - COORDINADOR_DOCENTE: VER, CREAR, EDITAR (gestionar horarios y aulas)
// - SECRETARIA: acceso completo (VER, CREAR, EDITAR, ELIMINAR) — lo necesita
//   para matricular estudiantes y mantener años/aulas/materias
//
// USO: node ajustar-permisos-oferta-academica.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function otorgar(nombreRol, acciones) {
  const rol = await prisma.role.findUnique({ where: { nombre: nombreRol } });
  if (!rol) {
    console.log(`Rol ${nombreRol} no existe, se omite.`);
    return;
  }
  for (const accion of acciones) {
    const permiso = await prisma.permission.upsert({
      where: { modulo_accion: { modulo: "oferta_academica", accion } },
      update: {},
      create: { modulo: "oferta_academica", accion },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: rol.id, permissionId: permiso.id } },
      update: {},
      create: { roleId: rol.id, permissionId: permiso.id },
    });
  }
  console.log(`Rol ${nombreRol}: oferta_academica [${acciones.join(", ")}] otorgado.`);
}

async function main() {
  await otorgar("PROFESOR", ["ver"]);
  await otorgar("COORDINADOR_DOCENTE", ["ver", "crear", "editar"]);
  await otorgar("SECRETARIA", ["ver", "crear", "editar", "eliminar"]);

  console.log("\nListo. Revisa /admin/roles/[id]/permisos para confirmar cada uno.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
