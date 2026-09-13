import { Prisma } from "@prisma/client";

// El saldo real de un cargo nunca se calcula solo con Cargo.monto una vez que
// existen ajustes contables — Cargo.monto se conserva intacto por integridad
// histórica, y cada corrección (descuento, recargo, corrección de captura)
// se suma aquí. Un descuento se guarda con monto negativo, así que sumar
// siempre es correcto sin importar el tipo.
export function sumaAjustes(ajustes: { monto: Prisma.Decimal | number }[]): number {
  return ajustes.reduce((s, a) => s + Number(a.monto), 0);
}

export function montoEfectivoCargo(cargo: {
  monto: Prisma.Decimal | number;
  ajustes?: { monto: Prisma.Decimal | number }[];
}): number {
  return Number(cargo.monto) + sumaAjustes(cargo.ajustes ?? []);
}
