import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { crearRol, actualizarRol, eliminarRol } from "@/lib/actions-roles";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const roles = await prisma.role.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { usuarios: true, permisos: true } } },
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Roles
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Crea roles nuevos (ej. Director Académico, Coordinador de Nivel) y configura sus permisos.
      </p>

      <section className="mt-8 rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Crear nuevo rol
        </h2>
        <form action={crearRol} className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs text-[var(--color-ink-soft)]">
            Nombre del rol
            <input name="nombre" required placeholder="COORDINADOR_ACADEMICO" className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Descripción
            <input name="descripcion" placeholder="Qué hace este rol" className={inputClass} />
          </label>
          <BotonGuardar
            textoGuardado="✓ Creado"
            className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60 md:col-span-2"
          >
            Crear rol
          </BotonGuardar>
        </form>
      </section>

      <div className="mt-6 space-y-3">
        {roles.map((r) => (
          <details
            key={r.id}
            className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
              <div>
                <p className="flex items-center gap-2 font-semibold text-[var(--color-ink)]">
                  {r.nombre}
                  {r.esSistema && (
                    <span className="rounded-full bg-[var(--color-paper-dark)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                      Rol base
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  {r.descripcion || "Sin descripción"}
                </p>
              </div>
              <span className="text-xs text-[var(--color-ink-soft)]">
                {r._count.usuarios} usuario(s) · {r._count.permisos} permiso(s)
              </span>
            </summary>

            <form
              action={actualizarRol}
              className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2"
            >
              <input type="hidden" name="roleId" value={r.id} />
              <label className="text-xs text-[var(--color-ink-soft)]">
                Nombre del rol
                <input
                  name="nombre"
                  defaultValue={r.nombre}
                  readOnly={r.esSistema}
                  required
                  className={`${inputClass} ${r.esSistema ? "bg-[var(--color-line)] text-[var(--color-ink-soft)]" : ""}`}
                />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Descripción
                <input name="descripcion" defaultValue={r.descripcion ?? ""} className={inputClass} />
              </label>
              <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60 md:col-span-2">
                Guardar cambios
              </BotonGuardar>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] p-4">
              <Link
                href={`/admin/roles/${r.id}/permisos`}
                className="text-sm font-bold text-[var(--color-green)] hover:underline"
              >
                Configurar permisos →
              </Link>

              {!r.esSistema && (
                <form action={eliminarRol}>
                  <input type="hidden" name="roleId" value={r.id} />
                  <BotonGuardar
                    textoGuardado="✓ Eliminado"
                    className="rounded-lg border border-red-200 px-4 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Eliminar rol
                  </BotonGuardar>
                </form>
              )}
            </div>
          </details>
        ))}
        {roles.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay roles creados.
          </p>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
