import type { Prisma } from "@prisma/client";

// Bitácora genérica y reutilizable — no existía ningún sistema de auditoría
// antes de esto. Cualquier módulo (no solo períodos) puede registrar aquí
// quién hizo qué, cuándo, y con qué motivo, sin crear una tabla nueva.
export async function registrarAuditoria(
  tx: Prisma.TransactionClient,
  datos: {
    entidad: string;
    entidadId: string;
    accion: string;
    usuarioId?: string | null;
    valorAnterior?: unknown;
    valorNuevo?: unknown;
    motivo?: string | null;
  }
) {
  await tx.registroAuditoria.create({
    data: {
      entidad: datos.entidad,
      entidadId: datos.entidadId,
      accion: datos.accion,
      usuarioId: datos.usuarioId ?? null,
      valorAnterior: datos.valorAnterior === undefined ? undefined : (datos.valorAnterior as object),
      valorNuevo: datos.valorNuevo === undefined ? undefined : (datos.valorNuevo as object),
      motivo: datos.motivo ?? null,
    },
  });
}
