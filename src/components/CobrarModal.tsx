"use client";

import { useState } from "react";
import { buildWhatsAppLink } from "@/lib/format";
import { inputClass } from "@/components/ui";
import { gerarCobrancaAssinaturasAction } from "@/app/(painel)/pagamentos/actions";

export default function CobrarModal({
  clienteNome,
  telefone,
  mensagemPadrao,
  assinaturaIds,
  compact = false,
}: {
  clienteNome: string;
  telefone: string;
  mensagemPadrao: string;
  assinaturaIds: string[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mensagem, setMensagem] = useState(mensagemPadrao);
  const [gerando, setGerando] = useState(false);
  const [erroLink, setErroLink] = useState<string | null>(null);
  const [linkGerado, setLinkGerado] = useState(false);

  const link = buildWhatsAppLink(telefone, mensagem);

  async function handleGerarLink() {
    setGerando(true);
    setErroLink(null);
    const resultado = await gerarCobrancaAssinaturasAction(assinaturaIds);
    setGerando(false);
    if (!resultado.ok) {
      setErroLink(resultado.erro);
      return;
    }
    const linkPagamento = resultado.ticketUrl ?? resultado.copiaECola;
    setMensagem((atual) => `${atual}\n\nPague com Pix: ${linkPagamento}`);
    setLinkGerado(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMensagem(mensagemPadrao);
          setLinkGerado(false);
          setErroLink(null);
          setOpen(true);
        }}
        className={
          compact
            ? "cursor-pointer text-[12.5px] font-bold text-accent"
            : "cursor-pointer rounded-lg bg-accent px-3.5 py-[7px] text-[12.5px] font-bold text-accent-foreground"
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
                className="cursor-pointer text-xl leading-none text-text-secondary"
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
              rows={Math.min(14, mensagem.split("\n").length + 1)}
              className={`${inputClass} resize-y font-mono text-[12.5px]`}
            />

            <div className="mt-2.5">
              <button
                type="button"
                onClick={handleGerarLink}
                disabled={gerando || linkGerado}
                className="cursor-pointer rounded-[10px] border border-border px-4 py-2 text-[13px] font-semibold text-text hover:bg-border-soft disabled:cursor-default disabled:opacity-60"
              >
                {gerando ? "Gerando cobrança Pix…" : linkGerado ? "Link Pix gerado ✓" : "Gerar link de pagamento Pix"}
              </button>
              {erroLink && <p className="mt-1.5 text-[12.5px] text-danger">{erroLink}</p>}
            </div>

            <div className="mt-4 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-[10px] border border-border px-4 py-2.5 text-[13.5px] font-semibold text-text hover:bg-border-soft"
              >
                Cancelar
              </button>
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    if (!window.confirm(`Abrir o WhatsApp e mandar essa mensagem pra ${clienteNome}?`)) {
                      e.preventDefault();
                      return;
                    }
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-[10px] bg-accent px-5 py-2.5 text-[13.5px] font-bold text-accent-foreground transition-opacity hover:opacity-90"
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
