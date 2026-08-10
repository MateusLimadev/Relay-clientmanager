type IconProps = { size?: number; className?: string };

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.7 } as const;

export function IconConfiguracoes({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.7v2.1M10 15.2v2.1M17.3 10h-2.1M4.8 10H2.7M15.2 4.8l-1.5 1.5M6.3 13.7l-1.5 1.5M15.2 15.2l-1.5-1.5M6.3 6.3L4.8 4.8" />
    </svg>
  );
}

export function IconDashboard({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.3" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.3" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.3" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.3" />
    </svg>
  );
}

export function IconAssinaturas({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
      <rect x="2.5" y="2.5" width="15" height="15" rx="2" />
      <line x1="6" y1="7.5" x2="14" y2="7.5" />
      <line x1="6" y1="11" x2="14" y2="11" />
      <line x1="6" y1="14.5" x2="10.5" y2="14.5" />
    </svg>
  );
}

export function IconVencimentos({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
      <circle cx="10" cy="10.5" r="7.3" />
      <line x1="10" y1="6.3" x2="10" y2="10.5" />
      <line x1="10" y1="10.5" x2="13" y2="12.3" />
    </svg>
  );
}

export function IconClientes({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
      <circle cx="7.2" cy="6.5" r="2.9" />
      <path d="M2 16c0-3 2.3-5 5.2-5s5.2 2 5.2 5" />
      <circle cx="14.3" cy="7.3" r="2.3" />
      <path d="M13 11.3c2.4.2 4 1.9 4 4.7" />
    </svg>
  );
}

export function IconServidores({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
      <rect x="2.5" y="2.7" width="15" height="4.4" rx="1.2" />
      <rect x="2.5" y="8.1" width="15" height="4.4" rx="1.2" />
      <rect x="2.5" y="13.5" width="15" height="4.4" rx="1.2" />
      <circle cx="5.3" cy="4.9" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="5.3" cy="10.3" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="5.3" cy="15.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBell({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
      <path d="M5 8.2c0-3 1.8-5 5-5s5 2 5 5c0 3 1 4 1.6 4.6H3.4C4 12.2 5 11.2 5 8.2z" />
      <path d="M8.3 15.4a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

export function IconMoon({ size = 15, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
      <path d="M14 10.5A6 6 0 0 1 7.5 4 6.5 6.5 0 1 0 14 10.5Z" />
    </svg>
  );
}

export function IconSun({ size = 15, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
      <circle cx="10" cy="10" r="3.4" />
      <line x1="10" y1="2.2" x2="10" y2="4.3" />
      <line x1="10" y1="15.7" x2="10" y2="17.8" />
      <line x1="2.2" y1="10" x2="4.3" y2="10" />
      <line x1="15.7" y1="10" x2="17.8" y2="10" />
      <line x1="4.5" y1="4.5" x2="6" y2="6" />
      <line x1="14" y1="14" x2="15.5" y2="15.5" />
      <line x1="15.5" y1="4.5" x2="14" y2="6" />
      <line x1="6" y1="14" x2="4.5" y2="15.5" />
    </svg>
  );
}

export function IconDots({ size = 19, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} {...base}>
      <circle cx="4" cy="10" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="10" cy="10" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconEye({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M2 10s2.8-5.5 8-5.5S18 10 18 10s-2.8 5.5-8 5.5S2 10 2 10z" />
      <circle cx="10" cy="10" r="2.3" />
    </svg>
  );
}

export function IconEyeOff({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M2 10s2.8-5.5 8-5.5S18 10 18 10s-2.8 5.5-8 5.5S2 10 2 10z" />
      <circle cx="10" cy="10" r="2.3" />
      <line x1="3" y1="17" x2="17" y2="3" />
    </svg>
  );
}
