import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { moduloParaRuta } from "@/lib/permisos-rutas";

// Orden preferido para buscar "el primer módulo al que este usuario sí
// tiene acceso", usado cuando cae en /admin (el panel general) pero no
// tiene permiso para verlo. Si agregas una pantalla nueva, agrégala aquí.
const RUTAS_EN_ORDEN = [
  "/admin/solicitudes",
  "/admin/estudiantes",
  "/admin/padres",
  "/admin/aulas",
  "/admin/niveles",
  "/admin/cuido",
  "/admin/actividades",
  "/admin/especiales",
  "/admin/cargos",
  "/admin/pagos",
  "/admin/facturas",
  "/admin/usuarios",
  "/admin/roles",
  "/admin/asistencia",
  "/admin/planificaciones",
  "/admin/poa-proyectos",
  "/admin/becas",
  "/admin/facturacion-automatica",
  "/admin/gastos",
  "/admin/cuentas",
  "/admin/ingresos",
  "/admin/horarios",
  "/admin/anios-escolares",
  "/admin/materias",
  "/admin/publicaciones",
  "/admin/contenido-sitio",
  "/admin/formulario-inscripcion",
];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isLoginPage = pathname === "/admin/login";
  const isSinAccesoPage = pathname === "/admin/sin-acceso";
  const isAdminRoute = pathname.startsWith("/admin");
  const isPanelGeneral = pathname === "/admin";

  if (isAdminRoute && !isLoginPage && !isLoggedIn) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && !isLoginPage && !isSinAccesoPage && isLoggedIn) {
    const permisos = (req.auth?.user as { permisos?: string[] } | undefined)?.permisos ?? [];

    // Caso especial: si cae en el panel general (destino por defecto tras
    // el login) pero no tiene permiso para verlo, no le mostramos un error
    // — lo mandamos directo a la primera sección que sí pueda usar.
    if (isPanelGeneral && !permisos.includes("panel:ver")) {
      const primeraRutaPermitida = RUTAS_EN_ORDEN.find((ruta) => {
        const mod = moduloParaRuta(ruta);
        return mod && permisos.includes(`${mod}:ver`);
      });

      const destino = primeraRutaPermitida
        ? new URL(primeraRutaPermitida, req.nextUrl.origin)
        : (() => {
            const url = new URL("/admin/sin-acceso", req.nextUrl.origin);
            url.searchParams.set("modulo", "ninguno");
            return url;
          })();

      return NextResponse.redirect(destino);
    }

    const modulo = moduloParaRuta(pathname);
    if (modulo) {
      const tienePermiso = permisos.includes(`${modulo}:ver`);
      if (!tienePermiso) {
        const sinAccesoUrl = new URL("/admin/sin-acceso", req.nextUrl.origin);
        sinAccesoUrl.searchParams.set("modulo", modulo);
        return NextResponse.redirect(sinAccesoUrl);
      }
    }
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
