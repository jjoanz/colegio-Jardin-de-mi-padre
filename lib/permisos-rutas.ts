// Mapea cada sección del panel admin a su "módulo" de permisos.
// Cada pantalla tiene su PROPIO módulo — nada se comparte entre pantallas —
// así el control desde Roles y Permisos es 100% granular.
// Si agregas una pantalla nueva bajo /admin/(panel)/..., agrégala aquí Y
// en la lista MODULOS de app/admin/(panel)/roles/[id]/permisos/page.tsx.

export const RUTA_MODULO: Array<{ prefix: string; modulo: string }> = [
  { prefix: "/admin", modulo: "panel" }, // Panel general (dashboard) — el fallback más genérico
  { prefix: "/admin/solicitudes", modulo: "inscripciones" },
  { prefix: "/admin/estudiantes", modulo: "estudiantes" },
  { prefix: "/admin/padres", modulo: "padres" },
  { prefix: "/admin/aulas", modulo: "oferta_academica" },
  { prefix: "/admin/niveles", modulo: "niveles" },
  { prefix: "/admin/cuido", modulo: "cuido" },
  { prefix: "/admin/actividades", modulo: "actividades" },
  { prefix: "/admin/especiales", modulo: "especiales" },
  { prefix: "/admin/cargos", modulo: "cargos" },
  { prefix: "/admin/pagos", modulo: "pagos" },
  { prefix: "/admin/facturas", modulo: "facturas" },
  { prefix: "/admin/usuarios", modulo: "usuarios" },
  { prefix: "/admin/roles", modulo: "roles" },
  { prefix: "/admin/formulario-inscripcion", modulo: "formulario_inscripcion" },
  { prefix: "/admin/planificaciones", modulo: "academico" },
  { prefix: "/admin/asistencia", modulo: "asistencia" },
  { prefix: "/admin/gastos", modulo: "gastos" },
  { prefix: "/admin/cuentas", modulo: "cuentas_bancarias" },
  { prefix: "/admin/ingresos", modulo: "gastos" },
  { prefix: "/admin/horarios", modulo: "horarios" },
  { prefix: "/admin/anios-escolares", modulo: "oferta_academica" },
  { prefix: "/admin/materias", modulo: "oferta_academica" },
  { prefix: "/admin/publicaciones", modulo: "formulario_inscripcion" },
  { prefix: "/admin/contenido-sitio", modulo: "administracion" },
  { prefix: "/admin/poa-proyectos", modulo: "documentos_institucionales" },
  { prefix: "/admin/becas", modulo: "becas" },
  { prefix: "/admin/facturacion-automatica", modulo: "cargos" },
];

// Devuelve el módulo correspondiente a una ruta, usando el prefijo más
// específico (más largo) que haga match. "/admin" es el prefijo más corto
// de todos, así que solo gana cuando ningún otro más específico aplica
// (es decir, para el panel general en sí).
export function moduloParaRuta(pathname: string): string | null {
  const coincidencias = RUTA_MODULO.filter((r) => pathname.startsWith(r.prefix));
  if (coincidencias.length === 0) return null;
  const masEspecifica = coincidencias.sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return masEspecifica.modulo;
}
