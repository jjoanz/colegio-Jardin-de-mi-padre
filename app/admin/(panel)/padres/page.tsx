import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { actualizarTutor, otorgarAccesoTutorManual } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function PadresPage() {
  const tutores = await prisma.tutor.findMany({
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    include: { estudiantes: { include: { estudiante: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            Padres, madres y tutores
          </h1>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            Cuando un padre, madre o tutor tiene varios hijos en el colegio, aquí se ven todos juntos. Haz clic para editar sus datos.
          </p>
        </div>
        <Link
          href="/admin/padres/importar"
          className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
        >
          Importar en lote
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {tutores.map((t) => (
          <details key={t.id} id={t.id} className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{t.nombre} {t.apellido}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  Exp. {t.numeroExpediente} · {t.email} · {t.telefono}
                </p>
              </div>
              <span className="text-xs text-[var(--color-ink-soft)]">
                {t.estudiantes.length > 0
                  ? `${t.estudiantes.length} hijo(s): ${t.estudiantes.map((et) => et.estudiante.nombre).join(", ")}`
                  : "Sin hijos vinculados"}
              </span>
            </summary>
            {t.estudiantes.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-[var(--color-line)] px-4 py-2.5">
                {t.estudiantes.map((et) => (
                  <Link
                    key={et.id}
                    href={`/admin/estudiantes/${et.estudiante.id}/estado-cuenta`}
                    className="rounded-lg border border-[var(--color-line)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
                  >
                    Estado de cuenta de {et.estudiante.nombre} →
                  </Link>
                ))}
              </div>
            )}
            <form action={actualizarTutor} className="grid gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper-dark)] p-4 md:grid-cols-2">
              <input type="hidden" name="tutorId" value={t.id} />
              <label className="text-xs text-[var(--color-ink-soft)]">
                Nombre
                <input name="nombre" defaultValue={t.nombre} required className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Apellido
                <input name="apellido" defaultValue={t.apellido} className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Cédula
                <input name="cedula" defaultValue={t.cedula ?? ""} className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Correo
                <input name="email" type="email" defaultValue={t.email} required className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Teléfono
                <input name="telefono" defaultValue={t.telefono} required className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Teléfono alterno
                <input name="telefonoAlt" defaultValue={t.telefonoAlt ?? ""} className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Dirección
                <input name="direccion" defaultValue={t.direccion ?? ""} className={inputClass} />
              </label>
              <label className="text-xs text-[var(--color-ink-soft)]">
                Ocupación
                <input name="ocupacion" defaultValue={t.ocupacion ?? ""} className={inputClass} />
              </label>
              <BotonGuardar className="rounded-lg bg-[var(--color-green)] py-2 text-sm font-bold text-white disabled:opacity-60 md:col-span-2">
                Guardar cambios
              </BotonGuardar>
            </form>
            <form
              action={otorgarAccesoTutorManual}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] p-4"
            >
              <input type="hidden" name="tutorId" value={t.id} />
              <p className="text-xs text-[var(--color-ink-soft)]">
                Acceso al portal:{" "}
                <span className={t.passwordHash ? "font-semibold text-[var(--color-green)]" : "font-semibold text-red-600"}>
                  {t.passwordHash ? "Ya tiene acceso" : "Todavía no tiene acceso"}
                </span>
              </p>
              <BotonGuardar
                textoGuardado="✓ Enviado"
                className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
              >
                {t.passwordHash ? "Reenviar credenciales" : "Otorgar acceso"}
              </BotonGuardar>
            </form>
          </details>
        ))}
        {tutores.length === 0 && (
          <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
            Aún no hay padres, madres o tutores registrados.
          </p>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
