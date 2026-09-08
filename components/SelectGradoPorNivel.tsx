"use client";

import { useState } from "react";

type GradoOpcion = { id: string; nombre: string; nivelId: string };

export function SelectGradoPorNivel({
  grados,
  niveles,
  className,
}: {
  grados: GradoOpcion[];
  niveles: { id: string; nombre: string }[];
  className: string;
}) {
  const [nivelId, setNivelId] = useState("");
  const gradosDelNivel = grados.filter((g) => g.nivelId === nivelId);

  return (
    <>
      <select name="nivelId" required className={className} value={nivelId} onChange={(e) => setNivelId(e.target.value)}>
        <option value="">Nivel…</option>
        {niveles.map((n) => (
          <option key={n.id} value={n.id}>
            {n.nombre}
          </option>
        ))}
      </select>
      <select name="gradoId" className={className} disabled={gradosDelNivel.length === 0}>
        <option value="">
          {gradosDelNivel.length === 0 ? "Sin grados en este nivel" : "Sin grado específico"}
        </option>
        {gradosDelNivel.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nombre}
          </option>
        ))}
      </select>
    </>
  );
}
