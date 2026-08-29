import { auth } from "@/lib/auth";

// Helper central para autorizar server actions. Lee la sesión, exige que el
// usuario tenga el permiso "modulo:accion" (según el mismo sistema granular
// que usa el middleware y la UI de Roles y Permisos) y devuelve el usuario
// autenticado. Lanza si falta sesión o permiso, para usar al inicio de
// cualquier acción que cree/edite/elimine/apruebe datos.
export async function requierePermiso(modulo: string, accion: "ver" | "crear" | "editar" | "eliminar") {
  const session = await auth();
  const usuario = session?.user as { id?: string; role?: string; permisos?: string[] } | undefined;
  if (!usuario?.id) {
    throw new Error("Debes iniciar sesión.");
  }
  if (!usuario.permisos?.includes(`${modulo}:${accion}`)) {
    throw new Error("No tienes permiso para realizar esta acción.");
  }
  return usuario;
}
