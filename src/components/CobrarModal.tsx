"use client";

import { useState } from "react";
import { buildWhatsAppLink } from "@/lib/format";
import { inputClass } from "@/components/ui";

export default function CobrarModal({
  clienteNome,
  telefone,
  mensagemPadrao,
  compact = false,
}: {
  clienteNome: string;
  telefone: string;
  mensagemPadrao: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mensagem, setMensagem] = useState(mensagemPadrao);

  const link = buildWhatsAppLink(telefone, mensagem);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMensagem(mensagemPadrao);
          setOpen(true);
        }}
        className={
          compact
            ? "text-[12.5px] font-bold text-accent"
            : "rounded-lg bg-accent px-3.5 py-[7px] text-[12.5px] font-bold text-accent-foreground"
        }
      >
        Cobrar
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[460px] rounded-2xl border border-border bg-card p-[22px]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-[17px] font-bold text-text">{clienteNome}</div>
                <div className="text-[12.5px] text-text-secondary">
                  {telefone || "sem telefone cadastrado"}
                </div>
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

            <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
              Mensagem (pode editar antes de enviar)
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={Math.min(12, mensagem.split("\n").length + 1)}
              className={`${inputClass} resize-y font-mono text-[12.5px]`}
            />

            <div className="mt-4 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-[10px] border border-border px-4 py-2.5 text-[13.5px] font-semibold text-text hover:bg-border-soft"
              >
                Cancelar
              </button>
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="rounded-[10px] bg-accent px-5 py-2.5 text-[13.5px] font-bold text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Abrir WhatsApp
                </a>
              ) : (
                <span className="text-[13px] text-danger">Sem telefone válido pra esse cliente.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
