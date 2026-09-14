import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { moduloParaRuta } from "@/lib/permisos-rutas";
import { SidebarResponsivo } from "@/components/SidebarResponsivo";
import { generarCargosPendientes } from "@/lib/generacion-cargos";

const NAV = [
  { href: "/admin", label: "Panel general", grupo: null },

  // --- Académico ---
  { href: "/admin/solicitudes", label: "Solicitudes de inscripción", grupo: "Académico" },
  { href: "/admin/estudiantes", label: "Estudiantes", grupo: "Académico" },
  { href: "/admin/padres", label: "Padres, madres y tutores", grupo: "Académico" },
  { href: "/admin/padres/importar", label: "Importar padres (masivo)", grupo: "Académico" },
  { href: "/admin/anios-escolares", label: "Años escolares", grupo: "Académico" },
  { href: "/admin/aulas", label: "Aulas", grupo: "Académico" },
  { href: "/admin/materias", label: "Materias", grupo: "Académico" },
  { href: "/admin/horarios", label: "Horarios", grupo: "Académico" },
  { href: "/admin/niveles", label: "Niveles y precios", grupo: "Académico" },
  { href: "/admin/cuido", label: "Programas de cuido", grupo: "Académico" },
  { href: "/admin/actividades", label: "Actividades y campamentos", grupo: "Académico" },
  { href: "/admin/especiales", label: "Especiales y promociones", grupo: "Académico" },
  { href: "/admin/formulario-inscripcion", label: "Formulario de inscripción", grupo: "Académico" },
  { href: "/admin/planificaciones", label: "Planificación docente", grupo: "Académico" },
  { href: "/admin/asistencia", label: "Asistencia", grupo: "Académico" },
  { href: "/admin/poa-proyectos", label: "POA y proyectos educativos", grupo: "Académico" },
  { href: "/admin/publicaciones", label: "Publicaciones", grupo: "Administración" },

  // --- Financiero ---
  { href: "/admin/cargos", label: "Registro de Cuentas por Cobrar", grupo: "Financiero" },
  { href: "/admin/cierres-periodo", label: "Cierres de períodos", grupo: "Financiero" },
  { href: "/admin/facturacion-automatica", label: "Facturación automática", grupo: "Financiero" },
  { href: "/admin/pagos", label: "Caja de Cobro", grupo: "Financiero" },
  { href: "/admin/facturas", label: "Facturas", grupo: "Financiero" },
  { href: "/admin/becas", label: "Becas", grupo: "Financiero" },
  { href: "/admin/gastos", label: "Gastos", grupo: "Financiero" },
  { href: "/admin/ingresos", label: "Ingresos", grupo: "Financiero" },
  { href: "/admin/cuentas", label: "Cuentas bancarias", grupo: "Financiero" },

  // --- Administración ---
  { href: "/admin/usuarios", label: "Usuarios", grupo: "Administración" },
  { href: "/admin/usuarios/importar", label: "Importar maestros (masivo)", grupo: "Administración" },
  { href: "/admin/roles", label: "Roles y permisos", grupo: "Administración" },
  { href: "/admin/contenido-sitio", label: "Contenido del sitio", grupo: "Administración" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  // Genera automáticamente las cuotas de colegiatura que ya vencieron, para
  // que nadie tenga que crearlas a mano ni depender de un cron externo.
  try {
    await generarCargosPendientes();
  } catch (error) {
    console.error("No se pudieron generar los cargos pendientes:", error);
  }

  const permisos = (session.user as { permisos?: string[] } | undefined)?.permisos ?? [];
  const navVisible = NAV.filter((item) => {
    const modulo = moduloParaRuta(item.href);
    if (!modulo) return true;
    return permisos.includes(`${modulo}:ver`);
  });

  // Agrupa el menú ya filtrado, preservando el orden y sin mostrar
  // encabezados de grupos que quedaron sin ningún ítem visible.
  const gruposOrdenados = ["Académico", "Financiero", "Administración"];
  const navAgrupado: { grupo: string | null; items: typeof NAV }[] = [];

  const sueltos = navVisible.filter((i) => !i.grupo);
  if (sueltos.length > 0) navAgrupado.push({ grupo: null, items: sueltos });

  for (const grupo of gruposOrdenados) {
    const items = navVisible.filter((i) => i.grupo === grupo);
    if (items.length > 0) navAgrupado.push({ grupo, items });
  }

  const botonCerrarSesion = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/admin/login" });
      }}
    >
      <button className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold)]">
        Cerrar sesión
      </button>
    </form>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper-dark)] md:flex-row">
      <SidebarResponsivo
        navAgrupado={navAgrupado}
        nombreUsuario={session.user?.name ?? undefined}
        cerrarSesion={botonCerrarSesion}
      />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
