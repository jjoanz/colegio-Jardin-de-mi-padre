import Link from "next/link";
import { ImportarDocentesForm } from "@/components/ImportarDocentesForm";

export default function ImportarUsuariosPage() {
  return (
    <div>
      <Link href="/admin/usuarios" className="text-sm font-bold text-[var(--color-green)]">
        ← Usuarios del panel
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Importar maestros/personal en lote
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Sube un archivo Excel para crear varias cuentas del panel a la vez (maestros, secretaría,
        contabilidad, etc.). A cada usuario nuevo se le envía por correo su acceso (usuario =
        cédula o correo, contraseña temporal = cédula) y se le pide cambiarla al entrar.
      </p>

      <div className="mt-6">
        <a
          href="/api/usuarios/plantilla-importacion"
          className="inline-block rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
        >
          Descargar plantilla (.xlsx)
        </a>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          Columnas: Cedula, Nombre, Email, RolNombre (debe coincidir con un rol ya creado en
          Roles y permisos, ej. PROFESOR, SECRETARIA, CONTABILIDAD).
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <ImportarDocentesForm />
      </section>
    </div>
  );
}
