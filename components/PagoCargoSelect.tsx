"use client";

import { useState } from "react";

type CargoPendiente = {
  id: string;
  descripcion: string;
  pendiente: number;
  estudianteNombre: string;
};

export function PagoCargoSelect({ cargos }: { cargos: CargoPendiente[] }) {
  const [monto, setMonto] = useState("");
  const [pendienteSeleccionado, setPendienteSeleccionado] = useState<number | null>(null);

  function onCargoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const cargo = cargos.find((c) => c.id === e.target.value);
    if (cargo) {
      setPendienteSeleccionado(cargo.pendiente);
      setMonto(cargo.pendiente.toFixed(2));
    } else {
      setPendienteSeleccionado(null);
      setMonto("");
    }
  }

  return (
    <>
      <select
        name="cargoId"
        required
        onChange={onCargoChange}
        className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]"
      >
        <option value="">Seleccionar cargo pendiente…</option>
        {cargos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.estudianteNombre} — {c.descripcion} (Pendiente: RD${" "}
            {c.pendiente.toLocaleString("es-DO", { minimumFractionDigits: 2 })})
          </option>
        ))}
      </select>

      {pendienteSeleccionado !== null && (
        <p className="text-xs font-semibold text-[var(--color-green)]">
          Pendiente por cobrar: RD${" "}
          {pendienteSeleccionado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
        </p>
      )}

      <input
        name="monto"
        type="number"
        step="0.01"
        placeholder="Monto recibido (RD$)"
        required
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]"
      />
    </>
  );
}
