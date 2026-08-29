export function WaveDivider({
  color,
  flip = false,
}: {
  color: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      className={`block h-[60px] w-full ${flip ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path
        d="M0,40 C240,90 480,0 720,30 C960,60 1200,10 1440,45 L1440,90 L0,90 Z"
        fill={color}
      />
    </svg>
  );
}