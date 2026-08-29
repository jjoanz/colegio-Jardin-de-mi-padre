// agregar-permisos-becas.js
//
// Crea los permisos del nuevo módulo "becas" (asignar % de descuento
// persistente a un estudiante) y le da acceso total a ADMIN.
// Ajusta después desde /admin/roles/[id]/permisos si algo no es lo que
// quieres (ej. darle "ver"/"crear" a CONTABILIDAD).
//
// USO: node agregar-permisos-becas.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ACCIONES = ["ver", "crear", "editar", "eliminar"];
const MODULOS = ["becas"];

async function main() {
  const permisoIdPorClave = {};
  for (const modulo of MODULOS) {
    for (const accion of ACCIONES) {
      const permiso = await prisma.permission.upsert({
        where: { modulo_accion: { modulo, accion } },
        update: {},
        create: { modulo, accion },
      });
      permisoIdPorClave[`${modulo}:${accion}`] = permiso.id;
    }
  }
  console.log(`Permisos verificados/creados para ${MODULOS.length} módulos.`);

  async function otorgar(nombreRol, claves) {
    const rol = await prisma.role.findUnique({ where: { nombre: nombreRol } });
    if (!rol) {
      console.log(`Rol ${nombreRol} no existe, se omite.`);
      return;
    }
    for (const clave of claves) {
      const permissionId = permisoIdPorClave[clave];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: rol.id, permissionId } },
        update: {},
        create: { roleId: rol.id, permissionId },
      });
    }
    console.log(`Rol ${nombreRol}: ${claves.length} permisos verificados/otorgados.`);
  }

  const todasLasClaves = MODULOS.flatMap((m) => ACCIONES.map((a) => `${m}:${a}`));
  await otorgar("ADMIN", todasLasClaves);

  console.log("\nListo. Revisa /admin/roles/[id]/permisos para cada rol y ajusta si algo no es exactamente lo que quieres.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
