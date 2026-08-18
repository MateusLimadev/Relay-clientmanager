"use client";

import { useEffect, useState } from "react";
import { formatDate, formatMoney } from "@/lib/format";
import type { PagamentoCliente } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; pagamentos: PagamentoCliente[] };

export default function HistoricoModal({ clienteId, clienteNome }: { clienteId: string; clienteNome: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Reset para "loading" antes de buscar os dados desta abertura do modal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "loading" });
    fetch(`/api/clientes/${clienteId}/historico`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.ok) setState({ status: "ok", pagamentos: json.pagamentos });
        else setState({ status: "error", message: json.error || "Falha ao buscar histórico." });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "Falha ao buscar histórico." });
      });
    return () => {
      cancelled = true;
    };
  }, [open, clienteId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-[13px] font-semibold text-accent"
      >
        Histórico
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-card p-[22px]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-[17px] font-bold text-text">{clienteNome}</div>
                <div className="text-[12.5px] text-text-secondary">Histórico de pagamentos</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="text-xl leading-none text-text-secondary"
              >
                ×
              </button>
            </div>

            {state.status === "loading" && <p className="py-6 text-center text-[13px] text-text-muted">Carregando…</p>}
            {state.status === "error" && <p className="py-6 text-center text-[13px] text-danger">{state.message}</p>}
            {state.status === "ok" && state.pagamentos.length === 0 && (
              <p className="py-6 text-center text-[13px] text-text-muted">Nenhum pagamento registrado ainda.</p>
            )}
            {state.status === "ok" && state.pagamentos.length > 0 && (
              <div className="flex flex-col gap-2">
                {state.pagamentos.map((h) => (
                  <div key={h.id} className="flex items-center justify-between border-t border-border-soft py-2.5">
                    <div>
                      <div className="text-[13.5px] font-semibold text-text">{formatDate(h.data)}</div>
                      <div className="text-xs text-text-muted">
                        {h.servidorNome}
                        {h.login ? ` · ${h.login}` : ""}
                      </div>
                    </div>
                    <div className="text-[14px] font-bold text-success">{formatMoney(h.valor)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
