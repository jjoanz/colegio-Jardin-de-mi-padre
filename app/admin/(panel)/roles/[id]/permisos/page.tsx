import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { actualizarPermisosRol } from "@/lib/actions-roles";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

// Módulos del sistema. Si agregas un módulo nuevo (ej. cuando construyas el
// módulo Académico completo), agrégalo aquí y en el seed de permisos.
const MODULOS = [
  { key: "panel", label: "Panel general (dashboard)" },
  { key: "inscripciones", label: "Solicitudes de inscripción" },
  { key: "estudiantes", label: "Estudiantes" },
  { key: "padres", label: "Padres, madres y tutores" },
  { key: "oferta_academica", label: "Oferta académica (aulas)" },
  { key: "niveles", label: "Niveles y precios" },
  { key: "cuido", label: "Programas de cuido" },
  { key: "actividades", label: "Actividades y campamentos" },
  { key: "especiales", label: "Especiales y promociones" },
  { key: "cargos", label: "Cargos" },
  { key: "pagos", label: "Caja de Cobro" },
  { key: "facturas", label: "Facturas" },
  { key: "usuarios", label: "Usuarios" },
  { key: "roles", label: "Roles y permisos" },
  { key: "formulario_inscripcion", label: "Formulario de inscripción" },
  { key: "academico", label: "Planificación docente" },
  { key: "asistencia", label: "Asistencia" },
  { key: "gastos", label: "Gastos" },
  { key: "cuentas_bancarias", label: "Cuentas bancarias" },
  { key: "documentos_institucionales", label: "POA y proyectos educativos" },
  { key: "administracion", label: "Contenido del sitio" },
  { key: "becas", label: "Becas" },
];

const ACCIONES = [
  { key: "ver", label: "Ver" },
  { key: "crear", label: "Crear" },
  { key: "editar", label: "Editar" },
  { key: "eliminar", label: "Eliminar" },
];

export default async function PermisosRolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const role = await prisma.role.findUnique({
    where: { id },
    include: { permisos: { include: { permission: true } } },
  });
  if (!role) notFound();

  const permisos = await prisma.permission.findMany({
    orderBy: [{ modulo: "asc" }, { accion: "asc" }],
  });
  const permisoMap = new Map(permisos.map((p) => [`${p.modulo}:${p.accion}`, p]));
  const activosSet = new Set(role.permisos.map((rp) => rp.permissionId));

  const esAdmin = role.nombre === "ADMIN";

  return (
    <div>
      <Link href="/admin/roles" className="text-sm font-bold text-[var(--color-green)]">
        ← Todos los roles
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Permisos de {role.nombre}
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        {esAdmin
          ? "El rol ADMIN siempre tiene acceso total a todos los módulos y no se puede modificar."
          : "Marca qué puede ver, crear, editar o eliminar este rol en cada módulo del sistema."}
      </p>

      <form action={actualizarPermisosRol} className="mt-8">
        <input type="hidden" name="roleId" value={role.id} />

        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-paper-dark)] text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-4 py-3">Módulo</th>
                {ACCIONES.map((a) => (
                  <th key={a.key} className="px-4 py-3 text-center">
                    {a.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULOS.map((m) => (
                <tr key={m.key} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">{m.label}</td>
                  {ACCIONES.map((a) => {
                    const permiso = permisoMap.get(`${m.key}:${a.key}`);
                    if (!permiso) {
                      return (
                        <td key={a.key} className="px-4 py-3 text-center text-[var(--color-ink-soft)]">
                          —
                        </td>
                      );
                    }
                    return (
                      <td key={a.key} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          name="permisoIds"
                          value={permiso.id}
                          defaultChecked={esAdmin || activosSet.has(permiso.id)}
                          disabled={esAdmin}
                          className="h-4 w-4 accent-[var(--color-green)] disabled:opacity-60"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!esAdmin && (
          <BotonGuardar className="mt-6 rounded-lg bg-[var(--color-green)] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            Guardar permisos
          </BotonGuardar>
        )}
      </form>
    </div>
  );
}
