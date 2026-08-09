import type { StatusServidor } from "@/lib/types";

const STYLES: Record<StatusServidor, { bg: string; color: string }> = {
  ativo: { bg: "var(--success-soft)", color: "var(--success)" },
  manutencao: { bg: "var(--warning-soft)", color: "var(--warning)" },
  offline: { bg: "var(--danger-soft)", color: "var(--danger)" },
};

const LABELS: Record<StatusServidor, string> = {
  ativo: "Ativo",
  manutencao: "Em manutenção",
  offline: "Offline",
};

export default function ServidorStatusBadge({ status }: { status: StatusServidor }) {
  const s = STYLES[status];
  return (
    <span
      style={{ background: s.bg, color: s.color }}
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-bold"
    >
      {LABELS[status]}
    </span>
  );
}
