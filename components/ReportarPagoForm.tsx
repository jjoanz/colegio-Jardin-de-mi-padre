"use client";

import { useState } from "react";
import { reportarPago } from "@/lib/actions-pagos-reportados";
import { BotonGuardar } from "@/components/BotonGuardar";

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";

export function ReportarPagoForm({ cargoId, saldoSugerido }: { cargoId: string; saldoSugerido: number }) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-white"
      >
        Reportar pago
      </button>
    );
  }

  return (
    <form
      action={reportarPago}
      className="mt-3 w-full space-y-2 rounded-lg border border-[var(--color-line)] bg-white p-3"
    >
      <input type="hidden" name="cargoId" value={cargoId} />
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
        Reportar pago de este cargo
      </p>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Monto pagado (RD$)
        <input
          name="monto"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={saldoSugerido.toFixed(2)}
          required
          className={inputClass}
        />
      </label>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Método de pago
        <select name="metodo" required defaultValue="ENLACE_PAGO_AZUL" className={inputClass}>
          <option value="ENLACE_PAGO_AZUL">Enlace de pago Azul</option>
          <option value="TRANSFERENCIA">Transferencia bancaria</option>
          <option value="EFECTIVO">Efectivo (en oficina)</option>
          <option value="CHEQUE">Cheque</option>
          <option value="OTRO">Otro</option>
        </select>
      </label>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Referencia / # de confirmación (opcional)
        <input name="referencia" className={inputClass} />
      </label>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Comprobante (foto o PDF, opcional)
        <input name="comprobante" type="file" accept="image/*,.pdf" className="mt-1 block text-sm" />
      </label>

      <label className="block text-xs text-[var(--color-ink-soft)]">
        Nota (opcional)
        <textarea name="notasTutor" rows={2} className={inputClass} />
      </label>

      <div className="flex gap-2">
        <BotonGuardar
          textoGuardado="✓ Reportado"
          className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          Enviar
        </BotonGuardar>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-lg px-4 py-2 text-xs font-bold text-[var(--color-ink-soft)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
