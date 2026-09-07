import { Prisma, EstadoCargo, TipoPago, MetodoPago } from "@prisma/client";

// ---------------------------------------------------------------------------
// LÓGICA COMPARTIDA DE REGISTRO DE PAGO + FACTURA
//
// La usan registrarPago/registrarPagosMultiples (lib/actions.ts, cobro
// manual del personal) y confirmarPagoReportado (lib/actions-pagos-reportados.ts,
// cuando el personal confirma un pago que un padre reportó desde el portal).
// ---------------------------------------------------------------------------

export async function siguienteNumeroFactura(tx: Prisma.TransactionClient) {
  const anio = new Date().getFullYear();
  const total = await tx.factura.count();
  return `FAC-${anio}-${String(total + 1).padStart(6, "0")}`;
}

export async function crearPagoYFactura(
  tx: Prisma.TransactionClient,
  params: {
    cargoId: string;
    cuentaId?: string | null;
    monto: number;
    metodo: MetodoPago;
    referencia?: string;
    notas?: string;
    registradoPorId?: string;
  }
) {
  const { cargoId, cuentaId = null, monto, metodo, referencia = "", notas = "", registradoPorId } = params;

  const cargoAntes = await tx.cargo.findUniqueOrThrow({
    where: { id: cargoId },
    include: { pagos: true },
  });
  const totalPagadoAntes = cargoAntes.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
  const totalPagadoDespues = totalPagadoAntes + monto;

  // Si este pago completa el 100% del cargo, es "pago total"; si deja saldo, es "abono".
  const tipoPago: TipoPago = totalPagadoDespues >= Number(cargoAntes.monto) ? "PAGO_TOTAL" : "ABONO";

  const pago = await tx.pago.create({
    data: {
      cargoId,
      cuentaId,
      monto,
      tipoPago,
      metodo,
      referencia,
      notas,
      registradoPorId,
    },
  });

  const nuevoEstado: EstadoCargo =
    totalPagadoDespues >= Number(cargoAntes.monto)
      ? EstadoCargo.PAGADO
      : totalPagadoDespues > 0
      ? EstadoCargo.PARCIAL
      : EstadoCargo.PENDIENTE;

  await tx.cargo.update({ where: { id: cargoId }, data: { estado: nuevoEstado } });

  // Cada pago recibido genera su propia factura, vinculada al expediente del alumno.
  // Los servicios educativos están exentos de ITBIS en RD, por eso el impuesto es 0
  // por defecto (se deja el campo listo para cuando aplique otro tipo de cargo).
  const factura = await tx.factura.create({
    data: {
      numeroFactura: await siguienteNumeroFactura(tx),
      pagoId: pago.id,
      estudianteId: cargoAntes.estudianteId,
      concepto: cargoAntes.descripcion,
      montoSubtotal: monto,
      itbis: 0,
      montoTotal: monto,
    },
  });

  // Si se eligió una cuenta bancaria, este pago también se acredita ahí.
  if (cuentaId) {
    await tx.movimientoBancario.create({
      data: {
        cuentaId,
        tipo: "DEPOSITO",
        monto,
        descripcion: `Pago recibido: ${cargoAntes.descripcion}`,
        pagoId: pago.id,
        registradoPorId,
      },
    });
  }

  return {
    pago,
    factura,
    estudianteId: cargoAntes.estudianteId,
    descripcion: cargoAntes.descripcion,
  };
}
