"use client";

import { useState } from "react";

export function Faq({ items }: { items: { pregunta: string; respuesta: string }[] }) {
  const [abierto, setAbierto] = useState<number | null>(0);

  return (
    <div className="divide-y divide-[var(--color-ink)]/8 rounded-3xl border border-[var(--color-ink)]/8 bg-white">
      {items.map((item, i) => {
        const isOpen = abierto === i;
        return (
          <div key={i}>
            <button
              onClick={() => setAbierto(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-semibold text-[var(--color-ink)]">{item.pregunta}</span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream)] transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div
              className="grid overflow-hidden transition-all duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {item.respuesta}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
