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
  const isRecuperarPage = pathname === "/admin/recuperar-password";
  const isPaginaPublicaAdmin = isLoginPage || isRecuperarPage;
  const isSinAccesoPage = pathname === "/admin/sin-acceso";
  const isCambiarPasswordAdmin = pathname === "/admin/cambiar-password";
  const isAdminRoute = pathname.startsWith("/admin");
  const isPanelGeneral = pathname === "/admin";
  const isPortalRoute = pathname.startsWith("/portal");
  const isCambiarPasswordPortal = pathname === "/portal/cambiar-password";

  const usuario = req.auth?.user as
    | { permisos?: string[]; tipoUsuario?: string; debeCambiarPassword?: boolean }
    | undefined;
  const esPadre = usuario?.tipoUsuario === "PADRE";
  const esStaff = usuario?.tipoUsuario === "STAFF";

  // El portal de padres tiene su propia guardia de sesión y de cambio forzado.
  if (isPortalRoute) {
    if (!isLoggedIn || !esPadre) {
      return NextResponse.redirect(new URL("/admin/login", req.nextUrl.origin));
    }
    if (usuario?.debeCambiarPassword && !isCambiarPasswordPortal) {
      return NextResponse.redirect(new URL("/portal/cambiar-password", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Un padre autenticado no debe poder ver el panel de personal.
  if (isAdminRoute && !isPaginaPublicaAdmin && isLoggedIn && esPadre) {
    return NextResponse.redirect(new URL("/portal", req.nextUrl.origin));
  }

  if (isAdminRoute && !isPaginaPublicaAdmin && !isLoggedIn) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && !isPaginaPublicaAdmin && isLoggedIn && esStaff) {
    if (usuario?.debeCambiarPassword && !isCambiarPasswordAdmin) {
      return NextResponse.redirect(new URL("/admin/cambiar-password", req.nextUrl.origin));
    }
  }

  if (isAdminRoute && !isPaginaPublicaAdmin && !isSinAccesoPage && !isCambiarPasswordAdmin && isLoggedIn) {
    const permisos = usuario?.permisos ?? [];

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
  matcher: ["/admin/:path*", "/portal/:path*"],
};
