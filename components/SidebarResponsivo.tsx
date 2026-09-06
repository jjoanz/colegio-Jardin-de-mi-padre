"use client";

import { useState } from "react";
import Link from "next/link";

type NavItem = { href: string; label: string };
type NavGrupo = { grupo: string | null; items: NavItem[] };

export function SidebarResponsivo({
  navAgrupado,
  nombreUsuario,
  cerrarSesion,
}: {
  navAgrupado: NavGrupo[];
  nombreUsuario?: string;
  cerrarSesion: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      {/* Barra superior, solo visible en móvil */}
      <div className="flex items-center justify-between bg-[var(--color-green-deep)] px-4 py-3 text-white md:hidden print:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold">Acceder</span>
        </div>
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 hover:bg-white/10"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Fondo oscuro al abrir el drawer en móvil */}
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setAbierto(false)}
        />
      )}

      {/* Sidebar: drawer deslizante en móvil, fijo en escritorio */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 shrink-0 transform overflow-y-auto bg-[var(--color-green-deep)] text-white transition-transform duration-200 print:hidden md:static md:z-auto md:w-64 md:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-[family-name:var(--font-display)] text-base font-semibold">Acceder</p>
              <p className="mt-0.5 text-xs text-white/50">{nombreUsuario}</p>
            </div>
          </div>
          <button
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 hover:bg-white/10 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-4 px-3 pb-6">
          {navAgrupado.map((seccion, idx) => (
            <div key={seccion.grupo ?? `suelto-${idx}`}>
              {seccion.grupo && (
                <p className="px-3.5 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-white/40">
                  {seccion.grupo}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {seccion.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-6 py-6">{cerrarSesion}</div>
      </aside>
    </>
  );
}
