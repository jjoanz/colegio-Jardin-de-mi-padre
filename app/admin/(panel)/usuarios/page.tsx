import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  crearUsuarioAdmin,
  actualizarUsuarioAdmin,
  resetPasswordUsuarioAdmin,
  otorgarAccesoUsuarioAdmin,
} from "@/lib/actions-usuarios";
import { BotonGuardar } from "@/components/BotonGuardar";
import { PasswordInput } from "@/components/PasswordInput";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const [usuarios, roles] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: [{ nombre: "asc" }],
      include: { role: true },
    }),
    prisma.role.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            Usuarios del panel
          </h1>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            Crea cuentas para el personal del colegio y asigna su rol de acceso.
          </p>
        </div>
        <Link
          href="/admin/usuarios/importar"
          className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
        >
          Importar en lote
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Crear nuevo usuario
        </h2>
        <form action={crearUsuarioAdmin} className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs text-[var(--color-ink-soft)]">
            Nombre
            <input name="nombre" required className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Correo
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Contraseña temporal
            <PasswordInput name="password" minLength={8} required autoComplete="new-password" className={inputClass} />
          </label>
          <label className="text-xs text-[var(--color-ink-soft)]">
            Rol
            <select name="roleId" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Seleccionar rol…
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </label>
          <BotonGuardar
            textoGuardado="✓ Creado"
            className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60 md:col-span-2"
          >
            Crear usuario
          </BotonGuardar>
        </form>
      </section>

      <div className="mt-6 space-y-3">
        {usuarios.map((u) => (
          <details
            key={u.id}
            className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{u.nombre}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  {u.email} · {u.role?.nombre ?? "Sin rol asignado"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  u.activo
                    ? "bg-[var(--color-paper-dark)] text-[var(--color-green)]"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {u.activo ? "Activo" : "Inactivo"}
              </span>
            </summary>

            <form
              action={actualizarUsuarioAdmin}
              className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2"
            >
              <input type="hidden" name="usuarioId" value={u.id} />
              <label className="text-xs text-[var(--color-ink-soft)]">
                Nombre
                <input name="nombre" defaultValue={u.nombre} required className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Correo
                <input
                  name="email"
                  type="email"
                  defaultValue={u.email}
                  required
                  className={inputClass}
                />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Rol
                <select
                  name="roleId"
                  defaultValue={u.roleId ?? ""}
                  required
                  className={inputClass}
                >
                  <option value="" disabled>
                    Seleccionar rol…
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 self-end text-xs text-[var(--color-ink-soft)]">
                <input type="checkbox" name="activo" defaultChecked={u.activo} />
                Usuario activo
              </label>
              <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60 md:col-span-2">
                Guardar cambios
              </BotonGuardar>
            </form>

            <form
              action={resetPasswordUsuarioAdmin}
              className="flex flex-wrap items-end gap-3 border-t border-[var(--color-line)] p-4"
            >
              <input type="hidden" name="usuarioId" value={u.id} />
              <label className="flex-1 text-xs text-[var(--color-ink-soft)]">
                Nueva contraseña
                <PasswordInput
                  name="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
              <BotonGuardar
                textoGuardado="✓ Restablecida"
                className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] disabled:opacity-60"
              >
                Restablecer contraseña
              </BotonGuardar>
            </form>

            <form
              action={otorgarAccesoUsuarioAdmin}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] p-4"
            >
              <input type="hidden" name="usuarioId" value={u.id} />
              <p className="text-xs text-[var(--color-ink-soft)]">
                Genera una nueva contraseña temporal y se la reenvía por correo (útil si la
                perdió).
              </p>
              <BotonGuardar
                textoGuardado="✓ Enviado"
                className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
              >
                Reenviar credenciales
              </BotonGuardar>
            </form>
          </details>
        ))}
        {usuarios.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay usuarios del panel registrados.
          </p>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
