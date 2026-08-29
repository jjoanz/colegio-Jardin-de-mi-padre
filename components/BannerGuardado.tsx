"use client";

import { useEffect, useState } from "react";

export function BannerGuardado() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Quita el parámetro de la URL para que un refresh no lo vuelva a mostrar
    const url = new URL(window.location.href);
    url.searchParams.delete("guardado");
    window.history.replaceState({}, "", url.toString());

    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <p className="mt-4 rounded-lg bg-[var(--color-green)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--color-green)]">
      Asistencia guardada correctamente
    </p>
  );
}
