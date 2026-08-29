export const dynamic = "force-dynamic";

const NOMBRES_MODULO: Record<string, string> = {
  panel: "el Panel general",
  inscripciones: "Inscripciones",
  estudiantes: "Estudiantes",
  padres: "Padres, madres y tutores",
  academico: "Académico",
  asistencia: "Asistencia",
  administrativo: "Administrativo",
  cobros: "Cobros",
  facturas: "Facturas",
  administracion: "Administración",
};

export default async function SinAccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string }>;
}) {
  const { modulo } = await searchParams;

  if (modulo === "ninguno") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-paper-dark)] text-2xl">
            
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
            Tu cuenta aún no tiene módulos asignados
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Pide a un administrador que revise tu rol en Roles y permisos y te habilite al menos
            una sección.
          </p>
        </div>
      </div>
    );
  }

  const nombreModulo = (modulo && NOMBRES_MODULO[modulo]) || "esta sección";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-paper-dark)] text-2xl">
          
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
          No tienes acceso a {nombreModulo}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Tu rol no tiene permiso para ver esta sección. Si crees que es un error, pide a un
          administrador que revise tus permisos en Roles y permisos.
        </p>
      </div>
    </div>
  );
}
