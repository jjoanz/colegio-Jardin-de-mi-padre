// seed-roles-permisos.js
//
// Crea los roles base, los permisos por módulo, conecta cada permiso con
// su rol correspondiente, y migra los AdminUser existentes de "rol" (enum)
// a "roleId" (relación nueva).
//
// USO:
//   1. Coloca este archivo en la raíz del proyecto (junto a package.json).
//   2. Corre: node seed-roles-permisos.js
//   3. Verifica que salió bien (revisa el resumen que imprime al final).

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── ROLES BASE ────────────────────────────────────────────────────────────
const ROLES = [
  { nombre: "ADMIN", descripcion: "Acceso total al sistema", esSistema: true },
  { nombre: "SECRETARIA", descripcion: "Inscripciones, alumnos, padres", esSistema: true },
  { nombre: "CONTABILIDAD", descripcion: "Cargos, pagos, reportes", esSistema: true },
  { nombre: "PROFESOR", descripcion: "Planificación docente y asistencia", esSistema: true },
];

// ─── MÓDULOS Y ACCIONES DISPONIBLES ────────────────────────────────────────
const MODULOS = [
  "inscripciones",
  "estudiantes",
  "padres",
  "academico",       // planificación
  "asistencia",
  "administrativo",  // contabilidad, gastos, bancos
  "cobros",
  "facturas",
  "administracion",  // usuarios, roles, permisos
];
const ACCIONES = ["ver", "crear", "editar", "eliminar"];

// ─── QUÉ PERMISOS TIENE CADA ROL POR DEFECTO ───────────────────────────────
// Formato: "modulo:accion". "*" significa todas las acciones de ese módulo.
const PERMISOS_POR_ROL = {
  ADMIN: ["*"], // todos los módulos, todas las acciones
  SECRETARIA: [
    "inscripciones:*",
    "estudiantes:*",
    "padres:*",
    "asistencia:ver",
  ],
  CONTABILIDAD: [
    "administrativo:*",
    "cobros:*",
    "facturas:*",
    "estudiantes:ver",
  ],
  PROFESOR: [
    "academico:*",
    "asistencia:*",
    "estudiantes:ver",
  ],
};

async function main() {
  // 1. Crear roles
  const rolesCreados = {};
  for (const r of ROLES) {
    const rol = await prisma.role.upsert({
      where: { nombre: r.nombre },
      update: { descripcion: r.descripcion, esSistema: r.esSistema },
      create: r,
    });
    rolesCreados[r.nombre] = rol;
    console.log(`Rol listo: ${rol.nombre}`);
  }

  // 2. Crear permisos (todos los módulos x todas las acciones)
  const permisosCreados = {};
  for (const modulo of MODULOS) {
    for (const accion of ACCIONES) {
      const permiso = await prisma.permission.upsert({
        where: { modulo_accion: { modulo, accion } },
        update: {},
        create: { modulo, accion },
      });
      permisosCreados[`${modulo}:${accion}`] = permiso;
    }
  }
  console.log(`Permisos creados: ${Object.keys(permisosCreados).length}`);

  // 3. Asignar permisos a cada rol según PERMISOS_POR_ROL
  for (const [nombreRol, permisosStr] of Object.entries(PERMISOS_POR_ROL)) {
    const rol = rolesCreados[nombreRol];
    let permisosAAsignar = [];

    if (permisosStr.includes("*")) {
      // todos los permisos existentes
      permisosAAsignar = Object.values(permisosCreados);
    } else {
      for (const p of permisosStr) {
        if (p.endsWith(":*")) {
          const modulo = p.split(":")[0];
          permisosAAsignar.push(
            ...ACCIONES.map((accion) => permisosCreados[`${modulo}:${accion}`])
          );
        } else {
          permisosAAsignar.push(permisosCreados[p]);
        }
      }
    }

    for (const permiso of permisosAAsignar) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: rol.id, permissionId: permiso.id },
        },
        update: {},
        create: { roleId: rol.id, permissionId: permiso.id },
      });
    }
    console.log(`Rol ${nombreRol}: ${permisosAAsignar.length} permisos asignados`);
  }

  // 4. Migrar AdminUser existentes: enum "rol" -> relación "roleId"
  const usuarios = await prisma.adminUser.findMany();
  for (const u of usuarios) {
    const rolNombre = u.rol; // valor del enum viejo: ADMIN | SECRETARIA | CONTABILIDAD
    const rolNuevo = rolesCreados[rolNombre];
    if (rolNuevo) {
      await prisma.adminUser.update({
        where: { id: u.id },
        data: { roleId: rolNuevo.id },
      });
      console.log(`Usuario ${u.email} migrado al rol ${rolNombre}`);
    } else {
      console.warn(`Usuario ${u.email} tiene rol "${rolNombre}" sin match, revisar manualmente`);
    }
  }

  console.log("\nListo. Roles, permisos y usuarios migrados correctamente.");
  console.log("Cuando confirmes que todo funciona en la app, avísame para generar");
  console.log("la migración final que elimina el campo 'rol' (enum) y el enum RolAdmin.");
}

main()
  .catch((e) => {
    console.error("Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });