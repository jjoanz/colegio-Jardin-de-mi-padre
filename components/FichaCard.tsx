export function FichaCard() {
  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-[var(--color-sun)] shadow-md" />
      <div className="absolute -bottom-5 -left-5 h-10 w-10 rounded-full bg-[var(--color-coral)] shadow-md" />

      <div className="blob-card relative border-4 border-white bg-white/90 p-6 shadow-[0_12px_0_var(--color-sky-deep)]">
        <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--color-cream-soft)] pb-3">
          <span className="rounded-full bg-[var(--color-sky)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-sky-deep)]">
            Ficha de inscripción
          </span>
          <span className="text-[11px] font-semibold text-[var(--color-ink-soft)]">
            N.º 000452
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Estudiante
            </p>
            <div className="mt-1 h-4 w-40 rounded-full bg-[var(--color-cream-soft)]" />
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                Nivel
              </p>
              <div className="mt-1 h-4 w-20 rounded-full bg-[var(--color-cream-soft)]" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                Año escolar
              </p>
              <div className="mt-1 h-4 w-20 rounded-full bg-[var(--color-cream-soft)]" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="rounded-full bg-[var(--color-leaf)]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-leaf-deep)]">
              Estado: activo
            </span>
            <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden>
              <circle cx="17" cy="17" r="15" fill="var(--color-sun)" opacity="0.2" />
              <path d="M10 17l4.5 5L24 12" fill="none" stroke="var(--color-leaf-deep)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}