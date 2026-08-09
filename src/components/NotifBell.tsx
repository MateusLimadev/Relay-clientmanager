"use client";

import { useState } from "react";
import { IconBell } from "@/components/icons";
import { useNotif, type NotifItem } from "@/components/NotifContext";

const TONE_STYLES: Record<NotifItem["tone"], { bg: string; color: string }> = {
  danger: { bg: "var(--danger-soft)", color: "var(--danger)" },
  warning: { bg: "var(--warning-soft)", color: "var(--warning)" },
  accent: { bg: "var(--accent-soft)", color: "var(--accent)" },
};

export default function NotifBell({ className = "" }: { className?: string }) {
  const { items, urgentCount } = useNotif();
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-text-secondary md:h-[38px] md:w-[38px] md:rounded-[10px]"
      >
        <IconBell size={18} />
        {urgentCount > 0 && (
          <span
            style={{ background: "var(--danger)" }}
            className="absolute top-1.5 right-1.5 h-[7px] w-[7px] rounded-full"
          />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-card py-1.5 shadow-2xl">
            <div className="px-4 pt-2.5 pb-1.5 text-[12.5px] font-bold uppercase tracking-wide text-text-secondary">
              Vencimentos próximos
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-4 text-[13px] text-text-muted">Nada por aqui.</div>
            ) : (
              items.map((n, i) => {
                const style = TONE_STYLES[n.tone];
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2.5 border-t border-border-soft px-4 py-[9px]"
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-text">{n.client}</div>
                      <div className="text-xs text-text-muted">
                        {n.server} · {n.dueLabel}
                      </div>
                    </div>
                    <span
                      style={{ background: style.bg, color: style.color }}
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
                    >
                      {n.badgeLabel}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
