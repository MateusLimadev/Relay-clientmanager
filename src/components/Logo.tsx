function LogoGlyph({ size }: { size: number }) {
  const inner = Math.round(size * (26 / 36) * 100) / 100;
  return (
    <svg width={inner} height={inner} viewBox="0 0 36 36">
      <path
        d="M9 5 A12.5 12.5 0 0 1 27 5"
        stroke="#0b0e14"
        strokeOpacity="0.3"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M12.5 8.7 A8 8 0 0 1 23.5 8.7"
        stroke="#0b0e14"
        strokeOpacity="0.5"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8 26 L18 13.5 L28 26"
        stroke="#0b0e14"
        strokeWidth="2.3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="26" r="2.4" fill="#0b0e14" />
      <circle cx="18" cy="13.5" r="2.7" fill="#0b0e14" />
      <circle cx="28" cy="26" r="2.4" fill="#0b0e14" />
    </svg>
  );
}

export function LogoMark({ size = 36, glow = false }: { size?: number; glow?: boolean }) {
  const radius = Math.round(size * (10 / 36) * 100) / 100;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "var(--accent)",
        boxShadow: glow ? "0 0 40px var(--accent-glow)" : undefined,
      }}
      className="flex items-center justify-center flex-shrink-0"
    >
      <LogoGlyph size={size} />
    </div>
  );
}

export default function Logo({ size = 36, wordmarkSize = 19 }: { size?: number; wordmarkSize?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span
        style={{ fontSize: wordmarkSize }}
        className="font-heading font-semibold tracking-tight text-text"
      >
        Relay
      </span>
    </div>
  );
}
