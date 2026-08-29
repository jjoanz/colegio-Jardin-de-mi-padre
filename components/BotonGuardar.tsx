"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

// Botón de submit para forms server-action (action={...}) que muestra
// "Guardando…" mientras la acción corre y "✓ Guardado" un momento después de
// que termina — sin tener que convertir cada form a useActionState. Debe ir
// DENTRO del <form> correspondiente (useFormStatus lee el form ancestro más
// cercano).
export function BotonGuardar({
  children = "Guardar",
  textoGuardando = "Guardando…",
  textoGuardado = "✓ Guardado",
  className = "",
  disabled = false,
  ...rest
}: {
  children?: React.ReactNode;
  textoGuardando?: string;
  textoGuardado?: string;
  className?: string;
  disabled?: boolean;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "disabled" | "className" | "children"
>) {
  const { pending } = useFormStatus();
  const [mostrarGuardado, setMostrarGuardado] = useState(false);
  const estabaPendiente = useRef(false);

  useEffect(() => {
    if (estabaPendiente.current && !pending) {
      setMostrarGuardado(true);
      const t = setTimeout(() => setMostrarGuardado(false), 2000);
      return () => clearTimeout(t);
    }
    estabaPendiente.current = pending;
  }, [pending]);

  return (
    <button type="submit" disabled={disabled || pending} className={className} {...rest}>
      {pending ? textoGuardando : mostrarGuardado ? textoGuardado : children}
    </button>
  );
}
