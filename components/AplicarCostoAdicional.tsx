"use client";

import { useState } from "react";

type CostoAdicional = { id: string; nombre: string; monto: number; nivelNombre: string };

export function AplicarCostoAdicional({
  costos,
  className,
}: {
  costos: CostoAdicional[];
  className: string;
}) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");

  function aplicar(costoId: string) {
    const costo = costos.find((c) => c.id === costoId);
    if (!costo) return;
    setDescripcion(costo.nombre);
    setMonto(String(costo.monto));
  }

  return (
    <>
      {costos.length > 0 && (
        <select
          className={className}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) aplicar(e.target.value);
          }}
        >
          <option value="">Aplicar costo adicional del catálogo (opcional)…</option>
          {costos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({c.nivelNombre}) — RD$ {c.monto.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
            </option>
          ))}
        </select>
      )}
      <input
        name="descripcion"
        placeholder="Descripción (ej. Cuido - Enero 2026)"
        required
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        className={className}
      />
      <input
        name="monto"
        type="number"
        step="0.01"
        placeholder="Monto (RD$)"
        required
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        className={className}
      />
    </>
  );
}
