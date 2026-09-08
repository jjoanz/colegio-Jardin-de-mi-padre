"use client";

import { useActionState } from "react";
import { BotonGuardar } from "@/components/BotonGuardar";

type EstadoEliminacion = { error?: string };

export function FormEliminarConEstado({
  action,
  idFieldName,
  idValue,
  label,
  className,
}: {
  action: (prevState: EstadoEliminacion, formData: FormData) => Promise<EstadoEliminacion>;
  idFieldName: string;
  idValue: string;
  label: string;
  className: string;
}) {
  const [estado, formAction] = useActionState(action, {});

  return (
    <div>
      <form action={formAction} className="inline">
        <input type="hidden" name={idFieldName} value={idValue} />
        <BotonGuardar textoGuardado="✓ Eliminado" className={className}>
          {label}
        </BotonGuardar>
      </form>
      {estado.error && <p className="mt-1.5 text-xs text-red-600">{estado.error}</p>}
    </div>
  );
}
