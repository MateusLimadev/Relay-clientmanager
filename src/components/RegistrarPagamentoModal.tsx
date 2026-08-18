"use client";

import { useState } from "react";
import { inputClass, labelClass } from "@/components/ui";

export default function RegistrarPagamentoModal({
  assinaturaId,
  clienteNome,
  servidorNome,
  login,
  valorCliente,
  vencimentoSugerido,
  redirectTo,
  action,
  compact = false,
}: {
  assinaturaId: string;
  clienteNome: string;
  servidorNome: string;
  login: string;
  valorCliente: string;
  vencimentoSugerido: string;
  redirectTo: string;
  action: (formData: FormData) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [vencimento, setVencimento] = useState(vencimentoSugerido);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setVencimento(vencimentoSugerido);
          setOpen(true);
        }}
        className={
          compact
            ? "cursor-pointer text-[12.5px] font-bold text-success"
            : "cursor-pointer text-[13px] font-semibold text-success"
        }
      >
        Pagou
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-[22px]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-[17px] font-bold text-text">{clienteNome}</div>
                <div className="text-[12.5px] text-text-secondary">
                  {servidorNome} · login {login} · {valorCliente}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="cursor-pointer text-xl leading-none text-text-secondary"
              >
                ×
              </button>
            </div>

            <form
              action={action}
              onSubmit={(e) => {
                if (!window.confirm(`Registrar pagamento de ${clienteNome} até ${vencimento.split("-").reverse().join("/")}?`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={assinaturaId} />
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <label htmlFor={`vencimento-${assinaturaId}`} className={labelClass}>
                Pago até (próximo vencimento)
              </label>
              <input
                id={`vencimento-${assinaturaId}`}
                name="vencimento"
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                required
                className={inputClass}
              />

              <div className="mt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-[10px] border border-border px-4 py-2.5 text-[13.5px] font-semibold text-text hover:bg-border-soft"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-[10px] bg-success px-5 py-2.5 text-[13.5px] font-bold text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Confirmar pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
