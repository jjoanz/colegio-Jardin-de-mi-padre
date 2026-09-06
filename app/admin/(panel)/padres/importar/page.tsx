import Link from "next/link";
import { ImportarTutoresForm } from "@/components/ImportarTutoresForm";

export default function ImportarPadresPage() {
  return (
    <div>
      <Link href="/admin/padres" className="text-sm font-bold text-[var(--color-green)]">
        ← Padres, madres y tutores
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
        Importar padres/tutores en lote
      </h1>
      <p className="mt-1 text-[var(--color-ink-soft)]">
        Sube un archivo Excel para crear o actualizar varios padres/tutores a la vez y vincularlos
        con sus hijos. A cada tutor nuevo se le crea automáticamente su acceso al portal y se le
        envía por correo (usuario = cédula o correo, contraseña temporal = cédula).
      </p>

      <div className="mt-6">
        <a
          href="/api/padres/plantilla-importacion"
          className="inline-block rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
        >
          Descargar plantilla (.xlsx)
        </a>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          Columnas: Cedula, Nombre, Apellido, Telefono, Email, ExpedienteEstudiante, Parentesco
          (PADRE, MADRE, TUTOR_LEGAL u OTRO). ExpedienteEstudiante es el número de expediente del
          hijo ya registrado (ej. EST-2026-000001) — si se deja vacío, el tutor se crea sin
          vincular a ningún estudiante todavía.
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <ImportarTutoresForm />
      </section>
    </div>
  );
}
