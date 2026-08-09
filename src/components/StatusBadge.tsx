import type { StatusAssinatura } from "@/lib/types";

const STYLES: Record<StatusAssinatura, { bg: string; color: string }> = {
  ativa: { bg: "var(--success-soft)", color: "var(--success)" },
  vencida: { bg: "var(--danger-soft)", color: "var(--danger)" },
  cancelada: { bg: "var(--border-soft)", color: "var(--text-secondary)" },
  teste: { bg: "var(--warning-soft)", color: "var(--warning)" },
  gratuita: { bg: "var(--violet-soft)", color: "var(--violet)" },
};

const LABELS: Record<StatusAssinatura, string> = {
  ativa: "Ativa",
  vencida: "Vencida",
  cancelada: "Cancelada",
  teste: "Teste",
  gratuita: "Gratuita",
};

export default function StatusBadge({ status }: { status: StatusAssinatura }) {
  const s = STYLES[status];
  return (
    <span
      style={{ background: s.bg, color: s.color }}
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11.5px] font-bold"
    >
      {LABELS[status]}
    </span>
  );
}
