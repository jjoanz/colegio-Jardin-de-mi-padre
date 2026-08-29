type PhotoSlotProps = {
  label: string;
  aspect?: "square" | "video" | "portrait" | "wide";
  className?: string;
  tone?: "sky" | "coral" | "leaf" | "sun";
};

const ASPECTS: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[4/5]",
  wide: "aspect-[16/7]",
};

const TONES: Record<string, string> = {
  sky: "from-[var(--color-sky)]/25 via-[var(--color-sky)]/5 to-transparent",
  coral: "from-[var(--color-coral)]/25 via-[var(--color-coral)]/5 to-transparent",
  leaf: "from-[var(--color-leaf)]/25 via-[var(--color-leaf)]/5 to-transparent",
  sun: "from-[var(--color-sun)]/25 via-[var(--color-sun)]/5 to-transparent",
};

export function PhotoSlot({ label, aspect = "video", tone = "sky", className = "" }: PhotoSlotProps) {
  return (
    <div
      className={`group relative flex ${ASPECTS[aspect]} items-center justify-center overflow-hidden rounded-[28px] bg-[#0B1220] ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${TONES[tone]}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/15">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/70">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M21 15l-5-5-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
          {label}
        </span>
      </div>
    </div>
  );
}
